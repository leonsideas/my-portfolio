<template>
  <!-- eigener schwarzer Hintergrund, NavBar bleibt transparent -->
  <div
    class="carousel relative w-full overflow-hidden bg-black z-20"
    :class="carouselHeightClass"
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
        <!-- Wrapper ist NICHT klickbar -->
        <component
          :is="'div'"
          class="group block w-full h-full"
        >
          <!-- Media fullscreen -->
          <div class="relative w-full h-full bg-gray-900">
            <!-- Einzige Klickfläche, nur für Projekt-Slides (index > 0) -->
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
              <span>
                Projekt öffnen
              </span>
            </button>

            <!-- 1) Video, wenn vorhanden -->
            <div
              v-if="(slide.previewVideo || slide.video) && !brokenVideoIds.has(String(slide.id ?? index))"
              class="absolute inset-0 w-full h-full"
            >
              <video
                class="w-full h-full object-cover"
                autoplay
                muted
                loop
                playsinline
                preload="metadata"
                @error="() => markVideoBroken(slide, index)"
              >
                <source :src="toBase(slide.previewVideo || slide.video)" type="video/mp4" />
              </video>
            </div>

            <!-- 2) Fallback: Bild-Vorschau -->
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

            <!-- 3) Nichts vorhanden -->
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-gray-300"
            >
              Kein Video oder Bild verfügbar
            </div>

            <!-- Text-Overlay: über der Klickfläche, Pointer-Events deaktiviert -->
            <div
              class="absolute inset-0 flex items-start justify-center pt-32 md:pt-40 px-6 md:px-10 pointer-events-none z-20"
            >
              <div class="max-w-5xl text-center">
                <h2
                  class="mb-4 font-semibold text-6xl md:text-9xl leading-tight whitespace-normal md:whitespace-nowrap title-center"
                  :class="slide.titleFontClass"
                >
                  <!-- NEU: optional verlinkter Titel -->
                  <a
                    v-if="slide.titleLink"
                    :href="slide.titleLink"
                    class="pointer-events-auto inline-block hover:underline underline-offset-4 title-link-dark"
                    :aria-label="slide.titleLinkAriaLabel || `Öffne ${slide.title || 'Projekt'}`"
                    @click.prevent="handleTitleClick(slide)"
                  >
                    {{ slide.title }}
                  </a>
                  <span v-else class="title-dark">
                    {{ slide.title }}
                  </span>
                </h2>
              </div>
            </div>
          </div>
        </component>
      </div>
    </div>

    <!-- Unsichtbare Hover-/Klick-Zonen für Navigation -->
    <!--
    <div
      class="absolute inset-y-0 left-0 w-1/3"
      @click="prev"
    >
      <div class="w-full h-full cursor-w-resize"></div>
    </div>
    <div
      class="absolute inset-y-0 right-0 w-1/3"
      @click="next"
    >
      <div class="w-full h-full cursor-e-resize"></div>
    </div>
    -->

    <!-- linke Kante: "Projekte" (nur beim ersten Slide) -->
    <a
      v-if="isFirstSlide"
      href="#projects"
      class="absolute left-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none
             text-white/90 nav-link-font mix-blend-difference"
      aria-label="Projekte von hinten durchblättern"
      @click.prevent="goToProjectsFromEnd()"
    >
      <span
        class="flex items-center justify-center
               w-10
               h-40 py-2
               rounded-full
               border border-white/40 hover:border-white
               bg-black/30 hover:bg-black/60
               transition-colors duration-200
               tracking-[0.35em] uppercase works-vertical"
      >
        Projekte
      </span>
    </a>

    <!-- linke Kante: "back" (nur wenn NICHT erster Slide) -->
    <a
      v-if="!isFirstSlide"
      href="#projects"
      class="absolute left-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none
             text-white/90 nav-link-font mix-blend-difference"
      aria-label="Vorheriger Slide"
      @click.prevent="prev()"
    >
      <span
        class="works-vertical back-vertical
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

    <!-- rechte Kante: "projects" nur beim ersten Slide, sonst "more" -->
    <a
      :href="isFirstSlide ? '#projects' : '#more'"
      class="absolute right-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none
             text-white/90 nav-link-font mix-blend-difference"
      :aria-label="isFirstSlide ? 'Zu Projekten' : 'Nächster Slide'"
      @click.prevent="isFirstSlide ? goTo(firstProjectIndex) : next()"
    >
      <span
        class="works-vertical
               flex items-center justify-center
               w-10
               rounded-full
               border border-white/40 hover:border-white
               bg-black/30 hover:bg-black/60
               transition-colors duration-200
               tracking-[0.35em] uppercase"
        :class="isFirstSlide ? 'h-40 py-2' : 'h-28 py-1'"
      >
        {{ isFirstSlide ? 'Projekte' : 'mehr' }}
      </span>
    </a>

    <!-- Dots: entfernen/ausblenden -->
    <!--
    <div class="absolute bottom-3 left-0 right-0 flex items-center justify-center space-x-2">
      <button
        v-for="(slide, index) in displaySlides"
        :key="slide.id ?? index"
        type="button"
        class="h-2 rounded-full transition-all duration-300"
        :class="index === currentIndex ? 'w-6 bg-gray-800' : 'w-2 bg-gray-400/70 hover:bg-gray-600'"
        @click="goTo(index)"
      >
        <span class="sr-only">Gehe zu Slide {{ index + 1 }}</span>
      </button>
    </div>
    -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, onMounted, nextTick } from 'vue'
