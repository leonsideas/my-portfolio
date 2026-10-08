import { readFileSync, writeFileSync } from 'node:fs'
import opentype from '../node_modules/three/examples/jsm/libs/opentype.module.js'

// Die Projektschrift enthält kein Ü. U und Punkte stammen aus derselben Schrift.
const source = readFileSync(new URL('../docs/fonts/Uebergangsobjekte.otf', import.meta.url))
const original = opentype.parse(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength))
const base = original.charToGlyph('U')
const dot = original.charToGlyph('.')
const dotBounds = dot.getBoundingBox()
const path = new opentype.Path()
path.commands = base.path.commands.map(command => ({ ...command }))

for (const center of [370, 560]) {
  const scale = 0.62
  const dx = center - (dotBounds.x1 + dotBounds.x2) / 2 * scale
  const dy = 770 - dotBounds.y1 * scale
  for (const command of dot.path.commands) {
    const transformed = { ...command }
    for (const key of ['x', 'x1', 'x2']) if (key in command) transformed[key] = command[key] * scale + dx
    for (const key of ['y', 'y1', 'y2']) if (key in command) transformed[key] = command[key] * scale + dy
    path.commands.push(transformed)
  }
}

const font = new opentype.Font({
  familyName: 'Uebergangsobjekte Umlaut',
  styleName: 'Regular',
  unitsPerEm: original.unitsPerEm,
  ascender: original.ascender,
  descender: original.descender,
  glyphs: [
    new opentype.Glyph({ name: '.notdef', advanceWidth: 600, path: new opentype.Path() }),
    new opentype.Glyph({ name: 'Udieresis', unicode: 0x00DC, advanceWidth: base.advanceWidth, path }),
  ],
})

writeFileSync(new URL('../docs/fonts/Uebergangsobjekte-umlaut.otf', import.meta.url), Buffer.from(font.toArrayBuffer()))
