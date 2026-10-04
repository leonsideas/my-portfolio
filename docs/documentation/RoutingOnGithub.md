# Routing und Veröffentlichung

Die Website wird als statische VitePress-Seite für `https://www.leonalbers.de` gebaut.

## Öffentliche Seiten

- `/` – Projektübersicht
- `/uebermich` – Profil und CV
- `/kontakt` – Kontakt
- `/works/<Projektname>/` – eigenständige Projektseite

Jedes Projekt besitzt eine echte statische Adresse. Die Startseite, die
Projekt-Navigation und geteilte Links verwenden ausschließlich diese Adresse.
Die frühere Query-Form `/works/?id=<Projektname>` bleibt als Weiterleitung
erhalten.

## Projektquelle

Jede Arbeit liegt in `docs/works/<Projektname>/index.md`. `WorkStack.vue` und
`WorkPage.vue` lesen diese Dateien automatisch ein. Die Projektdateien liefern
außerdem Beschreibung, Vorschaubild, Rolle, Format und Werkzeuge.

## SEO

`docs/.vitepress/config.ts` erzeugt kanonische Adressen, Social-Media-Metadaten
und die Sitemap. `docs/public/robots.txt` verweist auf diese Sitemap.

## Veröffentlichung

Der GitHub-Workflow baut `docs/.vitepress/dist` und veröffentlicht dieses
Verzeichnis über GitHub Pages. Die benutzerdefinierte Domain verwendet den
Basis-Pfad `/`.
