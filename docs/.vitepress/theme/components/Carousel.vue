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
        <!-- Wrapper ist NICHT klickbar -->
        <component
          :is="'div'"
          class="group block w-full h-full"
        >
          <!-- Media fullscreen -->
          <div class="relative w-full h-full bg-gray-900">
            <!-- Projekt öffnen: nur für Projekt-Slides (index > 0) -->
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

            <!-- Projekte: nur für Intro-Slide (index === 0) -->
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
              <span>
                Projekte
              </span>
            </button>

            <!-- 1) Video, wenn vorhanden -->
            <div
              v-if="(slide.previewVideo || slide.video) && !brokenVideoIds.has(String(slide.id ?? index))"
              class="absolute inset-0 w-full h-full"
            >
              <!-- Intro + alle anderen Slides: Video immer rendern -->
              <video
                class="w-full h-full object-cover"
                autoplay
                muted
                loop
                playsinline
                preload="metadata"
                @loadeddata="handleIntroLoaded(index)"
                @canplay="handleIntroLoaded(index)"
                @error="() => markVideoBroken(slide, index)"
              >
                <source :src="toBase(slide.previewVideo || slide.video)" type="video/mp4" />
              </video>

              <!-- Nur beim ersten Slide: Sheep-Overlay solange Video noch nicht „ready“ ist -->
              <img
                v-if="index === 0 && !isIntroVideoLoaded"
                :src="toBase('/images/Sheep.jpg')"
                alt=""
                class="absolute inset-0 w-full h-full object-cover"
              />
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
                  class="mb-4 font-semibold text-6xl md:text-9xl leading-tight whitespace-normal md:whitespace-nowrap title-center title-diff"
                  :class="slide.titleFontClass"
                  :style="undefined"
                >
                  <!-- Text, der gemessen wird -->
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

    <!-- linke Kante: "Projekte" beim Intro entfernt – jetzt im Slide selbst -->

    <!-- linke Kante: "back" (nur wenn NICHT erster Slide) -->
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

    <!-- rechte Kante: nur bei Projekten "Weiter" -->
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
  nightPreviewImage?: string | null
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

// NEU: Mobile-Flag (Tailwind "md" = 768px)
const isMobile = ref(false)
function calcIsMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}
function updateIsMobile() {
  isMobile.value = calcIsMobile()
}

// optional helper: mobile Cover aus id ableiten
function mobileCoverCandidatesById(id: string) {
  // .jpg ist bei dir vorhanden → zuerst probieren
  return [
    `/images/${id}-cover_mobile.jpg`,
    `/images/${id}-cover_mobile.jpeg`,
    `/images/${id}-cover_mobile.webp`,
    `/images/${id}-cover_mobile.png`,
  ]
}

// NEU: Helper, ob aktuell 20:00–05:59 ist
function calcIsNight(): boolean {
  if (typeof window === 'undefined') return false
  const now = new Date()
  const h = now.getHours()
  return h >= 20 || h < 6
}

// NEU: Helper -> aus einem nightPreviewImage (png/jpg/whatever) die mobile jpg-Variante machen
function toNightMobileJpg(src: string): string {
  // erwartet deine neue Konvention: "cover-night-mobil.jpg"
  // ersetzt nur das letzte Dateiende, egal ob .png/.jpg/.webp etc.
  return src.replace(/\.[a-z0-9]+$/i, '-mobil.jpg')
}

// NEU: beim Mounten initial setzen und alle 60s neu prüfen
onMounted(() => {
  isNightTime.value = calcIsNight()
  setInterval(() => {
    isNightTime.value = calcIsNight()
  }, 60_000)

  // NEU: initial + resize für mobile
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})

const emit = defineEmits<{
  (e: 'open-project', slide: Slide): void
}>()

const currentIndex = ref(0)
const timer = ref<number | null>(null)
const isHovered = ref(false)

const brokenVideoIds = ref(new Set<string>())

// NEU: Intro-Video-Ladezustand
const isIntroVideoLoaded = ref(false)

