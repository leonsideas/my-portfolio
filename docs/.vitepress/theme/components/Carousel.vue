<template>
  <!-- eigener schwarzer Hintergrund, NavBar bleibt transparent -->
  <div
    class="carousel relative w-full overflow-hidden bg-black z-20"
    :class="[carouselHeightClass, {
      'is-night': isNightTime,
      'has-custom-cursor': hasFinePointer,
    }]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousemove="handleMouseMoveNav"
    @click="handleBackgroundClick"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Slides: Crossfade statt Translate -->
    <div class="relative h-full w-full">
      <div
        v-for="(slide, index) in displaySlides"
        :key="slide.id ?? index"
        class="absolute inset-0 w-full h-full transition-opacity duration-700 ease-out"
        :class="index === currentIndex ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
      >
        <component
          :is="'div'"
          class="group block w-full h-full"
        >
          <div class="relative w-full h-full bg-gray-900">
            <button
              v-if="index !== 0"
              type="button"
              class="absolute bottom-10 left-1/2
                     px-6 py-2 z-10 cursor-pointer
                     flex items-center justify-center
                     text-white text-xs md:text-sm tracking-[0.25em] uppercase
                     hover:underline underline-offset-4
                     project-open-btn"
              @click.prevent="handleSlideClick(index, slide)"
            >
              <span>Projekt öffnen</span>
            </button>

            <div
              v-if="slide.previewVideo || slide.video"
              class="w-full h-full"
            >
              <video
                :src="toBase(slide.previewVideo || slide.video)"
                class="w-full h-full object-cover"
                autoplay
                muted
                loop
                playsinline
                preload="metadata"
              />
            </div>

            <div
              v-else-if="slide.previewImage || slide.image"
              class="w-full h-full"
            >
              <img
                :src="toBase(slide.previewImage || slide.image)"
                class="w-full h-full object-cover"
                alt=""
              />
            </div>

            <div
              v-else
              class="w-full h-full flex items-center justify-center text-gray-300"
            >
              Kein Bild verfügbar
            </div>

            <div
              class="absolute inset-0 flex items-start justify-center pt-32 md:pt-40 px-6 md:px-10 pointer-events-none z-20"
            >
              <div class="max-w-5xl text-center">
                <h2
                  class="mb-4 font-semibold text-6xl md:text-9xl leading-tight whitespace-normal md:whitespace-nowrap title-center title-diff"
                  :class="slide.titleFontClass"
                  :style="{ '--title-chars': String((slide.title || '').length || 10) }"
                >
                  <a
                    v-if="slide.titleLink"
                    :href="slide.titleLink"
                    class="pointer-events-auto inline-block hover:underline underline-offset-4 title-link-dark slide-title-measure"
                    :aria-label="slide.titleLinkAriaLabel || `Öffne ${slide.title || 'Projekt'}`"
                    @click.prevent="handleTitleClick(slide)"
                  >
                    {{ slide.title }}
                  </a>
                  <span
                    v-else
                    class="title-dark slide-title-measure"
                  >
                    {{ slide.title }}
                  </span>
                </h2>
                <div
                  v-if="index !== 0 && slide.year"
                  class="slide-year text-white/80 text-xs md:text-sm tracking-[0.35em] uppercase mix-blend-difference"
                >
                  {{ slide.year }}
                </div>
              </div>
            </div>
          </div>
        </component>
      </div>
    </div>

    <!-- Eigener Pfeil-Cursor: folgt der Maus auf der ganzen Seite, Richtung je
         nach Bildhälfte (als Element statt CSS-cursor, da Safari keine
         SVG-Cursor rendert) -->
    <div
      v-show="hasFinePointer && cursorVisible"
      class="custom-cursor"
      aria-hidden="true"
      :style="{ transform: `translate3d(${cursorX - 22}px, ${cursorY - 22}px, 0)` }"
    >
      <svg viewBox="0 0 44 44" width="44" height="44" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path :d="cursorArrowPath" stroke="rgba(0, 0, 0, 0.4)" stroke-width="7.5" />
        <path :d="cursorArrowPath" stroke="#ffffff" stroke-width="4" />
      </svg>
    </div>

    <!-- Mobile: sichtbare Pfeile an den Rändern (Desktop nutzt den Pfeil-Cursor) -->
    <button
      type="button"
      class="carousel-edge-arrow carousel-edge-arrow--left"
      aria-label="Vorheriger Slide"
      @click.stop="prev()"
    >
      <svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M37 22 L9 22 M20 11 L9 22 L20 33" />
      </svg>
    </button>

    <button
      type="button"
      class="carousel-edge-arrow carousel-edge-arrow--right"
      aria-label="Nächster Slide"
      @click.stop="next()"
    >
      <svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7 22 L35 22 M24 11 L35 22 L24 33" />
      </svg>
    </button>

    <!-- Pagination: Dots -->
    <div
      v-if="!isFirstSlide"
      class="carousel-pagination absolute left-1/2 -translate-x-1/2 bottom-4 md:bottom-5 z-30
             flex items-center gap-3 pointer-events-auto select-none"
    >
      <button
        v-for="(slide, idx) in projectSlides"
        :key="slide.id ?? idx"
        type="button"
        class="carousel-dot"
        :class="{ 'is-active': idx + firstProjectIndex === currentIndex }"
        :aria-label="`Zu Slide ${idx + 1}`"
        @click="goTo(idx + firstProjectIndex)"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { withBase, useRouter } from 'vitepress'

