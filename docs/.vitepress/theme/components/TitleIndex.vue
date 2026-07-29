<template>
  <div
    class="title-index"
    :class="{
      'is-hovering': cursorHintVisible,
      'has-custom-cursor': hasFinePointer,
      'is-touch-mode': !hasFinePointer,
    }"
    @mousemove="onPointerMove"
    @mouseleave="handlePointerLeave"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <!-- Hintergrund: zwei Ebenen, die per Crossfade wechseln -->
    <div class="ti-bg page-crop" aria-hidden="true">
      <div
        v-for="(layer, i) in layers"
        :key="i"
        class="ti-bg__layer"
        :class="{ 'is-visible': i === visibleLayer }"
      >
        <!-- Quelle liegt unsichtbar darunter; sichtbar ist das ASCII-Canvas -->
        <video
          v-if="layer && layer.media.type === 'video'"
          :key="layer.key"
          :ref="el => setSource(i, el)"
          :src="toBase(layer.media.src)"
          class="ti-bg__media ti-bg__source"
          :class="{ 'is-visible-source': keepSourceVisible }"
          autoplay
          muted
          loop
          playsinline
          preload="auto"
        />
        <img
          v-else-if="layer"
          :key="layer.key"
          :ref="el => setSource(i, el)"
          :src="toBase(layer.media.src)"
          class="ti-bg__media ti-bg__source"
          :class="{ 'is-visible-source': keepSourceVisible }"
          alt=""
        />
        <canvas
          v-if="layer"
          :ref="el => setCanvas(i, el)"
          class="ti-bg__media ti-bg__canvas"
        />
      </div>
    </div>

    <!-- Titelliste -->
    <div ref="scrollRef" class="ti-scroll" @scroll.passive="onScroll">
      <ul class="ti-list" :style="{ '--title-chars': String(maxTitleChars) }">
        <li
          v-for="(project, index) in projects"
          :key="project.slug"
          :ref="el => setItemRef(el, index)"
          class="ti-item"
          :style="{
            '--item-active-scale': String(activeScales[index] ?? 1),
            '--scatter-x': scatterX[index] == null ? '50vw' : `${scatterX[index]}px`,
            '--scatter-y': `${scatterY[index] ?? 50}%`,
          }"
          :class="{
            'is-active': project.slug === activeSlug,
            'is-dimmed': activeSlug !== null && project.slug !== activeSlug,
            'is-compact-title': project.slug === 'Uebersee',
          }"
        >
          <a
            :href="hrefFor(project.slug)"
            class="ti-link"
            :aria-label="project.title"
            @mouseenter="handleHover(project.slug)"
            @mouseleave="clearActive"
            @focus="handleHover(project.slug)"
            @click.prevent="openProject(project.slug)"
          >
            <span class="ti-title" :class="project.fontClass">{{ project.title }}</span>
            <!-- Ohne Mauszeiger (Touch) steht das Klick-Signal am Titel selbst.
                 Es liegt absolut unter dem Titel, damit nichts verspringt. -->
            <span v-if="!hasFinePointer" class="ti-cta" aria-hidden="true">Projekt öffnen →</span>
          </a>
        </li>
      </ul>
    </div>

    <!-- Eigener roter Cursor: klein im Ruhezustand, gross mit Beschriftung
         ueber einem Projekttitel. -->
    <div
      v-if="hasFinePointer"
      class="ti-cursor"
      :class="{
        'is-visible': cursorVisible,
        'is-expanded': cursorHintVisible,
      }"
      :style="{ transform: `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)` }"
      aria-hidden="true"
    >
      <span>Projekt öffnen</span>
    </div>

    <div v-if="!hasFinePointer" class="ti-swipe-hint" aria-hidden="true">
      <span>↑</span>
      <span>Wischen</span>
      <span>↓</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { withBase } from 'vitepress'
import { useCoverMedia, type CoverMedia } from '../composables/useCoverMedia'
import { useBackgroundFilter, BACKGROUND_FILTER } from '../composables/useBackgroundFilter'