import { withBase, useRouter } from 'vitepress'

// ...existing code...

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
  href?: string
  titleFontClass?: string
  displayTitle?: string
  titleFontKey?: string
  titleLink?: string
  titleLinkAriaLabel?: string
}

// ENTFERNT: PreviewFrontmatter, PreviewMdModule, getPreviewMdContent, h1FromMarkdown,
// firstParagraphFromMarkdown, previewModules, getFrontmatter, folderNameFromPath,
// previewPathById, previewById

const router = useRouter()

const props = defineProps<{
  slides: Slide[]
  startSlide?: Slide
  autoplay?: boolean
  interval?: number
  loop?: boolean
}>()

// NEU: Uhrzeitabhängiger Zustand (Nacht = true, Tag = false)
const isNightTime = ref(false)

// NEU: Helper, ob aktuell 20:00–05:59 ist
function calcIsNight(): boolean {
  if (typeof window === 'undefined') return false
  const now = new Date()
  const h = now.getHours()
  return h >= 20 || h < 6
}

// NEU: beim Mounten initial setzen und alle 60s neu prüfen
onMounted(() => {
  isNightTime.value = calcIsNight()
  setInterval(() => {
    isNightTime.value = calcIsNight()
  }, 60_000)
})

const emit = defineEmits<{
  (e: 'open-project', slide: Slide): void
}>()

const currentIndex = ref(0)
const timer = ref<number | null>(null)
const isHovered = ref(false)

const brokenVideoIds = ref(new Set<string>())

