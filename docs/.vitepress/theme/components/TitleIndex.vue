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
  >
    <!-- Hintergrund: Default-Schafvideo, beim Hover das jeweilige Projekt. -->
    <div
      class="ti-bg page-crop"
      :style="{
        '--media-shrink-x': `${mediaProgress * 48}vw`,
        '--media-shrink-y': `${mediaProgress * 38}vh`,
        '--media-shrink-x-mobile': `${mediaProgress * 22}vw`,
        '--media-shrink-y-mobile': `${mediaProgress * 56}vh`,
      }"
      aria-hidden="true"
    >
      <div
        v-for="(layer, i) in layers"
        :key="i"
        class="ti-bg__layer"
        :class="{ 'is-visible': i === visibleLayer }"
      >
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
          @loadeddata="handleMediaReady(i, layer.key)"
        />
        <img
          v-else-if="layer"
          :key="layer.key"
          :ref="el => setSource(i, el)"
          :src="toBase(layer.media.src)"
          class="ti-bg__media ti-bg__source"
          :class="{ 'is-visible-source': keepSourceVisible }"
          alt=""
          @load="handleMediaReady(i, layer.key)"
        />
        <canvas
          v-if="layer"
          :ref="el => setCanvas(i, el)"
          class="ti-bg__media ti-bg__canvas"
        />
      </div>
    </div>

    <h1 class="ti-visually-hidden">
      Leon Albers – Creative Designer für Konzept, Storytelling und Umsetzung
    </h1>

    <!-- Titelliste -->
    <div
      ref="scrollRef"
      class="ti-scroll"
      @scroll.passive="onScroll"
    >
      <div class="ti-stage">
        <ul
          ref="listRef"
          class="ti-list"
          :class="{ 'is-visible': mediaProgress >= 0.96 }"
          :style="{
            '--title-chars': String(maxTitleChars),
            transform: `translate3d(${-trackOffset}px, -50%, 0)`,
          }"
        >
          <li
            v-for="(project, index) in projects"
            :key="project.slug"
            :ref="el => setItemRef(el, index)"
            class="ti-item"
            :style="{
              '--item-active-scale': String(activeScales[index] ?? 1),
            }"
            :class="{
              'is-active': project.slug === activeSlug,
              'is-dimmed': activeSlug !== null && project.slug !== activeSlug,
              'is-compact-title': project.slug === 'Uebersee',
              'is-featured': project.featured,
              'has-project-logo': !!project.logoSrc,
              'is-logo-only': !!project.logoOnly,
            }"
          >
            <a
              :href="hrefFor(project.slug)"
              class="ti-link"
              :aria-label="project.featured ? `Ausgewähltes Projekt: ${project.title}` : project.title"
              :data-project-slug="project.slug"
              @mouseenter="handleHover(project.slug)"
              @mouseleave="scheduleClearActive"
              @focus="handleHover(project.slug)"
              @click.prevent="handleProjectClick(project.slug)"
            >
              <span class="ti-title" :class="project.fontClass">
                <span class="ti-title__text">{{ project.title }}</span>
                <img
                  v-if="project.logoSrc"
                  :src="toBase(project.logoSrc)"
                  class="ti-project-logo"
                  :class="`ti-project-logo--${project.slug.toLowerCase()}`"
                  alt=""
                  aria-hidden="true"
                />
              </span>
            </a>
          </li>
        </ul>
      </div>
      <div
        class="ti-scroll-space"
        :style="{ height: `${scrollSpaceHeight}px` }"
        aria-hidden="true"
      />
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
  featured: boolean
  logoSrc?: string
  logoOnly?: boolean
}

const props = defineProps<{
  projects: Project[]
}>()

const { mediaFor, introMedia } = useCoverMedia()
const { setSource, setCanvas, start: startFilter } = useBackgroundFilter()
const keepSourceVisible = BACKGROUND_FILTER.mode === 'none'

function toBase(url?: string | null) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return withBase(url)
}

/* ---------------------------------------------------------------
   Aktives Projekt: Desktop per Hover, Mobil per horizontaler Scrollposition.
   --------------------------------------------------------------- */

const activeSlug = ref<string | null>(null)
const mediaProgress = ref(0)
let hoverClearTimer: number | undefined

/** Alle Titel gleich groß: die Größe richtet sich nach dem längsten */
const maxTitleChars = computed(() =>
  props.projects.reduce((max, p) => Math.max(max, p.title.length), 1)
)

