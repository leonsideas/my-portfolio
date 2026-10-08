<template>
  <div
    class="exhibition"
    :class="{ 'has-custom-cursor': hasFinePointer, 'is-opening': !!projectOpening }"
    @mousemove="onPointerMove"
    @mouseleave="cursorVisible = false"
  >
    <h1 class="exhibition__sr-only">Leon Albers – Creative Designer. Ausgewählte Projekte.</h1>
    <div ref="scrollRef" class="exhibition__scroll" @scroll.passive="onScroll">
      <div
        class="exhibition__stage"
        @wheel="onWheel"
        @touchstart.passive="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="touchStart = null"
        @touchcancel="touchStart = null"
      >
        <div class="exhibition__wall" role="group" aria-label="Projektausstellung">
          <GalleryArtwork
            v-for="(project, index) in projects"
            :key="project.slug"
            :ref="el => setArtworkRef(el, index)"
            :project="project"
            :media="mediaFor(project.slug)"
            :intro="index === 0 ? introMedia() : undefined"
            :style="artworkPosition(index)"
            :frame-depth="layout.depth"
            :painting-height="index === 0 ? firstPainting.height : layout.height"
            :frame-reveal="index === 0 ? zoomProgress : 1"
            :caption-reveal="captionReveal"
            :cover-reveal="coverReveal"
            :enabled="progress >= 0.995"
            :visible="isVisible(index, 0)"
            :should-load="index === 0 || isVisible(index, layout.step)"
            @focus="focusArtwork(index)"
          />
        </div>
      </div>
      <div class="exhibition__space" :style="{ height: `${scrollDistance}px` }" aria-hidden="true" />
    </div>
    <div
      v-if="hasFinePointer"
      class="exhibition__cursor"
      :class="{ 'is-visible': cursorVisible, 'is-expanded': cursorExpanded }"
      :style="{ transform: `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)` }"
      aria-hidden="true"
    ><span>Projekt öffnen</span></div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GalleryArtwork from './GalleryArtwork.vue'
import { useCoverMedia } from '../composables/useCoverMedia'
import { projectOpening } from '../composables/useProjectOpening'

const props = defineProps<{ projects: { slug: string; title: string; year: string | null; fontClass?: string; logoSrc?: string }[] }>()
const { mediaFor, introMedia } = useCoverMedia()
const viewport = ref({ width: 1280, height: 800 })
const scrollRef = ref<HTMLElement | null>(null)
const artworks = ref<(InstanceType<typeof GalleryArtwork> | null)[]>([])
const scrollPosition = ref(0)
const hasFinePointer = ref(false)
const cursorVisible = ref(false)
const cursorExpanded = ref(false)
const cursorX = ref(0)
const cursorY = ref(0)
let scrollFrame: number | null = null
let touchStart: { x: number; y: number; scroll: number; horizontal: boolean } | null = null

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const smooth = (value: number) => value * value * (3 - 2 * value)
const introDistance = computed(() => viewport.value.height * 0.95)
const progress = computed(() => clamp(scrollPosition.value / introDistance.value, 0, 1))
const zoomProgress = computed(() => smooth(progress.value))
const captionReveal = computed(() => smooth(clamp((progress.value - 0.55) / 0.45, 0, 1)))
const coverReveal = computed(() => smooth(clamp((progress.value - 0.62) / 0.36, 0, 1)))

const layout = computed(() => {
  const { width, height } = viewport.value
  const mobile = width < 768
  const paintingWidth = mobile ? width * 0.8 : clamp(width * 0.34, 320, 620)
  const paintingHeight = mobile
    ? Math.min(paintingWidth * 1.2, height * 0.51)
    : Math.min(paintingWidth * 0.78, height * 0.53)
  const padding = width * (mobile ? 0.1 : 0.08)
  const gap = mobile ? width * 0.13 : clamp(width * 0.075, 64, 120)
  const step = paintingWidth + gap
  const travel = Math.max(0, padding * 2 + props.projects.length * paintingWidth + (props.projects.length - 1) * gap - width)
  return {
    width: paintingWidth,
    height: paintingHeight,
    top: Math.max(mobile ? 136 : 170, (height - paintingHeight + (mobile ? 30 : 58)) / 2),
    padding, gap, step, travel,
    depth: Math.round(clamp(paintingWidth * 0.18, 46, 108)),
  }
})
const horizontalOffset = computed(() => clamp(scrollPosition.value - introDistance.value, 0, layout.value.travel))
const scrollDistance = computed(() => Math.ceil(introDistance.value + layout.value.travel))
const firstPainting = computed(() => {
  const t = zoomProgress.value
  const mix = (start: number, end: number) => start + (end - start) * t
  return {
    left: mix(0, layout.value.padding) - horizontalOffset.value,
    top: mix(0, layout.value.top),
    width: mix(viewport.value.width, layout.value.width),
    height: mix(viewport.value.height, layout.value.height),
  }
})