type Project = {
  slug: string
  title: string
  fontClass: string
}

const props = defineProps<{
  projects: Project[]
}>()

const { isNight, isMobile, mediaFor, introMedia } = useCoverMedia()
const { setSource, setCanvas, start: startFilter } = useBackgroundFilter()

// Nur ohne Filter bleibt die Quelle selbst sichtbar. Der Subject-Modus zeigt
// bewusst allein die technische Rastermaske auf dem hellen Seitengrund.
const keepSourceVisible = BACKGROUND_FILTER.mode === 'none'

function toBase(url?: string | null) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return withBase(url)
}

/* ---------------------------------------------------------------
   Aktives Projekt: Desktop per Hover, Mobil per Scrollposition.
   Der gewählte Titel wird immer in die Bildschirmmitte gescrollt.
   --------------------------------------------------------------- */

const activeSlug = ref<string | null>(null)

/** Alle Titel gleich groß: die Größe richtet sich nach dem längsten */
const maxTitleChars = computed(() =>
  props.projects.reduce((max, p) => Math.max(max, p.title.length), 1)
)

function setActive(slug: string | null) {
  activeSlug.value = slug
}

function handleHover(slug: string) {
  activeSlug.value = slug
}

/**
 * Zeiger verlässt die Liste: zurück in den Standardzustand. Ohne gewählten
 * Titel liefert activeMedia das Intro-Motiv, und weil dann kein Titel
 * .is-dimmed trägt, stehen wieder alle gleichwertig da.
 */
function clearActive() {
  activeSlug.value = null
}

const activeMedia = computed<CoverMedia>(() =>
  activeSlug.value ? mediaFor(activeSlug.value) : introMedia()
)

/* ---------------------------------------------------------------
   Crossfade: zwei Ebenen, die sich abwechseln
   --------------------------------------------------------------- */

type Layer = { key: string; media: CoverMedia } | null

const layers = ref<Layer[]>([null, null])
const visibleLayer = ref(0)

watch(
  activeMedia,
  (media) => {
    const current = layers.value[visibleLayer.value]
    if (current && current.media.src === media.src) return

    const nextLayer = visibleLayer.value === 0 ? 1 : 0
    layers.value[nextLayer] = { key: media.src, media }

    // erst rendern lassen, dann einblenden – sonst springt das Bild ohne Fade
    nextTick(() => {
      visibleLayer.value = nextLayer
    })
  },
  { immediate: true }
)

/* ---------------------------------------------------------------
   Mobil: der Titel in Viewport-Mitte ist aktiv
   --------------------------------------------------------------- */

const scrollRef = ref<HTMLElement | null>(null)
const itemRefs = ref<HTMLElement[]>([])
const activeScales = ref<number[]>([])
const scatterX = ref<number[]>([])
const scatterY = ref<number[]>([])
let scrollFrame: number | null = null
let titleScaleFrame: number | null = null
let touchStart: { x: number; y: number } | null = null
let componentMounted = false

/* Abwechselnde Positionen entlang einer unsichtbaren Mittelachse. Lange Titel
   werden anhand ihrer echten Breite automatisch näher zur Achse gezogen. */
const SCATTER_DESKTOP = [
  { x: 0.30, y: 16 },
  { x: 0.70, y: 24.5 },
  { x: 0.30, y: 33 },
  { x: 0.70, y: 41.5 },
  { x: 0.30, y: 50 },
  { x: 0.70, y: 58.5 },
  { x: 0.30, y: 67 },
  { x: 0.70, y: 75.5 },
  { x: 0.30, y: 84 },
]

const SCATTER_MOBILE = [
  { x: 0.42, y: 15 },
  { x: 0.58, y: 24 },
  { x: 0.42, y: 33 },
  { x: 0.58, y: 42 },
  { x: 0.42, y: 51 },
  { x: 0.58, y: 60 },
  { x: 0.42, y: 69 },
  { x: 0.58, y: 78 },
  { x: 0.42, y: 87 },
]

