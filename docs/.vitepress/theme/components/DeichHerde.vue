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
      <a class="panel-link vp-raw" href="#" @click="oeffneProjekt">Zum Projekt →</a><button class="panel-zurueck" type="button">Zurück zur Herde</button>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { beginSceneProjectOpening } from '../composables/useProjectOpening'
import { vorladen } from '../deich/dateien.js'
import { isSiteRotated, sitePoint, screenPoint, setupSiteViewport } from '../composables/siteViewport'

type Deich = {
  bereit: Promise<void>
  stop: () => void
  herd: { aktuell: () => { slug: string; titel: string; box: { left: number; top: number; width: number; height: number } } | null } | null
}

const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const bereit = ref(false)
const fortschritt = ref(0)

let deich: Deich | null = null
let verlassen = false
let cleanupViewport: (() => void) | undefined

onMounted(async () => {
  document.documentElement.classList.add('deich-aktiv')
  cleanupViewport = setupSiteViewport()
  // Modelle und Texturen sofort anfordern, parallel zu Three.js (spart die Wartezeit auf das Skript)
  vorladen(withBase('/deich/'))
  // Three.js erst im Browser laden (nicht beim Vorrendern der Seite)
  const { starteDeich } = await import('../deich/szene.js')
  if (verlassen || !root.value) return
  deich = starteDeich(root.value, {
    panel: panel.value,
    assets: withBase('/deich/'),
    logos: withBase('/images/project-logos/'),
    basis: withBase('/'),
    gedreht: isSiteRotated,
    zuLokal: sitePoint,
    zuBildschirm: screenPoint,
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
  cleanupViewport?.()
})

// Die Deich-Szene geht direkt in die Projektseite über.
// vp-raw am Link verhindert VitePress' sofortigen Seitenwechsel im Capture-Handler.
// Mit Strg/Cmd/Umschalt bleibt es ein normaler Link.
function oeffneProjekt(event: MouseEvent) {
  const info = deich?.herd?.aktuell()
  if (!info || !root.value || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  beginSceneProjectOpening({
    slug: info.slug,
    title: info.titel,
    href: withBase(`/works/${encodeURIComponent(info.slug)}/`),
    source: root.value,
  })
}
</script>

<style>
/* Nicht scoped: das Canvas erzeugt die Szene selbst. Alles hängt an .deich. */
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
  background: color-mix(in srgb, var(--brand-red) 25%, transparent);
}

.deich-laden__balken span {
  display: block;
  height: 100%;
  background: var(--brand-red);
  transform-origin: left;
  transition: transform 250ms ease;
}

/* Fokus: Tier links, rechts Titel, Text und Link */
.deich-panel {
  position: absolute;
  top: 50%;
  right: var(--home-inset-right);
  z-index: 3;
  width: min(calc(36 * var(--site-vw)), 460px);
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
  font-size: clamp(34px, calc(4.4 * var(--site-vw)), 64px);
  line-height: 1.02;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.25));
}

.deich-panel .panel-titel img {
  display: block;
  max-width: 100%;
  max-height: 150px;
  width: auto;
}

/* Projektlogos in der Schriftfarbe der Seite: das Bild gibt nur die Größe vor, die Farbe kommt über eine Maske */
.deich-panel .panel-logo {
  position: relative;
  display: block;
  width: 100%;
  max-width: 100%;
}

.deich-panel .panel-logo img {
  width: 100%;
  height: auto;
  visibility: hidden;
}

.deich-panel .panel-logo::after {
  content: "";
  position: absolute;
  inset: 0;
  background: currentColor;
  -webkit-mask: var(--logo) left center / contain no-repeat;
  mask: var(--logo) left center / contain no-repeat;
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
  background: var(--brand-red);
  color: var(--farbe-violett);
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  text-shadow: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}

.deich-panel .panel-link:hover,
.deich-panel .panel-link:focus-visible {
  background: #fff;
  color: var(--farbe-violett);
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

/* Schmale Fenster: Projekttext als Blatt unten */
@media (max-width: 700px) {

  .deich-panel {
    top: auto;
    right: var(--home-inset-right);
    bottom: calc(6.4rem + env(safe-area-inset-bottom));
    left: var(--home-inset-left);
    width: auto;
    transform: translateY(24px);
  }

  .deich-panel.offen {
    transform: translateY(0);
  }

  .deich-panel .panel-titel {
    font-size: 34px;
  }
}

</style>
