<template>
  <div
    class="title-index"
    :class="{
      'is-hovering': cursorHintVisible,
      'has-custom-cursor': hasFinePointer,
      'is-touch-mode': !hasFinePointer,
      'is-opening': !!projectOpening,
    }"
    @mousemove="onPointerMove"
    @mouseleave="handlePointerLeave"
  >
    <!-- Hintergrund: Default-Schafvideo, beim Hover das jeweilige Projekt. -->
    <div
      ref="backgroundRef"
      class="ti-bg page-crop"
      :style="{
        '--media-shrink-x': `${mediaProgress * 48}vw`,
        '--media-shrink-y': `${mediaProgress * 38}vh`,
        '--media-shrink-x-mobile': `${mediaProgress * 22}vw`,
        '--media-shrink-y-mobile': `${mediaProgress * 56}vh`,
        '--frame-progress': String(mediaProgress),
        '--frame-depth': `${frameDepth}px`,
        '--preview-grayscale': String(mediaProgress),
        '--frame-inner-top': activeFrameProfile.inner.top,
        '--frame-inner-right': activeFrameProfile.inner.right,
        '--frame-inner-bottom': activeFrameProfile.inner.bottom,
        '--frame-inner-left': activeFrameProfile.inner.left,
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
      <ProjectFrame
        :key="activeFrameSlug"
        :slug="activeFrameSlug"
        class="ti-bg__ornate-frame"
      />
    </div>

    <h1 class="ti-visually-hidden">
      Leon Albers – Creative Designer für Konzept, Storytelling und Umsetzung
    </h1>

    <Transition name="ti-scroll-hint">
      <div
        v-if="mediaProgress < 0.08"
        class="ti-scroll-hint"
        aria-hidden="true"
      >
        <span>Scroll für Projekte</span>
        <span class="ti-scroll-hint__arrow">↓</span>
      </div>
    </Transition>

    <!-- Titelliste -->
    <div
      ref="scrollRef"
      class="ti-scroll"
      @scroll.passive="onScroll"
    >
      <div class="ti-stage" :style="{ clipPath: titleWindowClip }">
        <button
          v-if="activeSlug"
          class="ti-open-area"
          :style="{ inset: titleWindowInsets }"
          tabindex="-1"
          aria-hidden="true"
          @click="handleProjectClick(activeSlug)"
        />
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
              '--item-active-scale': String((activeScales[index] ?? 1) * (0.52 + 0.48 * activeTitlePresence)),
              '--item-opacity': String(Math.min(1, activeTitlePresence * 2.5)),
            }"
            :class="{
              'is-active': project.slug === activeSlug,
              'is-compact-title': project.slug === 'Uebersee',
              'is-featured': project.featured,
              'has-project-logo': !!project.logoSrc,
              'is-logo-only': !!project.logoOnly,
            }"
            :aria-hidden="project.slug !== activeSlug"
          >
            <a
              :href="hrefFor(project.slug)"
              class="ti-link vp-raw"
              :aria-label="project.featured ? `Ausgewähltes Projekt: ${project.title}` : project.title"
              :data-project-slug="project.slug"
              :tabindex="project.slug === activeSlug ? 0 : -1"
              @click.stop.prevent="handleProjectClick(project.slug)"
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
import ProjectFrame from './ProjectFrame.vue'
import { projectFrameFor, frameDepthFor, FRAME_SCALE } from '../data/projectFrames'
import { beginProjectOpening, projectOpening, type OpeningBox } from '../composables/useProjectOpening'

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
   Das Projekt in der Bildmitte ist auf allen Geräten allein sichtbar.
   --------------------------------------------------------------- */

const activeSlug = ref<string | null>(null)
const mediaProgress = ref(0)
const activeTitlePresence = ref(0)
const viewportSize = ref({ width: 0, height: 0 })

const activeFrameSlug = computed(() => activeSlug.value ?? props.projects[0]?.slug ?? '')
const activeFrameProfile = computed(() => projectFrameFor(activeFrameSlug.value))
const frameDepth = ref(80)
const backgroundRef = ref<HTMLElement | null>(null)
const titleWindowInsets = computed(() => {
  const { width, height } = viewportSize.value
  if (!width || mediaProgress.value < 0.96) return '0px'

  const isSmallScreen = width < 768
  const horizontalInset = (width - width * (isSmallScreen ? 0.78 : 0.52) * FRAME_SCALE) / 2
  const verticalInset = (height - height * (isSmallScreen ? 0.44 : 0.62) * FRAME_SCALE) / 2
  const { inner } = activeFrameProfile.value
  return `${verticalInset + frameDepth.value * inner.top}px ${horizontalInset + frameDepth.value * inner.right}px ${verticalInset + frameDepth.value * inner.bottom}px ${horizontalInset + frameDepth.value * inner.left}px`
})
const titleWindowClip = computed(() => `inset(${titleWindowInsets.value})`)