function setItemRef(el: unknown, index: number) {
  if (el instanceof HTMLElement) itemRefs.value[index] = el
}

function updateTitleScales() {
  if (titleScaleFrame !== null) return

  titleScaleFrame = requestAnimationFrame(() => {
    titleScaleFrame = null

    const isSmallScreen = window.innerWidth < 768
    const desiredScale = isSmallScreen ? 1.18 : 1.28
    const sideInset = isSmallScreen ? 16 : 40
    const positions = isSmallScreen ? SCATTER_MOBILE : SCATTER_DESKTOP
    const nextX: number[] = []
    const nextY: number[] = []

    activeScales.value = props.projects.map((_, index) => {
      const item = itemRefs.value[index]
      const link = item?.querySelector<HTMLElement>('.ti-link')
      const naturalWidth = link?.offsetWidth ?? 0
      const position = positions[index % positions.length]

      nextY[index] = position.y
      if (!item || !naturalWidth) {
        nextX[index] = window.innerWidth / 2
        return desiredScale
      }

      const minCenter = sideInset + naturalWidth / 2
      const maxCenter = window.innerWidth - sideInset - naturalWidth / 2
      const desiredCenter = window.innerWidth * position.x
      const center = maxCenter < minCenter
        ? window.innerWidth / 2
        : Math.max(minCenter, Math.min(maxCenter, desiredCenter))
      const availableHalfWidth = Math.max(
        1,
        Math.min(center - sideInset, window.innerWidth - sideInset - center)
      )

      nextX[index] = center
      return Math.max(0.5, Math.min(desiredScale, (availableHalfWidth * 2) / naturalWidth))
    })

    scatterX.value = nextX
    scatterY.value = nextY
  })
}

function updateActiveFromScroll() {
  const container = scrollRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const center = rect.top + rect.height / 2

  let bestIndex = -1
  let bestDistance = Number.POSITIVE_INFINITY

  // Refs auf die aktuelle Projektzahl begrenzen, damit keine alten Elemente
  // aus einem vorherigen Render mitgezählt werden
  itemRefs.value.length = props.projects.length

  itemRefs.value.forEach((el, index) => {
    if (!el) return
    const itemRect = el.getBoundingClientRect()
    const distance = Math.abs(itemRect.top + itemRect.height / 2 - center)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  })

  const project = props.projects[bestIndex]
  if (project) activeSlug.value = project.slug
}

/**
 * Nur relevant, wenn die Liste überläuft (schmale Geräte, viele Projekte):
 * dann bestimmt die Scrollposition den aktiven Titel. Passt alles auf den
 * Schirm, feuert kein scroll-Ereignis und der Startzustand bleibt stehen.
 */
function onScroll() {
  const container = scrollRef.value
  // Passt alles auf den Schirm, gibt es nichts zu scrollen – dann darf ein
  // beim Laden ausgelöstes scroll-Ereignis auch nicht die Startauswahl
  // überschreiben (es würde sonst den mittleren statt den ersten Titel wählen)
  if (!container || container.scrollHeight <= container.clientHeight + 1) return

  if (scrollFrame !== null) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = null
    updateActiveFromScroll()
  })
}

function onPointerMove(e: MouseEvent) {
  cursorX.value = e.clientX
  cursorY.value = e.clientY
  cursorVisible.value = true

  const target = e.target as HTMLElement | null
  const hoveredLink = target?.closest('.ti-link')
  cursorHintVisible.value = !!hoveredLink

  if (!hoveredLink && hasFinePointer.value) {
    clearActive()
  }
}

/* ---------------------------------------------------------------
   Klick-Hinweis, der dem Mauszeiger folgt
   --------------------------------------------------------------- */

// Nur Geräte mit echtem Zeiger – auf Touch steht der Hinweis am Titel
const hasFinePointer = ref(false)
const cursorVisible = ref(false)
const cursorHintVisible = ref(false)
const cursorX = ref(0)
const cursorY = ref(0)