function handleHover(slug: string) {
  if (hoverClearTimer) {
    window.clearTimeout(hoverClearTimer)
    hoverClearTimer = undefined
  }
  activeSlug.value = slug
}

/**
 * Zeiger verlässt die Liste: zurück in den Standardzustand. Ohne gewählten
 * Titel liefert activeMedia das Intro-Motiv, und weil dann kein Titel
 * .is-dimmed trägt, stehen wieder alle gleichwertig da.
 */
function clearActive() {
  if (hoverClearTimer) {
    window.clearTimeout(hoverClearTimer)
    hoverClearTimer = undefined
  }
  updateActiveFromScroll()
}

function scheduleClearActive() {
  if (!hasFinePointer.value || hoverClearTimer) return

  hoverClearTimer = window.setTimeout(() => {
    hoverClearTimer = undefined
    const hoveredTitle = document.querySelector('.title-index .ti-link:hover')
    if (!hoveredTitle) updateActiveFromScroll()
  }, 120)
}

const activeMedia = computed<CoverMedia>(() =>
  activeSlug.value ? mediaFor(activeSlug.value) : introMedia()
)

/* Zwei Ebenen sorgen dafür, dass Bild und Video weich ineinander wechseln. */
type Layer = { key: string; media: CoverMedia } | null

const layers = ref<Layer[]>([null, null])
const visibleLayer = ref(0)
let pendingLayer: number | null = null
let pendingLayerKey = ''
const readyLayerKeys = new Set<string>()

function layerReadyKey(index: number, key: string) {
  return `${index}:${key}`
}

function handleMediaReady(index: number, key: string) {
  readyLayerKeys.add(layerReadyKey(index, key))
  if (pendingLayer !== index || pendingLayerKey !== key) return

  visibleLayer.value = index
  pendingLayer = null
  pendingLayerKey = ''
}

watch(
  activeMedia,
  (media) => {
    const current = layers.value[visibleLayer.value]
    if (current && current.media.src === media.src) {
      pendingLayer = null
      pendingLayerKey = ''
      return
    }

    if (pendingLayer !== null && pendingLayerKey === media.src) return

    const nextLayer = visibleLayer.value === 0 ? 1 : 0
    const next = layers.value[nextLayer]

    if (
      next?.media.src === media.src &&
      readyLayerKeys.has(layerReadyKey(nextLayer, next.key))
    ) {
      pendingLayer = null
      pendingLayerKey = ''
      visibleLayer.value = nextLayer
      return
    }

    pendingLayer = nextLayer
    pendingLayerKey = media.src
    layers.value[nextLayer] = { key: media.src, media }
  },
  { immediate: true }
)

/* ---------------------------------------------------------------
   Vertikale Scroll-Erzählung mit horizontaler Titelbewegung
   --------------------------------------------------------------- */

const scrollRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const itemRefs = ref<HTMLElement[]>([])
const activeScales = ref<number[]>([])
const trackOffset = ref(0)
const scrollSpaceHeight = ref(1)
let scrollFrame: number | null = null
let titleScaleFrame: number | null = null
let componentMounted = false
let introScrollDistance = 1
let trackStartOffset = 0
let trackEndOffset = 0

function setItemRef(el: unknown, index: number) {
  if (el instanceof HTMLElement) itemRefs.value[index] = el
}

function updateTitleScales() {
  if (titleScaleFrame !== null) return

  titleScaleFrame = requestAnimationFrame(() => {
    titleScaleFrame = null

    const isSmallScreen = window.innerWidth < 768
    const desiredScale = isSmallScreen ? 1.12 : 1.18
    const sideInset = isSmallScreen ? 16 : 40

    activeScales.value = props.projects.map((_, index) => {
      const item = itemRefs.value[index]
      const link = item?.querySelector<HTMLElement>('.ti-link')
      const naturalWidth = link?.offsetWidth ?? 0
      if (!item || !naturalWidth) return desiredScale

      const availableWidth = Math.max(1, window.innerWidth - sideInset * 2)
      return Math.max(0.5, Math.min(desiredScale, availableWidth / naturalWidth))
    })

    measureScrollStory()
  })
}