type Slide = {
  id?: string | number
  title?: string
  subtitle?: string
  description?: string
  image?: string | null
  previewImage?: string | null
  video?: string | null
  previewVideo?: string | null
  nightPreviewVideo?: string | null
  nightPreviewImage?: string | null
  href?: string
  titleFontClass?: string
  displayTitle?: string
  titleFontKey?: string
  titleLink?: string
  titleLinkAriaLabel?: string
  year?: string
}

const router = useRouter()

const props = defineProps<{
  slides: Slide[]
  startSlide?: Slide
  autoplay?: boolean
  interval?: number
  loop?: boolean
}>()

const emit = defineEmits<{
  (e: 'open-project', slide: Slide): void
}>()

const isNightTime = ref(false)
const isMobile = ref(false)

function calcIsMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

function updateIsMobile() {
  isMobile.value = calcIsMobile()
}

function mobileCoverCandidatesById(id: string) {
  return [
    `/images/${id}-cover_mobile.webp`,
    `/images/${id}-cover_mobile.jpg`,
    `/images/${id}-cover_mobile.png`,
  ]
}

function calcIsNight(): boolean {
  if (typeof window === 'undefined') return false
  const now = new Date()
  const h = now.getHours()
  return h >= 20 || h < 6
}

function toNightMobileJpg(src: string): string {
  return src.replace(/\.[a-z0-9]+$/i, '-mobil.jpg')
}

let nightInterval: number | null = null

onMounted(() => {
  isNightTime.value = calcIsNight()

  nightInterval = window.setInterval(() => {
    isNightTime.value = calcIsNight()
  }, 60_000)

  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)

  hasFinePointer.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
})

onBeforeUnmount(() => {
  if (nightInterval !== null) {
    clearInterval(nightInterval)
  }
  window.removeEventListener('resize', updateIsMobile)
})

const currentIndex = ref(0)
const timer = ref<number | null>(null)
const isHovered = ref(false)

// Alle -animated Videos im docs/videos Ordner automatisch einsammeln.
// Dadurch erscheinen neue Videos sofort, sobald du sie hineinlegst,
// ohne Code-Änderung – fehlende Videos fallen auf Bilder zurück.
const animatedVideoFiles = import.meta.glob(
  '../../../videos/*-animated.mp4',
  { eager: true, import: 'default' }
) as Record<string, string>

const animatedVideoMap: Record<string, string> = {}
for (const path in animatedVideoFiles) {
  const filename = path.split('/').pop() || ''
  animatedVideoMap[filename] = animatedVideoFiles[path]
}

function getAnimatedDesktop(id: string): string | null {
  return animatedVideoMap[`${id}-cover-animated.mp4`] ?? null
}
function getAnimatedMobile(id: string): string | null {
  return animatedVideoMap[`${id}-cover_mobile-animated.mp4`] ?? null
}
function getAnimatedNight(id: string): string | null {
  return animatedVideoMap[`${id}_cover-night-animated.mp4`] ?? null
}

function toBase(url?: string | null) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return withBase(url)
}

const firstImageSlide: Slide = {
  id: 'intro-slide',
  previewVideo: '/videos/intro.mp4',
  href: undefined,
  titleFontClass: 'font-intro',
}

