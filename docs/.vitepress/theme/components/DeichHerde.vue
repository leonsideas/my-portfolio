<template>
  <!-- Startseite: die Projekt-Herde auf dem Deich (Three.js, siehe ../deich/). Navigation und Fußzeile kommen aus dem Layout. -->
  <div ref="root" class="deich">
    <div class="deich-laden" :class="{ 'is-fertig': bereit }" aria-hidden="true">
      <span>Deich wird geladen</span>
      <span class="deich-laden__balken"><span :style="{ transform: `scaleX(${fortschritt})` }" /></span>
    </div>

    <aside ref="panel" class="deich-panel deich-ui" aria-live="polite">
      <div class="panel-titel" />
      <div class="panel-jahr" />
      <p class="panel-text" />
      <a class="panel-link" href="#" @click="oeffneProjekt">Zum Projekt →</a><button class="panel-zurueck" type="button">Zurück zur Herde</button>
    </aside>

    <button ref="pfeifen" class="deich-pfeife deich-ui" type="button" aria-label="Pfeifen: alle Tiere stellen sich auf" title="Pfeifen: alle Tiere stellen sich auf">
      <!-- Trillerpfeife -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="14.5" r="5.5" /><circle cx="9" cy="14.5" r="1.6" /><path d="M12.6 10.3 21 8.5v4.2l-6.4.9" /><path d="M5 9.6 3.4 8" /></svg>
    </button>

    <p class="deich-hinweis">Tier anklicken: Projekt ansehen · Pfeifen: alle stellen sich in eine Reihe</p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { beginProjectOpening } from '../composables/useProjectOpening'
import { useCoverMedia } from '../composables/useCoverMedia'
import { vorladen } from '../deich/dateien.js'

type Deich = {
  bereit: Promise<void>
  stop: () => void
  herd: { aktuell: () => { slug: string; titel: string; box: { left: number; top: number; width: number; height: number } } | null } | null
}

const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const pfeifen = ref<HTMLButtonElement | null>(null)
const bereit = ref(false)
const fortschritt = ref(0)
const { mediaFor, isMobile } = useCoverMedia()

// Handy hochkant: die ganze Startseite um 90° gedreht zeigen, wie ein Video im Vollbild (CSS unten).
// Die Drehung geht im Uhrzeigersinn um die linke obere Ecke; die Szene rechnet in Seitenkoordinaten.
const GEDREHT = '(orientation: portrait) and (max-width: 900px) and (pointer: coarse)'
let gedrehtMq: MediaQueryList | null = null
const gedreht = () => !!gedrehtMq?.matches
const zuLokal = (x: number, y: number) => gedreht() ? { x: y, y: innerWidth - x } : { x, y }
const zuBildschirm = (x: number, y: number) => gedreht() ? { x: innerWidth - y, y: x } : { x, y }
let deich: Deich | null = null
let verlassen = false

onMounted(async () => {
  document.documentElement.classList.add('deich-aktiv')
  gedrehtMq = matchMedia(GEDREHT)
  // Modelle und Texturen sofort anfordern, parallel zu Three.js (spart die Wartezeit auf das Skript)
  vorladen(withBase('/deich/'))
  // Three.js erst im Browser laden (nicht beim Vorrendern der Seite)
  const { starteDeich } = await import('../deich/szene.js')
  if (verlassen || !root.value) return
  deich = starteDeich(root.value, {
    panel: panel.value,
    pfeifen: pfeifen.value,
    assets: withBase('/deich/'),
    logos: withBase('/images/project-logos/'),
    basis: withBase('/'),
    gedreht,
    zuLokal,
    zuBildschirm,
    fortschritt: (anteil: number) => { fortschritt.value = Math.max(fortschritt.value, anteil) },
  }) as Deich
  await deich.bereit
  if (!verlassen) bereit.value = true
})

onBeforeUnmount(() => {
  verlassen = true
  deich?.stop()
  deich = null
  document.documentElement.classList.remove('deich-aktiv')
})

