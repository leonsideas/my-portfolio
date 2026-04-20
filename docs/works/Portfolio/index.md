# Portfolio
##### 2026

Diese Seite – konzipiert, gestaltet und entwickelt.

Ich wollte kein Baukasten-Portfolio, sondern eine Oberfläche, die sich selbst anfühlt: typografisch, zurückhaltend, mit Platz zum Atmen. Jedes Projekt bekommt eine eigene Schrift als Überschrift, ein eigenes Cover-Motiv und – wo es Sinn ergibt – ein kurzes animiertes Preview statt eines statischen Bildes.

Das Carousel reagiert auf Tageszeit und wechselt ab 20 Uhr in einen eigenen Nacht-Look mit alternativen Motiven. Auf Mobilgeräten laufen separat produzierte 9:16-Versionen der Intro- und Übergangsvideos, damit nichts beschnitten wirkt.

Technisch läuft das Ganze auf **VitePress** mit einem komplett individuellen Theme in **Vue 3** und **TypeScript**, gestylt mit **Tailwind CSS v4**. Projekt-Inhalte liegen als Markdown in `docs/works/` und werden beim Build automatisch eingelesen – einen neuen Ordner anlegen reicht, der Rest passiert ohne Code-Änderung. Größere Mediendateien gehen über **Git LFS**, das Deployment läuft über **GitHub Pages**.

Kleine Details, die mir wichtig waren: Swipe-Gesten zwischen Projekten, Punkt-Navigation zwischen den Pfeilen, Day/Night-Umschaltung per Systemzeit, Transition-Videos beim Projektwechsel und ein Kontaktbereich, der das Hintergrundmotiv sichtbar lässt statt es zu verdecken.

Designed & built by Leon Albers.

##### vitepress, vue 3, typescript, tailwind, motion design, web development