const fontClassByKey: Record<string, string> = {
  klang: 'font-klanggestalten',
  migration: 'font-migration',
  moi: 'font-moi',
  light: 'font-light',
  font02: 'font-font02',
  font03: 'font-font03',
  font04: 'font-font04',
  font05: 'font-font05',
  uebergangsobjekte: 'font-uebergangsobjekte',
}

const titleFontById: Record<string, string> = {
  Klanggestalten: 'font-klanggestalten',
  Migration: 'font-migration',
  Moi: 'font-moi',
  LightbyNight: 'font-lightbynight',
  Kilma: 'font-kilma',
  Astronaut: 'font-save',
  Uebergangsobjekte: 'font-uebergangsobjekte',
}

const displaySlides = computed<Slide[]>(() => {
  const baseSlides: Slide[] = props.startSlide
    ? [props.startSlide, ...props.slides]
    : props.slides

  const enrichedBaseSlides = baseSlides.map((slide) => {
    const updated: Slide = { ...slide }

    if (!updated.title && updated.id) {
      updated.title = String(updated.id)
    }

    if (updated.displayTitle) {
      updated.title = updated.displayTitle
    }

    if (!updated.titleFontClass && updated.titleFontKey) {
      updated.titleFontClass = fontClassByKey[updated.titleFontKey]
    }

    if (!updated.titleFontClass && updated.id) {
      const key = String(updated.id)
      if (titleFontById[key]) {
        updated.titleFontClass = titleFontById[key]
      }
    }

    if (!updated.titleFontClass) {
      const key =
        updated.id ? String(updated.id)
        : updated.title ? String(updated.title)
        : ''

      if (key && titleFontById[key]) {
        updated.titleFontClass = titleFontById[key]
      }
    }

    if (updated.titleFontKey) {
      updated.titleFontClass =
        fontClassByKey[updated.titleFontKey] || updated.titleFontClass
    }

    const id = updated.id ? String(updated.id) : ''

    if (isNightTime.value) {
      // 1) Animated Night-Video (gilt für Desktop + Mobile, da kein eigenes Mobile-Night-Video existiert)
      const nightVideo = id ? getAnimatedNight(id) : null
      if (nightVideo) {
        updated.previewVideo = nightVideo
        updated.previewImage = null
        updated.video = null
        return updated
      }

      // 2) Fallback: Night-Bild
      if (slide.nightPreviewImage) {
        updated.previewImage = isMobile.value
          ? toNightMobileJpg(slide.nightPreviewImage)
          : slide.nightPreviewImage
      } else if (id) {
        updated.previewImage = isMobile.value
          ? `/images/${id}_cover-night-mobil.webp`
          : `/images/${id}_cover-night.webp`
      }

      updated.previewVideo = null
      updated.video = null
      return updated
    }

    if (isMobile.value) {
      // 1) Mobile-Animated-Video (9:16)
      const mobileVideo = id ? getAnimatedMobile(id) : null
      if (mobileVideo) {
        updated.previewVideo = mobileVideo
        updated.previewImage = null
        updated.video = null
        return updated
      }

      // 2) Fallback: Mobile-Bild (kein Desktop-16:9-Video auf Mobile,
      //    damit das Format nicht kaputt aussieht)
      if (id) {
        const [mobileSrc] = mobileCoverCandidatesById(id)
        updated.previewImage = mobileSrc
      }
      updated.previewVideo = null
      updated.video = null
      return updated
    }

    // Desktop + Tag
    // 1) Desktop-Animated-Video
    const desktopVideo = id ? getAnimatedDesktop(id) : null
    if (desktopVideo) {
      updated.previewVideo = desktopVideo
      updated.previewImage = null
      updated.video = null
      return updated
    }

    // 2) Fallback: Desktop-Bild
    if (id) {
      updated.previewImage = `/images/${id}-cover.webp`
    } else if (!updated.previewImage && !updated.image) {
      updated.previewImage = null
    }

    updated.previewVideo = null
    updated.video = null

    return updated
  })

  const introSlide: Slide = (() => {
    const s: Slide = { ...firstImageSlide }

    if (isNightTime.value) {
      s.previewImage = isMobile.value
        ? (s.nightPreviewImage
            ? toNightMobileJpg(s.nightPreviewImage)
            : '/images/background-night-mobil.webp')
        : (s.nightPreviewImage ?? '/images/background-night.webp')

      s.previewVideo = null
      s.video = null
      return s
    }

    if (isMobile.value) {
      s.previewVideo = '/videos/intro-mobil.mp4'
      s.previewImage = null
      s.video = null
      return s
    }

    s.previewVideo = '/videos/intro.mp4'
    s.previewImage = null
    s.video = null
    return s
  })()

  return [introSlide, ...enrichedBaseSlides]
})