// „Zum Projekt“: das Cover wächst aus dem Tier auf den ganzen Schirm, dann öffnet die Projektseite
// (derselbe Übergang wie in der Galerie). Mit Strg/Cmd/Umschalt bleibt es ein normaler Link.
function oeffneProjekt(event: MouseEvent) {
  const info = deich?.herd?.aktuell()
  if (!info || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  const media = mediaFor(info.slug)
  const poster = withBase(isMobile.value ? `/images/${info.slug}-cover_mobile.webp` : `/images/${info.slug}-cover.webp`)
  beginProjectOpening({
    slug: info.slug,
    title: info.titel,
    href: withBase(`/works/${encodeURIComponent(info.slug)}/`),
    media,
    poster,
    previewSrc: media.src,
    currentTime: 0,
    openingBox: info.box,
    sourceBox: info.box,
    filter: 'none',
  })
}
</script>

<style>
/* Nicht scoped: Canvas und Titel erzeugt die Szene selbst. Alles hängt an .deich. */
html.deich-aktiv .my-nav {
  background: transparent;
}

.deich {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: var(--page-bg);
  color: #fff;
}

.deich canvas {
  display: block;
}

/* Leichter Schatten am unteren Rand: Rot auf Gras wäre sonst kaum lesbar (Fußzeile) */
.deich::after {
  content: "";
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  height: 110px;
  background: linear-gradient(to top, rgba(10, 14, 8, 0.55), rgba(10, 14, 8, 0));
  pointer-events: none;
}

.deich-laden {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 14px;
  background: var(--page-bg);
  color: var(--brand-red);
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  transition: opacity 450ms ease, visibility 0s linear 450ms;
}

.deich-laden.is-fertig {
  opacity: 0;
  visibility: hidden;
}

.deich-laden__balken {
  display: block;
  width: 160px;
  height: 2px;
  overflow: hidden;
  background: rgba(255, 45, 22, 0.25);
}

.deich-laden__balken span {
  display: block;
  height: 100%;
  background: var(--brand-red);
  transform-origin: left;
  transition: transform 250ms ease;
}

/* Projekttitel über den Tieren */
.deich .projekt-label {
  pointer-events: auto;
  cursor: pointer;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
  transition: transform 220ms ease, opacity 300ms ease, filter 220ms ease;
}

.deich .projekt-label span {
  display: block;
  color: var(--brand-red);
  font-size: 22px;
  line-height: 1;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.35);
}

.deich .projekt-label img {
  display: block;
  width: auto;
}

.deich .projekt-label:hover,
.deich .projekt-label.aktiv {
  transform: translateY(-6px) scale(1.15);
}

.deich.fokus .projekt-label {
  opacity: 0;
  pointer-events: none;
}

/* Fokus: Tier links, rechts Titel, Text und Link */
.deich-panel {
  position: absolute;
  top: 50%;
  right: 7vw;
  z-index: 3;
  width: min(36vw, 460px);
  transform: translate(24px, -50%);
  opacity: 0;
  pointer-events: none;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
  transition: opacity 420ms ease, transform 420ms ease;
}

.deich-panel.offen {
  opacity: 1;
  transform: translate(0, -50%);
  pointer-events: auto;
}

.deich-panel .panel-titel {
  color: var(--brand-red);
  font-size: clamp(34px, 4.4vw, 64px);
  line-height: 1.02;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.25));
}

.deich-panel .panel-titel img {
  display: block;
  max-width: 100%;
  max-height: 150px;
  width: auto;
}

.deich-panel .panel-jahr {
  margin-top: 14px;
  font-size: 13px;
  letter-spacing: 0.14em;
  opacity: 0.85;
}

.deich-panel .panel-text {
  max-width: 34em;
  margin: 10px 0 22px;
  font-size: 16px;
  line-height: 1.45;
}

.deich-panel .panel-link {
  display: inline-block;
  padding: 10px 18px;
  border-radius: 999px;
  background: #fff;
  color: var(--brand-red);
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  text-shadow: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}

