#!/usr/bin/env python3
"""Build the selected portfolio from the website's texts, fonts and images.

Requires reportlab and Pillow. SVG logos use the installed Node sharp package.
Run from the repo root; NODE_PATH can point at the bundled workspace packages.
"""
from __future__ import annotations

import argparse
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
from xml.sax.saxutils import escape

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
TEMP = ROOT / 'tmp/pdfs/portfolio/assets'
W, H = landscape(A4)
M = 36
SITE = 'https://www.leonalbers.de'
PURPLE = '#6b0498'
LIME = '#c0e056'
CREAM = '#f2efe9'
PROJECTS = ['Reefresh', 'Uebergangsobjekte', 'Migration', 'Kilma']
MEDIA = {
    'Reefresh': ['01-reefresh-website.webp', '02-reefresh-archiv.webp', '03-reefresh-zeichenstation.webp'],
    'Uebergangsobjekte': ['Leon2287-klein.webp', 'Leon2226-klein.webp', 'Leon2257-klein.webp', 'Leon2037-klein.webp'],
    'Migration': ['02 Kopie.webp', 'HRS01499.webp', 'zz-migration-bts-07-loops.webp'],
    'Kilma': ['DSC00707.webp', 'Kilma1.webp', 'Kilma2.webp', 'Kilma3.webp', 'Kilma4.webp'],
}
CAPTIONS = {
    'Reefresh': ['Zukunftskorallen auf reefresh.org.', 'Das interaktive Korallenarchiv.', 'Zeichenstation: Jede Geschichte beginnt mit derselben Vorlage.'],
    'Uebergangsobjekte': ['Vier Spielzeuge zwischen Erinnerung und Smartphone-Kultur.', 'Die Figuren in ihren eigens gestalteten Blisterverpackungen.', 'Übergangsobjekte in der Ausstellung.'],
    'Migration': ['Besucher:innen an der interaktiven Installation.', 'Drei Fluchtrouten auf einem bewusst kindlich gestalteten Tisch.', 'Motorikschleifen während der Herstellung.'],
    'Kilma': ['Kilma als Android-App.', 'Startscreen und Minispiele der App.'],
}