const intervalMs = () => (props.interval && props.interval > 0 ? props.interval : 5000)
const isLoop = () => props.loop !== false

const navbarHeightRem = 4
const carouselHeightClass = computed(
  () => `h-[calc(100vh-${navbarHeightRem}rem)]`
)

const isFirstSlide = computed(() => currentIndex.value === 0)

const projectSlides = computed<Slide[]>(() => displaySlides.value.slice(1))

// --- Swipe/Touch support ---
const touchStartX = ref<number | null>(null)
const touchStartY = ref<number | null>(null)
const SWIPE_THRESHOLD = 40

function handleTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  if (!t) return
  touchStartX.value = t.clientX
  touchStartY.value = t.clientY
}

function handleTouchMove(_e: TouchEvent) {
  // allow vertical scroll; handled on end
}

function handleTouchEnd(e: TouchEvent) {
  if (touchStartX.value === null || touchStartY.value === null) return
  const t = e.changedTouches[0]
  if (!t) return
  const dx = t.clientX - touchStartX.value
  const dy = t.clientY - touchStartY.value
  touchStartX.value = null
  touchStartY.value = null
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return
  if (dx < 0) next()
  else prev()
}

watchEffect(() => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('has-carousel-intro', isFirstSlide.value)
})

const firstProjectIndex = computed(() => 1 + (props.startSlide ? 1 : 0))

const lastProjectIndex = computed(() =>
  Math.max(firstProjectIndex.value, displaySlides.value.length - 1)
)

function next() {
  if (!displaySlides.value.length) return

  if (currentIndex.value < displaySlides.value.length - 1) {
    currentIndex.value++
  } else if (isLoop()) {
    currentIndex.value = 0
  }
}

function prev() {
  if (!displaySlides.value.length) return

  if (currentIndex.value > 0) {
    currentIndex.value--
  } else if (isLoop()) {
    currentIndex.value = displaySlides.value.length - 1
  }
}

function goTo(index: number) {
  if (index < 0 || index >= displaySlides.value.length) return
  currentIndex.value = index
}

function goToProjectsFromEnd() {
  if (!displaySlides.value.length) return

  if (isFirstSlide.value) {
    currentIndex.value = lastProjectIndex.value
    return
  }

  if (currentIndex.value > firstProjectIndex.value) {
    currentIndex.value--
  } else {
    currentIndex.value = lastProjectIndex.value
  }
}

function clearTimer() {
  if (timer.value !== null) {
    clearInterval(timer.value)
    timer.value = null
  }
}

function startAutoplay() {
  clearTimer()
  return
}

function handleMouseEnter() {
  isHovered.value = true
}

function handleMouseLeave() {
  isHovered.value = false
}

function handleSlideClick(index: number, slide: Slide) {
  if (index === 0) return

  emit('open-project', slide)

  if (slide.id) {
    const slug = String(slide.id)
    const playParam = isNightTime.value ? '' : '&play=1'
    window.location.href = withBase(`/works/?id=${encodeURIComponent(slug)}${playParam}`)
    return
  }

  if (slide.href) {
    window.location.href = slide.href
  }
}

// --- Pfeil-Cursor-Navigation: linke Hälfte = zurück, rechte Hälfte = weiter ---
const cursorSide = ref<'left' | 'right'>('right')
const cursorX = ref(0)
const cursorY = ref(0)
const hasFinePointer = ref(false)
// Über "Projekt öffnen" gilt wieder der normale Zeiger statt des Pfeils
const overInteractive = ref(false)
const cursorVisible = computed(() => isHovered.value && !overInteractive.value)

const cursorArrowPath = computed(() =>
  cursorSide.value === 'left'
    ? 'M37 22 L9 22 M20 11 L9 22 L20 33'
    : 'M7 22 L35 22 M24 11 L35 22 L24 33'
)

function sideFromEvent(e: MouseEvent): 'left' | 'right' {
  const el = e.currentTarget as HTMLElement | null
  if (!el) return 'right'
  const rect = el.getBoundingClientRect()
  return e.clientX - rect.left < rect.width / 2 ? 'left' : 'right'
}

function handleMouseMoveNav(e: MouseEvent) {
  cursorSide.value = sideFromEvent(e)
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  const rect = el.getBoundingClientRect()
  cursorX.value = e.clientX - rect.left
  cursorY.value = e.clientY - rect.top

  const target = e.target as HTMLElement | null
  overInteractive.value = !!target?.closest('.project-open-btn')
}