function measureScrollStory() {
  const first = itemRefs.value[0]
  const last = itemRefs.value[props.projects.length - 1]
  if (!listRef.value || !first || !last) return

  const firstCenter = first.offsetLeft + first.offsetWidth / 2
  const lastCenter = last.offsetLeft + last.offsetWidth / 2

  introScrollDistance = Math.max(1, window.innerHeight * 0.9)
  trackStartOffset = Math.max(0, firstCenter - window.innerWidth / 2)
  trackEndOffset = Math.max(trackStartOffset, lastCenter - window.innerWidth / 2)

  const horizontalDistance = trackEndOffset - trackStartOffset
  scrollSpaceHeight.value = Math.ceil(introScrollDistance + horizontalDistance)
  updateActiveFromScroll()
}

function updateActiveFromScroll() {
  const container = scrollRef.value
  if (!container) return

  const scrollPosition = container.scrollTop
  mediaProgress.value = Math.max(0, Math.min(1, scrollPosition / introScrollDistance))

  const horizontalDistance = Math.max(0, scrollPosition - introScrollDistance)
  trackOffset.value = Math.min(trackEndOffset, trackStartOffset + horizontalDistance)
  document.documentElement.classList.toggle('home-intro-active', mediaProgress.value < 0.98)

  // Während sich das große Default-Video zum Fenster verkleinert, bleibt es
  // sichtbar. Erst danach übernehmen die vorbeiziehenden Projekttitel.
  if (mediaProgress.value < 0.98) {
    activeSlug.value = null
    return
  }

  const center = trackOffset.value + window.innerWidth / 2

  let bestIndex = -1
  let bestDistance = Number.POSITIVE_INFINITY

  // Refs auf die aktuelle Projektzahl begrenzen, damit keine alten Elemente
  // aus einem vorherigen Render mitgezählt werden
  itemRefs.value.length = props.projects.length

  itemRefs.value.forEach((el, index) => {
    if (!el) return
    const itemCenter = el.offsetLeft + el.offsetWidth / 2
    const distance = Math.abs(itemCenter - center)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  })

  const project = props.projects[bestIndex]
  if (project) activeSlug.value = project.slug
}

/**
 * Eine einzige vertikale Scrollstrecke steuert zuerst die Verkleinerung des
 * Videos und anschließend die horizontale Bewegung der Projekttitel.
 */