// wird nur für index === 0 benutzt
function handleIntroLoaded(index: number) {
  if (index === 0) {
    isIntroVideoLoaded.value = true
  }
}

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
  previewImage: '/images/intro-cover.png',
  // Nacht-Variante
  nightPreviewVideo: '/videos/background-night.mp4',
  nightPreviewImage: '/images/background-night.png',
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

    // 2) Nacht-Varianten NUR verwenden, wenn sie explizit im Slide gesetzt wurden
    //    (KEIN automatisches Ableiten aus id – die Dateien existieren meist nicht)

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

    // 8) Nachts: Video deaktivieren, stattdessen Nacht-Bild aus /images/ nutzen
    if (isNightTime.value) {
      // Explizites Nacht-Bild hat Vorrang
      if (slide.nightPreviewImage) {
        updated.previewImage = isMobile.value
          ? toNightMobileJpg(slide.nightPreviewImage)
          : slide.nightPreviewImage
      } else if (updated.id) {
        // Automatisch ableiten:
        // Desktop: /images/<id>_cover-night.png
        // Mobile:  /images/<id>_cover-night-mobil.jpg
        updated.previewImage = isMobile.value
          ? `/images/${String(updated.id)}_cover-night-mobil.jpg`
          : `/images/${String(updated.id)}_cover-night.png`
      }

      // Video komplett deaktivieren → Bild-Fallback greift
      updated.previewVideo = null
      updated.video = null
    }

    // NEU: Tagsüber auf Mobile: statt Videos/Hintergründen immer *-cover_mobile nutzen
    if (!isNightTime.value && isMobile.value) {
      const id = updated.id ? String(updated.id) : ''
      if (id) {
        const [mobileSrc] = mobileCoverCandidatesById(id)
        updated.previewImage = mobileSrc
      }
      // Video komplett deaktivieren → Bild-Fallback greift
      updated.previewVideo = null
      updated.video = null
    }

    return updated
  })

  // Intro-Slide Tag/Nacht-abhängig behandeln
  const introSlide: Slide = (() => {
    const s: Slide = { ...firstVideoSlide }
    if (isNightTime.value) {
      // Nachts: nur Bild, kein Video
      s.previewVideo = null
      s.video = null

      // NEU: Mobile-Nachtbild fürs Intro
      s.previewImage = isMobile.value
        ? (s.nightPreviewImage ? toNightMobileJpg(s.nightPreviewImage) : '/images/background-night-mobil.jpg')
        : (s.nightPreviewImage ?? '/images/background-night.png')

      return s
    }

    // NEU: Tag + Mobile: Intro auch als mobile Cover anzeigen
    if (isMobile.value) {
      // wenn du für intro auch eine Datei hast, wird die hier genutzt
      // (id vom intro ist "intro-video" -> /images/intro-video-cover_mobile.png)
      s.previewVideo = null
      s.video = null
      s.previewImage = '/images/Sheep-cover_mobile.jpg' // dein Asset-Name
      // optional, falls du lieber webp/png nutzt:
      // s.previewImage = '/images/Sheep-cover_mobile.webp'
      // s.previewImage = '/images/Sheep-cover_mobile.png'
      return s
    }

    // Tag + Desktop: Video wie bisher
    s.previewVideo = s.previewVideo ?? s.video ?? null
    s.video = '/videos/intro.mp4'
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

onMounted(() => {
  // ...existing code...
  // nach dem ersten Render mobile Größen berechnen
  // bei Slide-Wechsel oder Slide-Daten-Änderung neu berechnen
  // bei Resize auf mobile zurück neu messen
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

/* Difference-Blend nur direkt auf der Überschrift */
.title-diff {
  mix-blend-mode: difference;
}

/* schwarze Titel, auch wenn gemischte Fonts benutzt werden */
/* Farbe beibehalten – Kontrast kommt über mix-blend-mode:difference */
.title-dark {
  color: #000;
}

.title-link-dark {
  color: #000;
}

.title-link-dark:hover {
  color: #000;
}

/* Nachtmodus: Schrift weiß (Title + Link) */
.carousel.is-night .title-dark,
.carousel.is-night .title-link-dark,
.carousel.is-night .title-link-dark:hover {
  color: #fff !important;
}

/* optional: auch die vertikalen Nav-Pills etwas klarer in der Nacht */
.carousel.is-night .works-vertical {
  color: rgba(255, 255, 255, 0.95);
  border-color: rgba(255, 255, 255, 0.6);
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

  /* Desktop: Side-Nav auf gleiche Höhe wie project-open-btn */
  .carousel .carousel-side-nav {
    top: auto !important;
    bottom: 5vh !important;
    transform: none !important;
    mix-blend-mode: normal !important;
  }

  /* Vertikal-Schrift auf Desktop horizontal + gleicher Stil wie project-open-btn */
  .carousel .carousel-side-pill.works-vertical {
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;

    width: auto !important;
    height: auto !important;
    padding: 0.5rem 1.5rem !important;
    border-radius: 9999px !important;

    /* gleiche Schriftgröße wie project-open-btn (md:text-sm = 0.875rem) */
    font-size: 0.875rem !important;
    letter-spacing: 0.25em !important;
    white-space: nowrap;

    /* NEU: gleiche Mindestbreite wie project-open-btn für einheitliches Erscheinungsbild */
    min-width: 120px;
    text-align: center;
  }

  /* Links neben dem mittleren Button (rechter Rand endet vor Button-Mitte) */
  .carousel .carousel-side-nav.left-6 {
    left: 50% !important;
    right: auto !important;
    /* 170px = halbe max-width (340/2) vom project-open-btn; + gap */
    transform: translateX(calc(-170px - 0.75rem - 100%)) !important;
  }

  /* Rechts neben dem mittleren Button (linker Rand startet nach Button-Mitte) */
  .carousel .carousel-side-nav.right-6 {
    left: 50% !important;
    right: auto !important;
    transform: translateX(calc(170px + 0.75rem)) !important;
  }
}

/* 🔹 Mobile: spezifisch den Titel anpassen */
@media (max-width: 767px) {
  .carousel .absolute.inset-0.flex.items-start.justify-center {
    /* weiter mittig als vorher */
    padding-top: 26vh;
    padding-inline: 1.5rem;
  }

  .carousel h2 {
    /* vorher: clamp(2.5rem, 7vw, 3.25rem) */
    font-size: clamp(3rem, 9vw, 4.25rem);
    line-height: 1.05;
    margin: 0 auto;
    text-align: center;

    /* Umbruch erlauben */
    white-space: normal !important;
    overflow-wrap: anywhere;
    word-break: normal;

    /* konsistente Zeilenbreite */
    max-width: 92vw;
  }

  /* ── Mobile: Side-Nav = gleicher Stil wie project-open-btn ── */

  /* Beide Side-Navs: knapp über dem großen Button */
  .carousel .carousel-side-nav {
    top: auto !important;
    bottom: calc(12vh + 2.4rem) !important; /* näher am project-open-btn */
    transform: none !important;
    mix-blend-mode: normal !important;
  }

  /* Linker Button: linke Kante = linke Kante des großen Buttons
     großer Button: width min(75vw, 340px), zentriert → halbe Breite = min(37.5vw, 170px) */
  .carousel .carousel-side-nav.left-6 {
    left: 50% !important;
    right: auto !important;
    transform: translateX(max(-37.5vw, -170px)) !important;
  }

  /* Rechter Button: rechte Kante = rechte Kante des großen Buttons
     translateX(halbe Breite) minus eigene Breite (100%) */
  .carousel .carousel-side-nav.right-6 {
    left: 50% !important;
    right: auto !important;
    transform: translateX(calc(min(37.5vw, 170px) - 100%)) !important;
  }

  /* Pill-Span: identischer Look wie project-open-btn */
  .carousel .carousel-side-pill {
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
    white-space: nowrap;

    /* Maße zurücksetzen */
    width: auto !important;
    height: auto !important;

    /* Exakt wie project-open-btn */
    padding: 0.5rem 1.5rem !important;
    border-radius: 9999px !important;
    background: rgba(0, 0, 0, 0.3) !important;
    border: 1px solid rgba(255, 255, 255, 0.4) !important;
    color: #fff !important;
    font-size: 0.75rem !important;       /* text-xs */
    letter-spacing: 0.25em !important;    /* tracking-[0.25em] */
    text-transform: uppercase;
    cursor: pointer;
  }

  .carousel .carousel-side-pill:hover {
    background: rgba(0, 0, 0, 0.6) !important;
    border-color: rgba(255, 255, 255, 1) !important;
  }

  /* unified-Klasse braucht keine Extra-Overrides mehr */
  .carousel .carousel-side-pill--unified {
    /* alles kommt jetzt aus .carousel-side-pill oben */
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

/* Desktop: Button weiter nach unten */
@media (min-width: 768px) {
  .carousel .project-open-btn {
    bottom: 5vh;
  }
}
</style>