function handleBackgroundClick(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  if (target?.closest('button, a')) return
  if (sideFromEvent(e) === 'left') prev()
  else next()
}

function handleTitleClick(slide: Slide) {
  if (!slide.titleLink) return

  const url = slide.titleLink
  const isExternal = /^https?:\/\//i.test(url)

  if (isExternal) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  router.go(withBase(url))
}
</script>

<style scoped>
/* Eigener Pfeil-Cursor statt Zurück/Weiter-Buttons: der native Mauszeiger
   wird auf dem Carousel ausgeblendet, stattdessen fährt .custom-cursor mit
   und zeigt die Blätter-Richtung der jeweiligen Bildhälfte an */
.carousel.has-custom-cursor,
.carousel.has-custom-cursor :deep(*) {
  /* Unsichtbares PNG statt "none", weil Safari cursor:none ignoriert;
     als Datei statt Data-URI, weil Safari auch Data-URI-Cursor verwirft */
  cursor: url('../assets/transparent-cursor.png'), none !important;
}

/* Ausnahme: über "Projekt öffnen" gilt der normale Zeiger */
.carousel.has-custom-cursor :deep(.project-open-btn),
.carousel.has-custom-cursor :deep(.project-open-btn *) {
  cursor: pointer !important;
}

.custom-cursor {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 50;
  pointer-events: none;
  will-change: transform;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35));
}

/* Mobile-Pfeile: nur auf Touch-Geräten sichtbar, rahmenlos, mit Schatten
   für Lesbarkeit auf hellen Bildern */
.carousel-edge-arrow {
  display: none;
}

@media (hover: none), (max-width: 767px) {
  .carousel-edge-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 30;
    padding: 0.75rem;
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.55));
  }

  .carousel-edge-arrow svg {
    width: 26px;
    height: 26px;
  }

  .carousel-edge-arrow--left {
    left: 0.25rem;
  }

  .carousel-edge-arrow--right {
    right: 0.25rem;
  }
}

.title-center {
  text-align: center !important;
}

.title-diff {
  mix-blend-mode: difference;
}

.title-dark {
  color: #fff;
}

.title-link-dark {
  color: #fff;
}

.title-link-dark:hover {
  color: #fff;
}

.carousel.is-night .title-dark,
.carousel.is-night .title-link-dark,
.carousel.is-night .title-link-dark:hover {
  color: #fff !important;
}

@media (min-width: 768px) {
  h2.title-center {
    font-size: 8rem;
  }

  .absolute.inset-0.flex.items-start.justify-center.pt-32.md\:pt-40 {
    padding-top: 11rem;
  }

}

@media (max-width: 767px) {
  .carousel .absolute.inset-0.flex.items-start.justify-center {
    padding-top: 26vh;
    padding-inline: 1.5rem;
  }

  .carousel h2 {
    /* Elegante Auto-Größe: 92vw / (chars * 0.55) → so groß wie möglich, bleibt in einer Zeile */
    font-size: clamp(2rem, calc(92vw / var(--title-chars, 10) / 0.55), 5.5rem);
    line-height: 1.05;
    margin: 0 auto;
    text-align: center;
    white-space: nowrap !important;
    max-width: 96vw;
  }

}

.carousel .relative.w-full.h-full.bg-gray-900 {
  position: relative;
}

.carousel .project-open-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  left: 50% !important;
  transform: translateX(-50%) !important;
  max-width: 340px;
  width: 75vw;
  bottom: 12vh;
}

@media (min-width: 768px) {
  .carousel .project-open-btn {
    bottom: 5vh;
  }
}

/* --- Pagination dots --- */
.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.55);
  cursor: pointer;
  padding: 0;
  transition: background 200ms ease, transform 200ms ease, border-color 200ms ease;
}

.carousel-dot:hover {
  background: rgba(255, 255, 255, 0.6);
}

.carousel-dot.is-active {
  background: #fff;
  border-color: #fff;
  transform: scale(1.25);
}

.slide-year {
  display: inline-block;
  margin-top: 0.25rem;
  opacity: 0.9;
}

@media (max-width: 767px) {
  .carousel-pagination {
    bottom: 3.5vh !important;
  }
  .slide-year {
    font-size: 11px;
    letter-spacing: 0.35em;
  }
}
</style>