function toBase(url?: string | null) {
  if (!url) return ''
  // externe URLs unverändert lassen
  if (/^https?:\/\//i.test(url)) return url
  return withBase(url)
}

function markVideoBroken(slide: Slide, index: number) {
  const id = String(slide.id ?? index)
  brokenVideoIds.value.add(id)

  // NEU: klare Fehlerspur mit finaler URL
  const src = toBase(slide.previewVideo || slide.video)
  console.warn('[Carousel] video failed:', { id, src })
}

// Erster Slide mit lokalem Video aus docs/public/videos/intro.mp4
const firstVideoSlide: Slide = {
  id: 'intro-video',
  video: '/videos/intro.mp4',
  // Nacht-Variante
  nightPreviewVideo: '/videos/background-night.mp4',
  href: undefined,
  titleFontClass: 'font-intro' // Beispiel: eigene Font-Klasse für den Intro-Titel
}

// NEU: Key -> CSS Klasse (die Klasse wiederum sollte eine @font-face Font benutzen)
const fontClassByKey: Record<string, string> = {
  klang: 'font-klanggestalten',
  migration: 'font-migration',
  moi: 'font-moi',
  light: 'font-light',
  font02: 'font-font02',
  font03: 'font-font03',
  font04: 'font-font04',
  font05: 'font-font05',
  // z.B. eigener Key für Übergangsobjekte
  uebergangsobjekte: 'font-uebergangsobjekte', // nutzt direkt deine Font aus fonts.css
}

// Optional: weiterhin Mapping per id möglich, wenn du das behalten willst
const titleFontById: Record<string, string> = {
  'Klanggestalten': 'font-klanggestalten',
  'Migration': 'font-migration',
  'Moi': 'font-moi',
  'LightbyNight': 'font-lightbynight',
  'Kilma': 'font-kilma',
  'Astronaut': 'font-save',
  'Uebergangsobjekte': 'font-uebergangsobjekte', // neu: eigene Klasse
}

// Array, das dein Video + optionalen Start-Slide + Projekt-Slides kombiniert
const displaySlides = computed<Slide[]>(() => {
  const baseSlides: Slide[] = props.startSlide
    ? [props.startSlide, ...props.slides]
    : props.slides

  const enrichedBaseSlides = baseSlides.map((slide) => {
    let updated: Slide = { ...slide }

    // 1) Preview-Video aus id ableiten, falls noch keins gesetzt
    if (!updated.previewVideo && updated.id) {
      updated.previewVideo = `/videos/${String(updated.id)}-cover.mp4`
    }

    // 2) Nacht-Preview automatisch ableiten, falls du nichts explizit setzt
    if (!updated.nightPreviewVideo && updated.id) {
      updated.nightPreviewVideo = `/videos/${String(updated.id)}-cover-night.mp4`
    }

    // 3) Wenn es *trotzdem* kein Video gibt, ein Preview-Bild aus id ableiten
    if (
      !updated.previewVideo &&
      !updated.video &&
      !updated.previewImage &&
      !updated.image &&
      updated.id
    ) {
      updated.previewImage = `/images/${String(updated.id)}-cover.jpg`
    }

    // 4) Pro-Projekt-Font-Klasse aus Mapping setzen, falls noch nicht vorhanden
    if (!updated.titleFontClass && updated.id) {
      const key = String(updated.id)
      if (titleFontById[key]) {
        updated.titleFontClass = titleFontById[key]
      }
    }

    // 5) falls title fehlt, nimm id als Titel
    if (!updated.title && updated.id) {
      updated.title = String(updated.id)
    }

    // 6) Individuellen Titel setzen (displayTitle > title > id)
    if (updated.displayTitle) updated.title = updated.displayTitle
    if (!updated.title && updated.id) updated.title = String(updated.id)

    // 7) Font-Key priorisieren (titleFontKey > titleFontClass > Mapping)
    if (!updated.titleFontClass && updated.titleFontKey) {
      updated.titleFontClass = fontClassByKey[updated.titleFontKey]
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
      updated.titleFontClass = fontClassByKey[updated.titleFontKey] || updated.titleFontClass
    }

    // 8) zum Schluss – je nach Zeit Tag- oder Nacht-Preview verwenden
    if (isNightTime.value && updated.nightPreviewVideo) {
      updated.previewVideo = updated.nightPreviewVideo
    }

    return updated
  })

  // Intro-Slide Tag/Nacht-abhängig behandeln
  const introSlide: Slide = (() => {
    const s: Slide = { ...firstVideoSlide }
    if (isNightTime.value && s.nightPreviewVideo) {
      s.previewVideo = s.nightPreviewVideo
      s.video = s.nightPreviewVideo
    } else {
      s.previewVideo = s.previewVideo ?? s.video ?? null
      s.video = '/videos/intro.mp4'
    }
    return s
  })()

  return [introSlide, ...enrichedBaseSlides]
})

// DEBUG: logge nur noch den Übergangsobjekte-Slide
watchEffect(() => {
  const slide = displaySlides.value.find(s => /uebergangsobjekte|Übergangsobjekte/i.test(String(s.id ?? s.title ?? '')))
  if (slide) {
    console.log('[Carousel] Übergangsobjekte slide:', {
      id: slide.id,
      title: slide.title,
      titleFontClass: slide.titleFontClass,
    })
  }
})

// Einmalig: zeige, welche Dateien der Carousel wirklich erwartet
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

// Debug: alle aktuellen Slide-IDs einmal ausgeben
watchEffect(() => {
  const ids = displaySlides.value.map((s) => String(s.id ?? '(no-id)'))
  console.log('[Carousel] slide ids:', ids) // statt console.debug
})

// DEBUG: ist die Font wirklich geladen/verfügbar?
watchEffect(() => {
  const okMigration = typeof document !== 'undefined' && 'fonts' in document
    ? document.fonts.check('16px "Migration"')
    : null

  const okUebergang = typeof document !== 'undefined' && 'fonts' in document
    ? document.fonts.check('16px "Uebergangsobjekte"')
    : null

  console.log('[Fonts] Migration verfügbar?', okMigration)
  console.log('[Fonts] Uebergangsobjekte verfügbar?', okUebergang)
})

// NEU: sobald Slides gerendert sind, schaue dir die tatsächliche h2-Klasse an
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

// gibt an, ob der aktuell sichtbare Slide der erste (Intro-)Slide ist
const isFirstSlide = computed(() => currentIndex.value === 0)

// NEU: "About" in der NavBar nur beim ersten Slide anzeigen (über html-Klasse)
watchEffect(() => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('has-carousel-intro', isFirstSlide.value)
})