function onScroll() {
  const container = scrollRef.value
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

  if (hoveredLink) {
    if (hoverClearTimer) {
      window.clearTimeout(hoverClearTimer)
      hoverClearTimer = undefined
    }
  } else if (hasFinePointer.value) {
    scheduleClearActive()
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

function handleProjectClick(slug: string) {
  openProject(slug)
}

onMounted(() => {
  componentMounted = true
  // Die Seite startet neutral. Mausgeräte reagieren auf Hover; auf Touch
  // beginnt die Auswahl erst mit der direkten Berührung eines Titels.
  hasFinePointer.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  document.documentElement.classList.add('home-intro-active')
  startFilter()

  nextTick(() => {
    updateTitleScales()
    updateActiveFromScroll()
  })
  document.fonts?.ready.then(() => {
    if (componentMounted) updateTitleScales()
  })
  window.addEventListener('resize', updateTitleScales)
})

onBeforeUnmount(() => {
  componentMounted = false
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame)
  if (titleScaleFrame !== null) cancelAnimationFrame(titleScaleFrame)
  if (hoverClearTimer) window.clearTimeout(hoverClearTimer)
  window.removeEventListener('resize', updateTitleScales)
  document.documentElement.classList.remove('home-intro-active')
})

/* ---------------------------------------------------------------
   Navigation
   --------------------------------------------------------------- */

function hrefFor(slug: string) {
  return withBase(`/works/${encodeURIComponent(slug)}/`)
}

function openProject(slug: string) {
  window.location.href = hrefFor(slug)
}
</script>

<style scoped>
.title-index {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--page-bg, #f2efe9);
}

/* --- Wechselnder Bild-/Videohintergrund --- */

.ti-bg {
  width: calc(100vw - var(--media-shrink-x, 0vw));
  height: calc(100vh - var(--media-shrink-y, 0vh));
  will-change: width, height;
}

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

.ti-bg__source {
  opacity: 0;
  pointer-events: none;
}

.ti-bg__source.is-visible-source {
  opacity: 1;
}

.ti-bg__canvas {
  object-fit: fill;
  image-rendering: pixelated;
}

.ti-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* --- Liste --- */

.ti-scroll {
  /* Bewusst ohne z-index: ein Stacking-Context würde hier eine Isolations-
     gruppe aufmachen und mix-blend-mode: difference der Titel gegen den
     leeren Container rechnen lassen statt gegen das Video darunter.
     position: relative allein (z-index: auto) erzeugt keinen Context und
     legt die Liste trotzdem über .ti-bg, weil sie später im DOM steht. */
  position: relative;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.ti-scroll::-webkit-scrollbar {
  display: none;
}

.ti-stage {
  position: sticky;
  top: 0;
  height: 100%;
  overflow: hidden;
}

.ti-scroll-space {
  width: 1px;
  pointer-events: none;
}

.ti-list {
  /* Vergrößerung des gewählten Titels. Steht hier, damit sie sowohl das
     transform auf .ti-link als auch die Schriftgrößen-Formel in .ti-title
     erreicht – Custom Properties vererben nur nach unten. */
  --active-scale: 1.18;
  position: absolute;
  top: 50%;
  left: 0;
  display: flex;
  align-items: center;
  gap: clamp(3rem, 8vw, 9rem);
  box-sizing: border-box;
  width: max-content;
  min-width: 100%;
  height: auto;
  margin: 0;
  padding: 0 clamp(2.5rem, 9vw, 9rem);
  list-style: none;
  opacity: 0;
  pointer-events: none;
  will-change: transform;
  transition: opacity 260ms ease;
}

.ti-list.is-visible {
  opacity: 1;
  pointer-events: auto;
}

/* Unsichtbare Randflächen geben dem ersten und letzten Titel genug Weg,
   um jeweils sauber durch die Mitte des Bildfensters zu laufen. */
.ti-list::before {
  content: "";
  flex: 0 0 92vw;
  pointer-events: none;
}

.ti-list::after {
  content: "";
  flex: 0 0 45vw;
  pointer-events: none;
}

/* Die Titel bleiben horizontal, werden aber ausschließlich durch vertikales
   Scrollen über das Bildfenster bewegt. */
.ti-item {
  position: relative;
  flex: 0 0 auto;
  width: auto;
  padding: 0.35em 0;
  text-align: center;
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

.title-index.is-touch-mode .ti-item.is-active .ti-link {
  transform: scale(var(--item-active-scale, var(--active-scale, 1.18)));
}

.title-index.is-touch-mode .ti-link {
  touch-action: pan-y;
}

/* Nur das Wort selbst ist Hover-Fläche, nicht die ganze Zeilenbreite */
.ti-link {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: baseline;
  width: fit-content;
  margin-inline: auto;
  text-decoration: none;
  padding: 0.1em 0;
  /* Rote Schrift auf dem schwarzweißen ASCII-Hintergrund – kein Blend mehr */
  color: var(--title-color, var(--brand-red));
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
  text-align: center;
  white-space: nowrap;
}

.ti-title__text {
  display: block;
  transition: opacity 220ms ease;
}

.ti-project-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: auto;
  height: 1.55em;
  max-width: min(160%, 72vw);
  object-fit: contain;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -50%) scale(0.9);
  transition: opacity 220ms ease, transform 320ms ease;
}

.ti-project-logo--klanggestalten {
  height: 1.8em;
}

.ti-project-logo--uebergangsobjekte {
  height: 1.35em;
}

.ti-project-logo--kilma {
  height: 2.45em;
}

.ti-project-logo--reefresh {
  height: 1.3em;
}

@media (hover: hover) and (pointer: fine) {
  .ti-item.has-project-logo:not(.is-logo-only).is-active .ti-title__text {
    opacity: 0;
  }

  .ti-item.has-project-logo:not(.is-logo-only).is-active .ti-project-logo {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.ti-item.is-logo-only .ti-title__text {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  opacity: 0;
}

.ti-item.is-logo-only .ti-project-logo {
  position: relative;
  top: auto;
  left: auto;
  display: block;
  max-width: min(70vw, 34rem);
  opacity: 1;
  transform: none;
}

.ti-item.is-logo-only .ti-project-logo--klanggestalten {
  height: 1.25em;
}

.ti-item.is-logo-only .ti-project-logo--kilma {
  height: 1.4em;
}

.ti-item.is-logo-only .ti-project-logo--reefresh {
  height: 0.82em;
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

@media (max-width: 767px) {
  .ti-bg {
    width: calc(100vw - var(--media-shrink-x-mobile, 0vw));
    height: calc(100vh - var(--media-shrink-y-mobile, 0vh));
  }

  .ti-list {
    --active-scale: 1.12;
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
  .ti-item,
  .ti-title,
  .ti-title__text,
  .ti-project-logo,
  .ti-link {
    transition: none;
  }
}
</style>