function hideCursorHint() {
  cursorHintVisible.value = false
}

function handlePointerLeave() {
  clearActive()
  hideCursorHint()
  cursorVisible.value = false
}

/* Auf Touch-Geräten ersetzt Wischen den Hover. Nach oben oder links geht es
   vorwärts, nach unten oder rechts zurück; activeMedia wechselt synchron. */
function selectMobileProject(step: 1 | -1) {
  if (!props.projects.length) return

  const currentIndex = props.projects.findIndex(project => project.slug === activeSlug.value)
  const startIndex = currentIndex >= 0 ? currentIndex : 0
  const nextIndex = (startIndex + step + props.projects.length) % props.projects.length
  activeSlug.value = props.projects[nextIndex].slug
}

function onTouchStart(event: TouchEvent) {
  if (hasFinePointer.value || event.touches.length !== 1) return

  const touch = event.touches[0]
  touchStart = { x: touch.clientX, y: touch.clientY }
}

function onTouchEnd(event: TouchEvent) {
  if (hasFinePointer.value || !touchStart || !event.changedTouches.length) return

  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - touchStart.x
  const deltaY = touch.clientY - touchStart.y
  touchStart = null

  const dominantDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY
  if (Math.abs(dominantDelta) < 36) return

  selectMobileProject(dominantDelta < 0 ? 1 : -1)
}

onMounted(() => {
  componentMounted = true
  // Mit Maus startet die Seite neutral und reagiert auf Hover. Auf Touch wird
  // das erste Projekt hervorgehoben und anschließend per Wischgeste gewechselt.
  hasFinePointer.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  startFilter()
  if (!hasFinePointer.value && props.projects[0]) {
    activeSlug.value = props.projects[0].slug
  }

  nextTick(updateTitleScales)
  document.fonts?.ready.then(() => {
    if (componentMounted) updateTitleScales()
  })
  window.addEventListener('resize', updateTitleScales)
})

onBeforeUnmount(() => {
  componentMounted = false
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame)
  if (titleScaleFrame !== null) cancelAnimationFrame(titleScaleFrame)
  window.removeEventListener('resize', updateTitleScales)
})

/* ---------------------------------------------------------------
   Navigation
   --------------------------------------------------------------- */

function hrefFor(slug: string) {
  return withBase(`/works/?id=${encodeURIComponent(slug)}`)
}

function openProject(slug: string) {
  // ohne play-Parameter: der startete auf der Projektseite das Uebergangsvideo
  window.location.href = withBase(`/works/?id=${encodeURIComponent(slug)}`)
}
</script>