// Index des ersten Projekt-Slides (nach Intro + optional startSlide)
const firstProjectIndex = computed(
  () => 1 + (props.startSlide ? 1 : 0)
)

// NEU: Index des letzten Projekt-Slides
const lastProjectIndex = computed(() =>
  Math.max(firstProjectIndex.value, displaySlides.value.length - 1)
)

// Navigation
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

// NEU: Von Intro aus ans Ende der Projekte springen und dann rückwärts sliden
function goToProjectsFromEnd() {
  if (!displaySlides.value.length) return

  // Wenn wir noch im Intro sind, direkt an das Ende der Projekte springen
  if (isFirstSlide.value) {
    currentIndex.value = lastProjectIndex.value
    return
  }

  // Wenn wir schon in den Projekten sind:
  // solange wir noch nicht beim ersten Projekt sind, einen Schritt zurück
  if (currentIndex.value > firstProjectIndex.value) {
    currentIndex.value--
  } else {
    // optional: wenn wir am Anfang der Projekte sind, wieder ans Ende springen
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
  // Nur über Button erreichbar, nicht full-screen
  if (index === 0) return

  if (slide.id) {
    const slug = String(slide.id)
    window.location.href = withBase(`/works/?id=${encodeURIComponent(slug)}&play=1`)
    return
  }

  if (slide.href) {
    window.location.href = slide.href
  }
}

function handleTitleClick(slide: Slide) {
  if (!slide.titleLink) return

  // Interne Links (VitePress) via router (ohne full reload), externe normal öffnen
  const url = slide.titleLink
  const isExternal = /^https?:\/\//i.test(url)

  if (isExternal) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  router.go(withBase(url))
}

// NEU: CV-Navigation (Pfad bei Bedarf anpassen, z.B. '/cv' oder '/Leon-Albers-CV.pdf')
// function goToCv() {
//   router.go(withBase('/cv'))
// }
</script>

<style scoped>
/* Erzwingt vertikale Schrift für die Navigation-Pills */
.works-vertical {
  writing-mode: vertical-rl;
  text-orientation: mixed; /* alternativ: upright, falls du Buchstaben einzeln aufrecht willst */
}

/* Titel immer mittig ausrichten, auch wenn andere Klassen etwas anderes setzen */
.title-center {
  text-align: center !important;
}

/* zusätzliche Sicherheit: alle h2 im Carousel mittig */
h2 {
  text-align: center !important;
}

/* schwarze Titel, auch wenn gemischte Fonts benutzt werden */
.title-dark {
  color: #000;
}

.title-link-dark {
  color: #000;
}

.title-link-dark:hover {
  color: #000;
}

@media (min-width: 768px) {
  /* Desktop: Titel deutlich größer und etwas weiter unten */
  h2.title-center {
    font-size: 8rem; /* von 5rem auf 8rem erhöht (entspricht grob text-9xl) */
  }

  /* optional: zusätzlicher top-offset, falls noch mehr Abstand gewünscht ist */
  .absolute.inset-0.flex.items-start.justify-center.pt-32.md\:pt-40 {
    padding-top: 11rem; /* feintuning für Desktop */
  }
}

/* 🔹 Mobile: spezifisch den Titel anpassen */
@media (max-width: 639px) {
  .carousel .absolute.inset-0.flex.items-start.justify-center {
    padding-top: 18vh;
    padding-inline: 1.5rem;
  }

  .carousel h2 {
    font-size: 2.8rem;
    line-height: 1.1;
    padding: 0;
    word-wrap: break-word;
    max-width: 90vw;
    margin: 0 auto;
  }
}

/* Gemeinsame Regeln: Container + Button immer als Referenz + zentriert */
.carousel .relative.w-full.h-full.bg-gray-900 {
  position: relative;
}

/* Button überall horizontal mittig zentrieren */
.carousel .project-open-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  left: 50% !important;
  transform: translateX(-50%) !important;
  /* optional: global ein wenig responsiver machen */
  max-width: 340px;
  width: 75vw;
  bottom: 12vh;
}

/* Grundverhalten: Button als Block in der Mitte falls absolute nicht greift */
.project-open-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
</style>