function artworkPosition(index: number) {
  const first = firstPainting.value
  const left = index === 0 ? first.left : first.left + first.width + layout.value.gap + (index - 1) * layout.value.step
  return { left: `${left}px`, top: `${index === 0 ? first.top : layout.value.top}px`, width: `${index === 0 ? first.width : layout.value.width}px` }
}

function isVisible(index: number, margin: number) {
  const left = parseFloat(artworkPosition(index).left)
  const width = index === 0 ? firstPainting.value.width : layout.value.width
  return left + width > -margin && left < viewport.value.width + margin
}

function setArtworkRef(el: unknown, index: number) {
  artworks.value[index] = el as InstanceType<typeof GalleryArtwork> | null
}

function updateScroll() {
  if (projectOpening.value) return
  scrollPosition.value = scrollRef.value?.scrollTop ?? 0
  document.documentElement.classList.toggle('home-intro-active', progress.value < 0.45)
}

function onScroll() {
  if (scrollFrame !== null || projectOpening.value) return
  scrollFrame = requestAnimationFrame(() => { scrollFrame = null; updateScroll() })
}

async function updateViewport() {
  const current = scrollRef.value?.scrollTop ?? 0
  const previousIntro = introDistance.value
  const previousTravel = layout.value.travel
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
  await nextTick()
  if (!scrollRef.value) return
  scrollRef.value.scrollTop = current < previousIntro
    ? current / previousIntro * introDistance.value
    : introDistance.value + (previousTravel ? (current - previousIntro) / previousTravel * layout.value.travel : 0)
  updateScroll()
}

function focusArtwork(index: number) {
  if (progress.value < 0.995 || isVisible(index, -layout.value.width * 0.5)) return
  const offset = clamp(layout.value.padding + index * layout.value.step + layout.value.width / 2 - viewport.value.width / 2, 0, layout.value.travel)
  scrollRef.value?.scrollTo({ top: introDistance.value + offset, behavior: 'instant' })
}

function onWheel(event: WheelEvent) {
  if (progress.value < 0.995 || Math.abs(event.deltaX) <= Math.abs(event.deltaY) || !scrollRef.value) return
  event.preventDefault()
  scrollRef.value.scrollTop += event.deltaX
}

function onTouchStart(event: TouchEvent) {
  if (event.touches.length !== 1 || progress.value < 0.995) return
  const touch = event.touches[0]
  touchStart = { x: touch.clientX, y: touch.clientY, scroll: scrollRef.value?.scrollTop ?? 0, horizontal: false }
}

function onTouchMove(event: TouchEvent) {
  if (!touchStart || !scrollRef.value || event.touches.length !== 1 || projectOpening.value) return
  const dx = event.touches[0].clientX - touchStart.x
  const dy = event.touches[0].clientY - touchStart.y
  if (!touchStart.horizontal && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) touchStart.horizontal = true
  if (touchStart.horizontal) {
    event.preventDefault()
    scrollRef.value.scrollTop = touchStart.scroll - dx
  }
}

function onPointerMove(event: MouseEvent) {
  if (projectOpening.value) return
  cursorX.value = event.clientX
  cursorY.value = event.clientY
  cursorVisible.value = true
  cursorExpanded.value = !!(event.target as HTMLElement)?.closest('.gallery-artwork.is-enabled')
}

watch(projectOpening, opening => { if (opening) cursorVisible.value = false })
onMounted(() => {
  hasFinePointer.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  updateViewport()
  window.addEventListener('resize', updateViewport)
})
onBeforeUnmount(() => {
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame)
  window.removeEventListener('resize', updateViewport)
  document.documentElement.classList.remove('home-intro-active')
})
</script>

<style scoped>
.exhibition { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--page-bg, #000); }
.exhibition__scroll { height: 100%; overflow-x: hidden; overflow-y: auto; overflow-anchor: none; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.exhibition__scroll::-webkit-scrollbar { display: none; }
.exhibition__stage { position: sticky; top: 0; width: 100%; height: 100%; overflow: clip; }
.exhibition__wall { position: absolute; inset: 0; }
.exhibition__space { width: 1px; pointer-events: none; }
.exhibition__sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
.exhibition.has-custom-cursor, .exhibition.has-custom-cursor * { cursor: url('../assets/transparent-cursor.png'), none !important; }
.exhibition__cursor { position: absolute; top: 0; left: 0; z-index: 4; display: flex; align-items: center; justify-content: center; width: 1.1rem; height: 1.1rem; border: 1px solid var(--brand-red); border-radius: 50%; background: #000; color: var(--brand-red); opacity: 0; pointer-events: none; transition: width 220ms ease, height 220ms ease, opacity 160ms ease; }
.exhibition__cursor.is-visible { opacity: 1; }
.exhibition__cursor.is-expanded { width: 4.75rem; height: 4.75rem; }
.exhibition__cursor span { max-width: 3.8rem; opacity: 0; font-size: 0.52rem; line-height: 1.2; letter-spacing: 0.08em; text-transform: uppercase; text-align: center; transition: opacity 140ms ease; }
.exhibition__cursor.is-expanded span { opacity: 1; }
.exhibition.is-opening .exhibition__cursor { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .exhibition__cursor { transition: none; } }
</style>