.deich-panel .panel-link:hover,
.deich-panel .panel-link:focus-visible {
  background: var(--brand-red);
  color: #fff;
}

.deich-panel .panel-zurueck {
  margin-left: 12px;
  border: none;
  background: none;
  color: #fff;
  font: inherit;
  font-size: 14px;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-shadow: inherit;
  cursor: pointer;
}

/* Pfeifen: rundes Symbol unten mittig, zwischen Impressum und Copyright */
.deich-pfeife {
  position: absolute;
  left: 50%;
  bottom: max(0.55rem, env(safe-area-inset-bottom));
  z-index: 3;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #fff;
  color: var(--brand-red);
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.22);
  transform: translateX(-50%);
  transition: background-color 200ms ease, color 200ms ease, transform 200ms ease;
}

.deich-pfeife svg {
  width: 28px;
  height: 28px;
}

.deich-pfeife:hover,
.deich-pfeife:focus-visible {
  transform: translateX(-50%) scale(1.08);
}

.deich-pfeife.aktiv {
  background: var(--brand-red);
  color: #fff;
}

.deich-hinweis {
  position: absolute;
  top: 3.6rem;
  left: 50%;
  z-index: 2;
  margin: 0;
  transform: translateX(-50%);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  transition: opacity 300ms ease;
}

.deich.fokus .deich-hinweis {
  opacity: 0;
}

@media (max-width: 899px) {
  .deich-hinweis {
    display: none;
  }
}

/* Handy: Knöpfe über der Fußzeile, Projekttext als Blatt darüber */
@media (max-width: 700px) {
  .deich-pfeife {
    bottom: calc(2.7rem + env(safe-area-inset-bottom));
  }

  .deich-panel {
    top: auto;
    right: 16px;
    bottom: calc(6.4rem + env(safe-area-inset-bottom));
    left: 16px;
    width: auto;
    transform: translateY(24px);
  }

  .deich-panel.offen {
    transform: translateY(0);
  }

  .deich-panel .panel-titel {
    font-size: 34px;
  }

  /* Titel über den Tieren kleiner, sonst verdecken sie sich gegenseitig */
  .deich .projekt-label > * {
    zoom: 0.62;
  }
}

/* Handy hochkant: Navigation, Herde und Fußzeile um 90° drehen – wie ein Video im Vollbild.
   Wer das Handy quer hält (ohne Drehsperre), bekommt das Querformat direkt und nichts wird gedreht.
   Innerhalb der gedrehten Fläche gilt: Breite = Bildschirmhöhe (vh), Höhe = Bildschirmbreite (vw). */
@media (orientation: portrait) and (max-width: 900px) and (pointer: coarse) {
  html.deich-aktiv,
  html.deich-aktiv body {
    height: 100%;
    overflow: hidden;
  }

  html.deich-aktiv .site-shell {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vh;
    width: 100dvh;
    height: 100vw;
    min-height: 0;
    overflow: hidden;
    transform-origin: top left;
    transform: rotate(90deg) translateY(-100%);
  }

  html.deich-aktiv .deich-panel {
    top: 50%;
    right: 5vh;
    bottom: auto;
    left: auto;
    width: 42vh;
    transform: translate(16px, -50%);
  }

  html.deich-aktiv .deich-panel.offen {
    transform: translate(0, -50%);
  }

  html.deich-aktiv .deich-panel .panel-titel {
    font-size: 30px;
  }

  html.deich-aktiv .deich-panel .panel-titel img {
    max-height: 80px;
  }

  html.deich-aktiv .deich-panel .panel-text {
    margin: 6px 0 14px;
    font-size: 13px;
  }

  html.deich-aktiv .deich-pfeife {
    bottom: 0.4rem;
    width: 44px;
    height: 44px;
  }

  html.deich-aktiv .deich-pfeife svg {
    width: 24px;
    height: 24px;
  }
}
</style>
