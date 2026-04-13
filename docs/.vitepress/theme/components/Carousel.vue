<template>
  <!-- eigener schwarzer Hintergrund, NavBar bleibt transparent -->
  <div
    class="carousel relative w-full overflow-hidden bg-black z-20"
    :class="[carouselHeightClass, { 'is-night': isNightTime }]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
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
                     bg-black/30 hover:bg-black/60
                     border border-white/40 hover:border-white
                     text-white text-xs md:text-sm tracking-[0.25em] uppercase
                     rounded-full project-open-btn"
              @click.prevent="handleSlideClick(index, slide)"
            >
              <span>Projekt öffnen</span>
            </button>

            <button
              v-if="index === 0"
              type="button"
              class="absolute bottom-10 left-1/2
                     px-6 py-2 z-10 cursor-pointer
                     flex items-center justify-center
                     bg-black/30 hover:bg-black/60
                     border border-white/40 hover:border-white
                     text-white text-xs md:text-sm tracking-[0.25em] uppercase
                     rounded-full project-open-btn"
              @click.prevent="goTo(firstProjectIndex)"
            >
              <span>Projekte</span>
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
              </div>
            </div>
          </div>
        </component>
      </div>
    </div>

    <a
      v-if="!isFirstSlide"
      href=""
      class="carousel-side-nav absolute left-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none
             text-white/90 nav-link-font mix-blend-difference"
      aria-label="Vorheriger Slide"
      @click.prevent="prev()"
    >
      <span
        class="carousel-side-pill carousel-side-pill--unified works-vertical back-vertical
               flex items-center justify-center
               w-10 h-28
               rounded-full
               border border-white/40 hover:border-white
               bg-black/30 hover:bg-black/60
               transition-colors duration-200
               tracking-[0.35em] uppercase"
      >
        zurück
      </span>
    </a>

    <a
      v-if="!isFirstSlide"
      href=""
      class="carousel-side-nav absolute right-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none
             text-white/90 nav-link-font mix-blend-difference"
      aria-label="Nächster Slide"
      @click.prevent="next()"
    >
      <span
        class="carousel-side-pill carousel-side-pill--unified works-vertical
               flex items-center justify-center
               w-10
               rounded-full
               border border-white/40 hover:border-white
               bg-black/30 hover:bg-black/60
               transition-colors duration-200
               tracking-[0.35em] uppercase
               h-28 py-1"
      >
        Weiter
      </span>
    </a>
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

    if (isNightTime.value) {
      if (slide.nightPreviewImage) {
        updated.previewImage = isMobile.value
          ? toNightMobileJpg(slide.nightPreviewImage)
          : slide.nightPreviewImage
      } else if (updated.id) {
        updated.previewImage = isMobile.value
          ? `/images/${String(updated.id)}_cover-night-mobil.webp`
          : `/images/${String(updated.id)}_cover-night.webp`
      }

      updated.previewVideo = null
      updated.video = null

      return updated
    }

    if (isMobile.value) {
      const id = updated.id ? String(updated.id) : ''
      if (id) {
        const [mobileSrc] = mobileCoverCandidatesById(id)
        updated.previewImage = mobileSrc
      }
      updated.previewVideo = null
      updated.video = null
      return updated
    }

    if (updated.id) {
      updated.previewImage = `/images/${String(updated.id)}-cover.webp`
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

watchEffect(() => {
  const slide = displaySlides.value.find((s) =>
    /uebergangsobjekte|Übergangsobjekte/i.test(String(s.id ?? s.title ?? ''))
  )
  if (slide) {
    console.log('[Carousel] Übergangsobjekte slide:', {
      id: slide.id,
      title: slide.title,
      titleFontClass: slide.titleFontClass,
    })
  }
})

let didLogExpectedAssets = false
watchEffect(() => {
  if (didLogExpectedAssets) return
  if (!displaySlides.value.length) return
  didLogExpectedAssets = true

  const expected = displaySlides.value.map((s, i) => {
    const id = String(s.id ?? i)
    return {
      id,
      video: s.previewVideo || s.video || null,
      image: s.previewImage || s.image || null,
    }
  })

  console.log('[Carousel] expected assets (relative):', expected)
})

watchEffect(() => {
  const ids = displaySlides.value.map((s) => String(s.id ?? '(no-id)'))
  console.log('[Carousel] slide ids:', ids)
})

watchEffect(() => {
  const okMigration =
    typeof document !== 'undefined' && 'fonts' in document
      ? document.fonts.check('16px "Migration"')
      : null

  const okUebergang =
    typeof document !== 'undefined' && 'fonts' in document
      ? document.fonts.check('16px "Uebergangsobjekte"')
      : null

  console.log('[Fonts] Migration verfügbar?', okMigration)
  console.log('[Fonts] Uebergangsobjekte verfügbar?', okUebergang)
})

watchEffect(async () => {
  await nextTick()
  if (typeof document === 'undefined') return
  const el = document.querySelector('html .carousel h2')
  if (!el) return
  console.log('[Carousel] first h2 classes:', (el as HTMLElement).className)
})

const intervalMs = () => (props.interval && props.interval > 0 ? props.interval : 5000)
const isLoop = () => props.loop !== false

const navbarHeightRem = 4
const carouselHeightClass = computed(
  () => `h-[calc(100vh-${navbarHeightRem}rem)]`
)

const isFirstSlide = computed(() => currentIndex.value === 0)

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
.works-vertical {
  writing-mode: vertical-rl;
  text-orientation: mixed;
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

.carousel.is-night .works-vertical {
  color: rgba(255, 255, 255, 0.95);
  border-color: rgba(255, 255, 255, 0.6);
}

@media (min-width: 768px) {
  h2.title-center {
    font-size: 8rem;
  }

  .absolute.inset-0.flex.items-start.justify-center.pt-32.md\:pt-40 {
    padding-top: 11rem;
  }

  .carousel .carousel-side-nav {
    top: auto !important;
    bottom: 5vh !important;
    transform: none !important;
    mix-blend-mode: normal !important;
  }

  .carousel .carousel-side-pill.works-vertical {
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
    width: auto !important;
    height: auto !important;
    padding: 0.5rem 1.5rem !important;
    border-radius: 9999px !important;
    font-size: 0.875rem !important;
    letter-spacing: 0.25em !important;
    white-space: nowrap;
    min-width: 120px;
    text-align: center;
  }

  .carousel .carousel-side-nav.left-6 {
    left: 50% !important;
    right: auto !important;
    transform: translateX(calc(-170px - 0.75rem - 100%)) !important;
  }

  .carousel .carousel-side-nav.right-6 {
    left: 50% !important;
    right: auto !important;
    transform: translateX(calc(170px + 0.75rem)) !important;
  }
}

@media (max-width: 767px) {
  .carousel .absolute.inset-0.flex.items-start.justify-center {
    padding-top: 26vh;
    padding-inline: 1.5rem;
  }

  .carousel h2 {
    font-size: clamp(3rem, 9vw, 4.25rem);
    line-height: 1.05;
    margin: 0 auto;
    text-align: center;
    white-space: normal !important;
    overflow-wrap: anywhere;
    word-break: normal;
    max-width: 92vw;
  }

  .carousel .carousel-side-nav {
    top: auto !important;
    bottom: calc(12vh + 2.4rem) !important;
    transform: none !important;
    mix-blend-mode: normal !important;
  }

  .carousel .carousel-side-nav.left-6 {
    left: 50% !important;
    right: auto !important;
    transform: translateX(max(-37.5vw, -170px)) !important;
  }

  .carousel .carousel-side-nav.right-6 {
    left: 50% !important;
    right: auto !important;
    transform: translateX(calc(min(37.5vw, 170px) - 100%)) !important;
  }

  .carousel .carousel-side-pill {
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
    white-space: nowrap;
    width: auto !important;
    height: auto !important;
    padding: 0.5rem 1.5rem !important;
    border-radius: 9999px !important;
    background: rgba(0, 0, 0, 0.3) !important;
    border: 1px solid rgba(255, 255, 255, 0.4) !important;
    color: #fff !important;
    font-size: 0.75rem !important;
    letter-spacing: 0.25em !important;
    text-transform: uppercase;
    cursor: pointer;
  }

  .carousel .carousel-side-pill:hover {
    background: rgba(0, 0, 0, 0.6) !important;
    border-color: rgba(255, 255, 255, 1) !important;
  }

  .carousel .carousel-side-pill--unified {
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
</style>