/** Alle Titel gleich groß: die Größe richtet sich nach dem längsten */
const maxTitleChars = computed(() =>
  props.projects.reduce((max, p) => Math.max(max, p.title.length), 1)
)

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
let projectTrackOffsets: number[] = []
let projectDwellDistance = 96

function setItemRef(el: unknown, index: number) {
  if (el instanceof HTMLElement) itemRefs.value[index] = el
}

function updateTitleScales() {
  if (titleScaleFrame !== null) return

  titleScaleFrame = requestAnimationFrame(() => {
    titleScaleFrame = null

    const isSmallScreen = window.innerWidth < 768
    viewportSize.value = { width: window.innerWidth, height: window.innerHeight }
    frameDepth.value = frameDepthFor(window.innerWidth)
    const desiredScale = isSmallScreen ? 2 : 1.7
    // Der aktive Titel sitzt im gerahmten Bildfenster, nicht im gesamten
    // Viewport. Darum wird seine maximale Breite an der späteren Rahmengröße
    // ausgerichtet. Logos und lange Titel bleiben so vollständig im Rahmen.
    const framedMediaWidth = window.innerWidth * (isSmallScreen ? 0.78 : 0.52)
    activeScales.value = props.projects.map((project, index) => {
      const frame = projectFrameFor(project.slug)
      const openingWidth = framedMediaWidth * FRAME_SCALE
        - frameDepth.value * (frame.inner.left + frame.inner.right)
      const availableWidth = Math.max(1, openingWidth * 0.88)
      const item = itemRefs.value[index]
      const link = item?.querySelector<HTMLElement>('.ti-link')
      const naturalWidth = link?.offsetWidth ?? 0
      if (!item || !naturalWidth) return desiredScale

      return Math.max(0.32, Math.min(desiredScale, availableWidth / naturalWidth))
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

  projectTrackOffsets = itemRefs.value
    .slice(0, props.projects.length)
    .filter(Boolean)
    .map((item) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2
      return Math.max(
        trackStartOffset,
        Math.min(trackEndOffset, itemCenter - window.innerWidth / 2)
      )
    })

  // Ein kleines zusätzliches Scrollstück hält jeden Titel kurz genau in
  // der Bildmitte. So rastet das Projekt spürbar ein, ohne einen zweiten
  // Scrollmechanismus oder harte Sprünge einzuführen.
  projectDwellDistance = Math.max(72, Math.min(128, window.innerHeight * 0.12))

  const horizontalDistance = trackEndOffset - trackStartOffset
  const dwellDistance = projectDwellDistance * projectTrackOffsets.length
  scrollSpaceHeight.value = Math.ceil(
    introScrollDistance + horizontalDistance + dwellDistance
  )
  updateActiveFromScroll()
}

function trackOffsetForScroll(scrollPosition: number) {
  let remaining = Math.max(0, scrollPosition - introScrollDistance)
  let currentOffset = trackStartOffset

  for (const snapOffset of projectTrackOffsets) {
    const travelDistance = Math.max(0, snapOffset - currentOffset)

    if (remaining <= travelDistance) {
      return currentOffset + remaining
    }

    remaining -= travelDistance
    currentOffset = snapOffset

    if (remaining <= projectDwellDistance) {
      return currentOffset
    }

    remaining -= projectDwellDistance
  }

  return trackEndOffset
}

function updateActiveFromScroll() {
  if (projectOpening.value) return
  const container = scrollRef.value
  if (!container) return

  const scrollPosition = container.scrollTop
  mediaProgress.value = Math.max(0, Math.min(1, scrollPosition / introScrollDistance))

  trackOffset.value = trackOffsetForScroll(scrollPosition)
  document.documentElement.classList.toggle('home-intro-active', mediaProgress.value < 0.98)

  // Während sich das große Default-Video zum Fenster verkleinert, bleibt es
  // sichtbar. Erst danach übernehmen die vorbeiziehenden Projekttitel.
  if (mediaProgress.value < 0.98) {
    activeSlug.value = null
    activeTitlePresence.value = 0
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
  if (!project) return

  activeSlug.value = project.slug
  const itemOffset = projectTrackOffsets[bestIndex]
  const neighborOffset = trackOffset.value < itemOffset
    ? projectTrackOffsets[bestIndex - 1]
    : projectTrackOffsets[bestIndex + 1]
  const neighborDistance = neighborOffset === undefined
    ? Number.POSITIVE_INFINITY
    : Math.abs(neighborOffset - itemOffset) / 2
  const frame = projectFrameFor(project.slug)
  const openingWidth = window.innerWidth * (window.innerWidth < 768 ? 0.78 : 0.52) * FRAME_SCALE
    - frameDepth.value * (frame.inner.left + frame.inner.right)
  const travelRadius = Math.max(1, Math.min(openingWidth / 2, neighborDistance))
  const proximity = Math.max(0, Math.min(1, 1 - bestDistance / travelRadius))
  // Die Größe folgt unmittelbar der Scrollposition. An der Bildmitte ist
  // sie maximal; bis zum nächsten Titel schrumpft und verschwindet sie.
  activeTitlePresence.value = proximity * proximity * (3 - 2 * proximity)
}

/**
 * Eine einzige vertikale Scrollstrecke steuert zuerst die Verkleinerung des
 * Videos und anschließend die horizontale Bewegung der Projekttitel.
 */
function onScroll() {
  if (projectOpening.value) return
  const container = scrollRef.value
  if (!container || container.scrollHeight <= container.clientHeight + 1) return

  if (scrollFrame !== null) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = null
    updateActiveFromScroll()
  })
}

function onPointerMove(e: MouseEvent) {
  if (projectOpening.value) return
  cursorX.value = e.clientX
  cursorY.value = e.clientY
  cursorVisible.value = true

  const target = e.target as HTMLElement | null
  const hoveredLink = target?.closest('.ti-link, .ti-open-area')
  cursorHintVisible.value = !!hoveredLink

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
  hideCursorHint()
  cursorVisible.value = false
}

function handleProjectClick(slug: string) {
  openProject(slug)
}

onMounted(() => {
  componentMounted = true
  // Die Auswahl folgt der Scrollposition; die Maus zeigt den Öffnen-Hinweis.
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
  if (projectOpening.value) return
  const project = props.projects.find(item => item.slug === slug)
  const opening = backgroundRef.value?.querySelector<HTMLElement>('.project-frame__opening')
  const source = backgroundRef.value?.querySelector<HTMLVideoElement | HTMLImageElement>('.ti-bg__layer.is-visible .ti-bg__source')
  if (!project || !opening || !source) return

  const rect = source.getBoundingClientRect()
  const openingRect = opening.getBoundingClientRect()
  const previewSrc = source.getAttribute('src') || ''
  let poster = previewSrc
  // Das aktuelle Bild einschließlich seines Beschnitts hält den ersten
  // Übergangsframe stabil, während dieselbe Quelle im Vollbild geladen wird.
  try {
    const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth
    const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight
    if (sw && sh && rect.width && rect.height) {
      const canvas = document.createElement('canvas')
      const resolution = Math.min(2, 1600 / rect.width)
      canvas.width = Math.round(rect.width * resolution)
      canvas.height = Math.round(rect.height * resolution)
      const context = canvas.getContext('2d')
      if (context) {
        const scale = Math.max(canvas.width / sw, canvas.height / sh)
        const cropWidth = canvas.width / scale
        const cropHeight = canvas.height / scale
        context.drawImage(source, (sw - cropWidth) / 2, (sh - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height)
        poster = canvas.toDataURL('image/jpeg', 0.9)
      }
    }
  } catch { /* Lokale Cover bleiben auch ohne Momentaufnahme nutzbar. */ }

  const box = (bounds: DOMRect): OpeningBox => ({ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height })
  const media: CoverMedia = {
    type: source instanceof HTMLVideoElement ? 'video' : 'image',
    src: previewSrc,
  }
  hideCursorHint()
  cursorVisible.value = false
  beginProjectOpening({
    slug,
    title: project.title,
    href: hrefFor(slug),
    media,
    poster,
    previewSrc,
    currentTime: source instanceof HTMLVideoElement ? source.currentTime : 0,
    openingBox: box(openingRect),
    sourceBox: box(rect),
  })
}
</script>

<style scoped>
.title-index {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--page-bg, #000);
}

/* --- Wechselnder Bild-/Videohintergrund --- */

.ti-bg {
  width: calc(100vw - var(--media-shrink-x, 0vw));
  height: calc(100vh - var(--media-shrink-y, 0vh));
  overflow: visible;
  will-change: width, height;
}

/* Beim Verkleinern wird die Vorschau zu einem gerahmten Einzelwerk. */
.ti-bg__ornate-frame {
  position: absolute;
  inset: -8%;
  z-index: 3;
  display: block;
  width: 116%;
  height: 116%;
  max-width: none;
  opacity: var(--frame-progress, 0);
  pointer-events: none;
  transition: opacity 260ms ease;
}

.ti-bg__layer {
  position: absolute;
  inset: calc(var(--frame-progress, 0) * -8%);
  overflow: hidden;
  /* Das Bild liegt zwei Pixel unter der inneren Leiste. Dadurch bleiben
     auch bei Zwischenmaßen und geglätteten Kanten keine schwarzen Spalten. */
  clip-path: inset(
    calc((var(--frame-depth) * var(--frame-inner-top) - 2px) * var(--frame-progress, 0))
    calc((var(--frame-depth) * var(--frame-inner-right) - 2px) * var(--frame-progress, 0))
    calc((var(--frame-depth) * var(--frame-inner-bottom) - 2px) * var(--frame-progress, 0))
    calc((var(--frame-depth) * var(--frame-inner-left) - 2px) * var(--frame-progress, 0))
  );
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
  filter: grayscale(var(--preview-grayscale, 0));
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

.ti-scroll-hint {
  position: absolute;
  left: 50%;
  bottom: clamp(4.5rem, 9vh, 7rem);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  color: #000;
  font-size: clamp(0.62rem, 0.8vw, 0.75rem);
  font-weight: 600;
  letter-spacing: 0.18em;
  line-height: 1;
  text-transform: uppercase;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  transform: translateX(-50%);
}

.ti-scroll-hint__arrow {
  font-size: 1.1rem;
  animation: ti-scroll-hint-bounce 1.8s ease-in-out infinite;
}

.ti-scroll-hint-enter-active,
.ti-scroll-hint-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.ti-scroll-hint-enter-from,
.ti-scroll-hint-leave-to {
  opacity: 0;
  transform: translate(-50%, 0.5rem);
}

@keyframes ti-scroll-hint-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(0.35rem);
  }
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

.ti-open-area {
  position: absolute;
  z-index: 1;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  touch-action: pan-y;
}

.title-index.is-opening .ti-list,
.title-index.is-opening .ti-cursor { opacity: 0; pointer-events: none; }

.ti-scroll-space {
  width: 1px;
  pointer-events: none;
}

.ti-list {
  /* Vergrößerung des gewählten Titels. Steht hier, damit sie sowohl das
     transform auf .ti-link als auch die Schriftgrößen-Formel in .ti-title
     erreicht – Custom Properties vererben nur nach unten. */
  --active-scale: 1.42;
  position: absolute;
  z-index: 2;
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
  visibility: hidden;
  pointer-events: none;
}

.ti-item.is-active {
  visibility: visible;
  pointer-events: auto;
}

.ti-item.is-active .ti-link {
  opacity: var(--item-opacity, 1);
  /* Für jede Schrift anhand ihrer echten Breite berechnet. Dadurch wächst
     der Titel nur so weit, wie es der aktuelle Bildschirm erlaubt. */
  transform: scale(var(--item-active-scale, var(--active-scale, 1.28)));
}

.title-index.is-touch-mode .ti-item.is-active .ti-link {
  transform: scale(var(--item-active-scale, var(--active-scale, 1.26)));
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
  /* Keine zeitversetzte Überblendung: beim Titelwechsel ist nur einer sichtbar. */
  transition: none;
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
  border: 1px solid var(--brand-red);
  background: #000;
  color: var(--brand-red);
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
    --active-scale: 1.26;
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
  .ti-scroll-hint__arrow {
    animation: none;
  }

  .ti-item,
  .ti-title,
  .ti-title__text,
  .ti-project-logo,
  .ti-link {
    transition: none;
  }
}
</style>