<style scoped>
.title-index {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* Heller Grund – muss zum background des Filters passen, sonst blitzt beim
     Crossfade und an den Rändern die alte Farbe durch */
  background: var(--page-bg, #f2efe9);
}

/* --- Hintergrund --- */

/* Geometrie kommt aus .page-crop (styles/layout.css), damit Startseite,
   CV und Kontakt denselben Ausschnitt zeigen. */

.ti-bg__layer {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 600ms ease;
}

.ti-bg__layer.is-visible {
  opacity: 1;
}

.ti-bg__media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Quelle für den Filter – muss im Layout bleiben, damit das Video dekodiert
   und weiterläuft. In den Rastermodi ersetzt das Canvas das Bild komplett,
   deshalb ist die Quelle dort unsichtbar. */
.ti-bg__source {
  opacity: 0;
  pointer-events: none;
}

/* Ohne Rastermodus bleibt das Medium in seinen ursprünglichen Farben sichtbar. */
.ti-bg__source.is-visible-source {
  opacity: 1;
}

.ti-bg__canvas {
  object-fit: fill;
  /* Rastermodi sind nur rasterhoch aufgelöst und werden hier hochskaliert –
     ohne das würden die Punkte verwaschen */
  image-rendering: pixelated;
}

/* Bewusst kein Schleier über dem Video – das Motiv soll im Fokus stehen.
   Hintergrund dazu: mix-blend-mode: difference rechnet 255 − Hintergrund und
   hat bei mittlerem Grau (128) einen blinden Fleck. Über alle neun Motive
   gemessen liegen ohne Schleier 12,8 % der Titelfläche in diesem Bereich.
   Wichtig beim Nachjustieren: ein halber Schleier macht es schlimmer, nicht
   besser (15 % → 28 %, 25 % → 67 %), weil er helle Bildstellen erst in den
   Mittelton zieht. Nur ein sehr kräftiger Schleier ab ~60 % wäre wieder
   sauber – der nimmt aber dem Video die Bühne. */

/* --- Liste --- */

.ti-scroll {
  /* Bewusst ohne z-index: ein Stacking-Context würde hier eine Isolations-
     gruppe aufmachen und mix-blend-mode: difference der Titel gegen den
     leeren Container rechnen lassen statt gegen das Video darunter.
     position: relative allein (z-index: auto) erzeugt keinen Context und
     legt die Liste trotzdem über .ti-bg, weil sie später im DOM steht. */
  position: relative;
  height: 100%;
  overflow: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.ti-scroll::-webkit-scrollbar {
  display: none;
}

.ti-list {
  /* Vergrößerung des gewählten Titels. Steht hier, damit sie sowohl das
     transform auf .ti-link als auch die Schriftgrößen-Formel in .ti-title
     erreicht – Custom Properties vererben nur nach unten. */
  --active-scale: 1.28;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Alle Titel im selben Stil. Ihre abwechselnden Positionen folgen der
   unsichtbaren vertikalen Mittelachse.

   ACHTUNG: opacity und transform gehören hier auf .ti-link, also auf das
   Element, das mix-blend-mode selbst trägt – NICHT auf .ti-item. Beide
   Eigenschaften erzeugen auf einem Vorfahren einen Stacking-Context, der den
   Blend in eine Isolationsgruppe sperrt; die Titel würden dann als flache
   Farbe über dem Video liegen statt sich hineinzurechnen. Auf dem blendenden
   Element selbst ist das unkritisch. */
.ti-item {
  position: absolute;
  left: var(--scatter-x, 50vw);
  top: var(--scatter-y, 50%);
  width: max-content;
  max-width: calc(100vw - 2rem);
  padding: 0.14em 0;
  transform: translate(-50%, -50%);
}

.ti-item.is-dimmed .ti-link {
  opacity: 0.45;
  transform: scale(0.9);
}

/* Zeigt die Maus direkt auf einen Titel, treten die übrigen weiter zurück
   als beim bloßen Durchscrollen – der gewählte steht dann fast allein. */
.title-index.is-hovering .ti-item.is-dimmed .ti-link {
  opacity: 0.15;
}

.ti-item.is-active .ti-link {
  opacity: 1;
  /* Für jede Schrift anhand ihrer echten Breite berechnet. Dadurch wächst
     der Titel nur so weit, wie es der aktuelle Bildschirm erlaubt. */
  transform: scale(var(--item-active-scale, var(--active-scale, 1.28)));
}

.title-index.is-touch-mode {
  touch-action: pinch-zoom;
}

.title-index.is-touch-mode .ti-item.is-active .ti-link {
  transform:
    translateY(-0.35rem)
    scale(var(--item-active-scale, var(--active-scale, 1.18)));
}

/* Nur das Wort selbst ist Hover-Fläche, nicht die ganze Zeilenbreite */
.ti-link {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  width: fit-content;
  text-decoration: none;
  padding: 0.1em 0;
  /* Rote Schrift auf dem schwarzweißen ASCII-Hintergrund – kein Blend mehr */
  color: var(--title-color, var(--brand-red));
  /* Freie Positionen bleiben beim Vergrößern an ihrem Mittelpunkt verankert. */
  transform-origin: center;
  will-change: transform;
  transition: opacity 400ms ease, transform 400ms ease;
}

.ti-title {
  display: block;
  position: relative;
  line-height: 1.02;
  /* Alle Titel gleich groß. --title-chars ist die Länge des längsten Titels,
     dadurch passt die gemeinsame Größe garantiert auch für diesen in eine
     Zeile; die Zeilenhöhe deckelt zusätzlich nach oben.
     --active-scale (definiert auf .ti-list) muss mitgerechnet werden: der
     gewählte Titel wird vergrößert, und ohne diesen Teiler liefe der längste
     Titel auf schmaleren Bildschirmen seitlich aus dem Bild. */
  --title-fit: calc(
    (100vw - 3rem) / var(--title-chars, 22) / 0.6 / var(--active-scale)
  );
  font-size: min(10vh, var(--title-fit), 8rem);
  white-space: nowrap;
}

/* Der normale schwarze Systemzeiger wird auf Geräten mit präziser Maus
   vollständig durch den roten Kreis ersetzt. Das transparente Cursorbild
   hält diese Regel auch in Safari stabil. */
.title-index.has-custom-cursor,
.title-index.has-custom-cursor * {
  cursor: url('../assets/transparent-cursor.png'), none !important;
}

.ti-cursor {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  padding: 0;
  border-radius: 50%;
  background: var(--brand-red);
  color: var(--page-bg, #f2efe9);
  font-size: 0.52rem;
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
  opacity: 0;
  transition:
    width 260ms ease,
    height 260ms ease,
    opacity 160ms ease;
  will-change: transform, width, height;
}

.ti-cursor.is-visible {
  opacity: 1;
}

.ti-cursor.is-expanded {
  width: 4.75rem;
  height: 4.75rem;
}

.ti-cursor span {
  max-width: 3.8rem;
  opacity: 0;
  transform: scale(0.8);
  transition:
    opacity 140ms ease,
    transform 260ms ease;
}

.ti-cursor.is-expanded span {
  opacity: 1;
  transform: scale(1);
}

/* Klick-Hinweis am Titel (nur ohne Mauszeiger) */
.ti-cta {
  position: absolute;
  top: 100%;
  left: 50%;
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  white-space: nowrap;
  opacity: 0;
  transform: translate(-50%, -0.25rem);
  transition: opacity 300ms ease, transform 300ms ease;
}

.ti-item.is-active .ti-cta {
  opacity: 0.9;
  transform: translate(-50%, 0.2rem);
}

.ti-swipe-hint {
  position: absolute;
  left: 50%;
  bottom: max(0.65rem, env(safe-area-inset-bottom));
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--brand-red);
  font-size: 0.55rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transform: translateX(-50%);
  opacity: 0.72;
  pointer-events: none;
}

/* Kein optischer Randausgleich: alle Titel teilen dieselbe linke Kante. */

@media (max-width: 767px) {
  .ti-list {
    --active-scale: 1.18;
  }

  .ti-title {
    --title-fit: calc(
      (100vw - 2rem) / var(--title-chars, 22) / 0.48 / var(--active-scale)
    );
    font-size: min(12vh, var(--title-fit), 9rem);
  }

  .ti-item.is-compact-title .ti-title {
    --title-fit: calc(
      (100vw - 2rem) / var(--title-chars, 22) / 0.585 / var(--active-scale)
    );
    font-size: min(10vh, var(--title-fit), 7.5rem);
  }
}

@media (min-width: 768px) {
  .ti-title {
    --title-fit: calc(
      (100vw - 8rem) / var(--title-chars, 22) / 0.6 / var(--active-scale)
    );
    font-size: min(8.5vh, var(--title-fit), 8rem);
  }

  .ti-item.is-compact-title .ti-title {
    --title-fit: calc(
      (100vw - 8rem) / var(--title-chars, 22) / 0.73 / var(--active-scale)
    );
    font-size: min(7vh, var(--title-fit), 6.5rem);
  }

}

@media (prefers-reduced-motion: reduce) {
  .ti-bg__layer,
  .ti-item,
  .ti-title,
  .ti-link {
    transition: none;
  }
}
</style>