def clean(text: str) -> str:
    text = re.sub(r'\[([^]]+)\]\([^)]+\)', r'\1', text)
    text = re.sub(r'<[^>]*>', '', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    return text.replace('–', '-').replace('—', '-').replace('\u2011', '-').strip()


def read_project(slug: str) -> dict:
    raw = (DOCS / 'works' / slug / 'index.md').read_text()
    front, body = raw.split('---', 2)[1:]
    meta = {}
    for key in ['title', 'summary', 'format', 'role', 'website']:
        match = re.search(rf'^{key}:\s*(.+)$', front, re.M)
        if match:
            meta[key] = clean(match[1].strip().strip('"'))
    meta['year'] = re.search(r'^#####\s+(\d{4})', body, re.M)[1]
    meta['sections'] = {}
    for heading, section in re.findall(r'^## ([^\n]+)\n([\s\S]*?)(?=^## |\Z)', body, re.M):
        section = re.split(r'^#####', section, flags=re.M)[0]
        meta['sections'][heading] = [clean(p) for p in section.strip().split('\n\n') if clean(p) and not p.startswith('<a ')]
    meta['slug'] = slug
    return meta


def register_fonts():
    folder = Path('/System/Library/Fonts/Supplemental')
    for name, filename in [('Body', 'Arial.ttf'), ('BodyBold', 'Arial Bold.ttf'), ('Serif', 'Georgia.ttf'), ('SerifItalic', 'Georgia Italic.ttf')]:
        pdfmetrics.registerFont(TTFont(name, str(folder / filename)))
    pdfmetrics.registerFontFamily('Body', normal='Body', bold='BodyBold', italic='Body', boldItalic='BodyBold')
    pdfmetrics.registerFont(TTFont('Label', str(DOCS / 'fonts/Montserrat-Medium.ttf')))


def label(c, text, x, y, color=LIME, size=8):
    c.saveState()
    c.setFillColor(colors.HexColor(color))
    obj = c.beginText(x, y)
    obj.setFont('Label', size)
    obj.setCharSpace(1.25)
    obj.textOut(clean(text).upper())
    c.drawText(obj)
    c.restoreState()


def paragraph(c, text, x, top, width, size=11.4, leading=16, color=LIME, font='Body', max_height=None):
    style = ParagraphStyle('copy', fontName=font, fontSize=size, leading=leading, textColor=colors.HexColor(color), alignment=TA_LEFT, splitLongWords=False, allowWidows=0, allowOrphans=0)
    p = Paragraph(escape(clean(text)), style)
    _, height = p.wrap(width, H)
    if max_height is not None and height > max_height + 0.1:
        raise ValueError(f'Text exceeds its box ({height:.1f} > {max_height}): {text[:60]}')
    p.drawOn(c, x, top-height)
    return top-height


def link(c, text, url, x, y, color=LIME, size=10.5, internal=False):
    c.setFillColor(colors.HexColor(color))
    c.setFont('Body', size)
    c.drawString(x, y, text)
    width = pdfmetrics.stringWidth(text, 'Body', size)
    c.setStrokeColor(colors.HexColor(color))
    c.setLineWidth(.45)
    c.line(x, y-3, x+width, y-3)
    rect = (x, y-5, x+width, y+size)
    if internal:
        c.linkRect('', url, rect, relative=0, thickness=0)
    else:
        c.linkURL(url, rect, relative=0, thickness=0)


def base(c, number, title, bg=PURPLE, fg=LIME):
    c.setFillColor(colors.HexColor(bg))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(colors.HexColor(fg))
    c.setFont('SerifItalic', 14)
    c.drawString(M, H-36, 'Leon Albers')
    label(c, title, W-290, H-34, fg, 7.5)
    c.setFont('Body', 8)
    c.drawString(M, 23, 'leonalbers.de')
    c.linkURL(SITE, (M, 19, M+85, 34), thickness=0)
    c.drawRightString(W-M, 23, f'{number:02d} / 12')
    if number > 1:
        link(c, 'Übersicht', 'contents', W/2-20, 23, fg, 8, internal=True)


def prepare_logo(slug):
    src = DOCS / 'public/images/project-logos' / ('corals-logo.svg' if slug == 'Reefresh' else 'kilma-logo-filled.png')
    out = TEMP / f'{slug}-logo.png'
    if src.suffix == '.svg':
        script = "const sharp=require('sharp');sharp(process.argv[1],{density:200}).resize({width:1800}).png().toFile(process.argv[2]);"
        subprocess.run(['node', '-e', script, str(src), str(out)], check=True)
    else:
        shutil.copyfile(src, out)
    im = Image.open(out).convert('RGBA')
    # Use the actual logo silhouette, recoloured in the site's yellow-green.
    tinted = Image.new('RGBA', im.size, LIME)
    alpha = im.getchannel('A')
    if slug == 'Kilma':
        # The source contains opaque white lettering: retain it as negative space.
        ink = ImageChops.subtract(im.getchannel('R'), im.getchannel('G')).point(lambda value: min(255, value * 255 // 210))
        alpha = ImageChops.multiply(alpha, ink)
    tinted.putalpha(alpha)
    bbox = tinted.getbbox()
    tinted.crop(bbox).save(out)
    return out


def title_image(slug, text):
    if slug in ['Reefresh', 'Kilma']:
        return prepare_logo(slug)
    path = TEMP / f'{slug}-title.png'
    size = 190
    filename = 'Migration.otf' if slug == 'Migration' else 'Uebergangsobjekte.otf'
    font = ImageFont.truetype(str(DOCS / 'fonts' / filename), size)
    patch = ImageFont.truetype(str(DOCS / 'fonts/Uebergangsobjekte-umlaut.otf'), size)
    im = Image.new('RGBA', (3200, 450))
    draw = ImageDraw.Draw(im)
    x = 25
    for char in text:
        face = patch if char == 'Ü' else font
        draw.text((x, 275), char, font=face, fill=LIME, anchor='ls')
        x += face.getlength(char)
    im = im.crop(im.getbbox())
    im.save(path)
    return path


def picture(c, path, x, top, width, height, fit='contain', caption=None):
    im = Image.open(path).convert('RGB')
    if fit == 'cover':
        im = ImageOps.fit(im, (int(width*2.5), int(height*2.5)), Image.Resampling.LANCZOS)
        iw, ih = width, height
    else:
        ratio = min(width/im.width, height/im.height)
        iw, ih = im.width*ratio, im.height*ratio
    px, py = x+(width-iw)/2, top-ih
    im.thumbnail((2000, 1500), Image.Resampling.LANCZOS)
    data = io.BytesIO()
    im.save(data, format='JPEG', quality=87, optimize=True)
    c.drawImage(ImageReader(data), px, py, iw, ih)
    if caption:
        paragraph(c, caption, x, py-9, width, size=8, leading=11)
    return py


def title(c, project, x, top, width, height):
    path = title_image(project['slug'], project['title'] if project['slug'] != 'Reefresh' else 'REEFRESH')
    im = Image.open(path)
    ratio = min(width/im.width, height/im.height)
    c.drawImage(ImageReader(im), x, top-im.height*ratio, im.width*ratio, im.height*ratio, mask='auto')


def media_path(slug, index):
    return DOCS / 'works' / slug / MEDIA[slug][index]


def cover(c):
    base(c, 1, 'Portfolio / 2026', LIME, PURPLE)
    c.bookmarkPage('cover')
    c.addOutlineEntry('Leon Albers - Portfolio', 'cover', level=0)
    c.setFillColor(colors.HexColor(PURPLE))
    c.setFont('SerifItalic', 72)
    c.drawString(M-3, H-160, 'Leon Albers')
    label(c, 'Creative Designer / Storyteller / Creative Coder', M, H-195, PURPLE, 9)
    paragraph(c, 'Ich liebe es, Geschichten zu erzählen.', M, H-225, 400, 22, 28, PURPLE, 'SerifItalic')
    # Three photographs and the digital coral world introduce the four works.
    x, y, gap = M, 252, 10
    tile_w = (W-2*M-3*gap)/4
    for slug in PROJECTS:
        picture(c, media_path(slug, 0), x, y, tile_w, 137, fit='cover')
        x += tile_w+gap
    label(c, 'Vier Projekte. Viele Wege, eine Idee sichtbar zu machen.', M, 77, PURPLE, 8)
    c.showPage()


def about(c):
    base(c, 2, 'Über mich')
    c.bookmarkPage('about')
    c.addOutlineEntry('Über mich', 'about', level=0)
    c.setFillColor(colors.HexColor(LIME))
    c.setFont('SerifItalic', 45)
    for i, line in enumerate(['Ich liebe es,', 'Geschichten', 'zu erzählen.']):
        c.drawString(M, 465-i*54, line)
    intro = 'Ich bin Leon Albers und studiere Digitale Medien an der HfK Bremen. Ich liebe es, Geschichten zu erzählen und Ideen eine Form zu geben. Als Creative Designer suche ich dafür immer wieder neue Wege - mit Film, interaktiven Arbeiten, Code oder KI.'
    paragraph(c, intro, M, 258, 343, 12.5, 18, max_height=165)
    x, width, y = 454, W-M-454, 495
    groups = [
        ('Ausbildung', [('HfK Bremen - Digitale Medien (B.A.)', 'Seit 2023'), ('Mediengestalter - Konzeption & Visualisierung', 'Ausbildung, 2018-2021')]),
        ('Berufserfahrung', [('manymany motion GmbH - Motion Designer', 'Seit 2021')]),
        ('Ausstellungen', [('BINOMIALS / Barcelona / 2026', 'Gruppenausstellung mit REEFRESH beim 9th International Symposium on Deep-Sea Corals.'), ('Local Dreamer / Nordenham / 2019', 'Einzelausstellung: Malerei, Fotografien und grafisch bearbeitete Arbeiten.')]),
    ]
    for heading, entries in groups:
        label(c, heading, x, y)
        y -= 22
        for heading, detail in entries:
            y = paragraph(c, heading, x, y, width, 10.8, 14, font='BodyBold')-5
            y = paragraph(c, detail, x, y, width, 10.3, 14)-17
        y -= 12
    c.showPage()


def contents(c, projects):
    base(c, 3, 'Die Auswahl', LIME, PURPLE)
    c.bookmarkPage('contents')
    c.addOutlineEntry('Vier Projekte', 'contents', level=0)
    c.setFillColor(colors.HexColor(PURPLE))
    c.setFont('SerifItalic', 49)
    c.drawString(M, 467, 'Vier Projekte.')
    paragraph(c, 'Interaktive Welten, kritische Objekte und Geschichten zum Mitmachen.', M, 434, 650, 14, 20, PURPLE)
    y = 352
    for index, p in enumerate(projects):
        label(c, f'0{index+1}', M, y, PURPLE, 9)
        c.setFont('BodyBold', 19 if index != 0 else 17)
        c.drawString(M+50, y-2, p['title'])
        c.setFont('Body', 10)
        c.drawString(M+50, y-24, p['format'])
        c.drawRightString(W-M-58, y-2, p['year'])
        c.drawRightString(W-M, y-2, f'{4+index*2:02d}')
        c.linkRect('', p['slug'], (M, y-31, W-M, y+20), thickness=0)
        c.setStrokeColor(colors.HexColor(PURPLE))
        c.setLineWidth(.5)
        c.line(M, y-40, W-M, y-40)
        y -= 77
    c.showPage()


def project_open(c, p, number):
    slug = p['slug']
    sections = p['sections']
    base(c, number, f'{p["year"]} / {slug if slug != "Uebergangsobjekte" else "Übergangsobjekte"}')
    c.bookmarkPage(slug)
    c.addOutlineEntry(p['title'], slug, level=0)
    label(c, p['year'], M, 510)
    title(c, p, M, 484, 321, 100)
    y = paragraph(c, p['summary'], M, 359, 314, 15.2, 20, max_height=100)-22
    label(c, 'Idee', M, y)
    idea = sections['Idee und Geschichte']
    if slug == 'Migration':
        idea = [idea[0], idea[-1]]
    y = paragraph(c, ' '.join(idea), M, y-17, 314, 11.2, 15.5, max_height=155)-17
    if y > 112:
        label(c, 'Format', M, y)
        paragraph(c, p['format'], M, y-17, 314, 10.2, 14, max_height=42)
    link(c, 'Projekt online ansehen', f'{SITE}/works/{slug}/', M, 66)
    picture(c, media_path(slug, 0), 394, 510, W-M-394, 380, caption=CAPTIONS[slug][0])
    if slug == 'Reefresh':
        link(c, 'reefresh.org', 'https://reefresh.org/', 394, 152, size=12)
        paragraph(c, 'BINOMIALS / 2.-5. November 2026 / Barcelona\nGruppenausstellung im historischen Gebäude der Universität Barcelona.', 394, 125, W-M-394, 10, 14, max_height=70)
    c.showPage()


def project_details(c, p, number):
    slug = p['slug']
    sections = p['sections']
    base(c, number, f'{p["year"]} / Umsetzung')
    label(c, 'Vom Gedanken zur Arbeit', M, 507)
    c.setFillColor(colors.HexColor(LIME))
    c.setFont('SerifItalic', 31)
    c.drawString(M, 464, 'Idee wird Form.')
    left_width = 305
    if slug == 'Reefresh':
        blocks = [
            ('Mitmachen', sections['Viele Menschen, eine Koralle'][0]),
            ('Umsetzung', 'Aus den Zeichnungen entstehen dreidimensionale Korallen und eigene fiktive Geschichten. Das interaktive Webarchiv verbindet die ursprünglichen Zeichnungen, erfundene Arten, Umweltveränderungen und eine zeitliche Entwicklung miteinander.'),
            ('Mein Anteil', 'Konzept, Zukunftsgeschichte, Mitmachformat, visuelle Gestaltung, Texte, 3D-Übersetzung, Logo und interaktive Website habe ich entwickelt und umgesetzt. Die Ideen für die individuellen Anpassungen stammen von den Teilnehmer:innen.'),
        ]
    elif slug == 'Uebergangsobjekte':
        blocks = [('Ausgangspunkt', sections['Ausgangspunkt'][0]), ('Objekte und Ausstellung', sections['Umsetzung'][0] + ' ' + sections['Ausstellung'][0]), ('Mein Anteil', sections['Mein Anteil'][0])]
    elif slug == 'Migration':
        blocks = [('Ausgangspunkt', sections['Ausgangspunkt'][0]), ('Umsetzung', sections['Umsetzung'][0]), ('Mein Anteil', sections['Mein Anteil'][0])]
    else:
        blocks = [('Ausgangspunkt', sections['Ausgangspunkt'][0]), ('Umsetzung', sections['Umsetzung'][0]), ('Mein Anteil', sections['Mein Anteil'][0])]
    y = 426
    for heading, copy in blocks:
        label(c, heading, M, y, size=7.7)
        y = paragraph(c, copy, M, y-17, left_width, 10.4, 14.1)-19
    if y < 57:
        raise ValueError(f'{slug} detail copy reaches footer: {y}')
    x, width = 379, W-M-379
    if slug == 'Reefresh':
        picture(c, media_path(slug, 1), x, 509, width, 238, caption=CAPTIONS[slug][1])
        picture(c, media_path(slug, 2), x, 230, width, 153, caption=CAPTIONS[slug][2])
    elif slug == 'Uebergangsobjekte':
        slot = (width-12)/2
        picture(c, media_path(slug, 1), x, 509, slot, 225)
        picture(c, media_path(slug, 2), x+slot+12, 509, slot, 225)
        paragraph(c, CAPTIONS[slug][1], x, 276, width, 8, 11)
        picture(c, media_path(slug, 3), x, 235, width, 158, caption=CAPTIONS[slug][2])
    elif slug == 'Migration':
        picture(c, media_path(slug, 1), x, 509, width, 238, caption=CAPTIONS[slug][1])
        picture(c, media_path(slug, 2), x, 230, width, 153, caption=CAPTIONS[slug][2])
    else:
        slot = (width-24)/3
        for index in range(3):
            picture(c, media_path(slug, index+1), x+index*(slot+12), 495, slot, 328)
        paragraph(c, CAPTIONS[slug][1], x, 239, width, 8, 11)
        paragraph(c, 'Eine Möwe, Delfine und Schafe: Vier Minispiele übersetzen Folgen der Klimakrise in eine absurde Spielwelt. Der Timer verbindet Spielzeit mit Handlungsmöglichkeiten im Alltag.', x, 179, width, 12.3, 18, max_height=110)
    c.showPage()


def contact(c):
    base(c, 12, 'Kontakt', LIME, PURPLE)
    c.bookmarkPage('contact')
    c.addOutlineEntry('Kontakt', 'contact', level=0)
    c.setFillColor(colors.HexColor(PURPLE))
    c.setFont('SerifItalic', 96)
    c.drawString(M-4, 416, 'Moin')
    paragraph(c, 'Lass uns Geschichten erzählen\nund Ideen eine Form geben.', M, 361, 450, 27, 34, PURPLE, 'SerifItalic')
    link(c, 'leon-albers@web.de', 'mailto:leon-albers@web.de', M, 194, PURPLE, 19)
    link(c, 'www.leonalbers.de', SITE, M, 151, PURPLE, 14)
    label(c, 'Portfolio / Auswahl / November 2026', M, 78, PURPLE, 8)
    c.showPage()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='output/pdf/leon-albers-portfolio.pdf')
    parser.add_argument('--publish-copy', action='store_true')
    args = parser.parse_args()
    TEMP.mkdir(parents=True, exist_ok=True)
    register_fonts()
    projects = [read_project(slug) for slug in PROJECTS]
    output = ROOT / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    c = Canvas(str(output), pagesize=(W, H), pageCompression=1)
    c.setTitle('Leon Albers - Portfolio / Ausgewählte Arbeiten')
    c.setAuthor('Leon Albers')
    c.setSubject('REEFRESH, Übergangsobjekte, Migration und Kilma')
    c.setKeywords('Creative Design, Storytelling, Speculative Design, Interaction Design, Portfolio')
    cover(c)
    about(c)
    contents(c, projects)
    for i, p in enumerate(projects):
        project_open(c, p, 4+i*2)
        project_details(c, p, 5+i*2)
    contact(c)
    c.save()
    if args.publish_copy:
        published = DOCS / 'public/documents/leon-albers-portfolio.pdf'
        published.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(output, published)
    print(json.dumps({'output': str(output), 'pages': 12, 'bytes': output.stat().st_size}, ensure_ascii=False))


if __name__ == '__main__':
    main()
