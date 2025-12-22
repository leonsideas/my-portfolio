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
              class="absolute bottom-10 left-1/2 -translate-x-1/2
                     px-6 py-2 z-10 cursor-pointer
                     flex items-center justify-center
                     bg-black/30 hover:bg-black/60
                     border border-white/40 hover:border-white
                     text-white text-xs md:text-sm tracking-[0.25em] uppercase
                     rounded-full"
              @click.prevent="handleSlideClick(index, slide)"
            >
              <span>
                open project
              </span>
            </button>

            <!-- 1) Video, wenn vorhanden -->
            <div v-if="slide.previewVideo || slide.video" class="w-full h-full">
              <video
                :src="slide.previewVideo || slide.video"
                class="w-full h-full object-cover"
                autoplay
                muted
                loop
                playsinline
              >
                <!-- weitere <source>-Tags möglich -->
              </video>
            </div>

            <!-- 2) Fallback: Bild-Vorschau -->
            <div
              v-else-if="slide.previewImage || slide.image"
              class="w-full h-full"
            >
              <img
                :src="slide.previewImage || slide.image"
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
              class="absolute inset-0 flex items-center justify-center p-6 md:p-10 pointer-events-none z-20"
            >
              <div class="max-w-2xl text-center mix-blend-difference center-text-shadow">
                <h2
                  class="mb-4 text-white font-semibold text-4xl md:text-7xl leading-tight"
                  :class="slide.titleFontClass"
                >
                  {{ slide.title }}
                </h2>
                <h3
                  v-if="slide.subtitle"
                  class="text-sm md:text-lg font-medium text-white mb-3"
                >
                  {{ slide.subtitle }}
                </h3>
                <p
                  class="text-white text-sm md:text-base leading-snug line-clamp-4 group-hover:line-clamp-none transition-all duration-300"
                >
                  {{ slide.description }}
                </p>
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

    <!-- linke Kante: "back" (nur wenn NICHT erster Slide) -->
    <a
      v-if="!isFirstSlide"
      href="#projects"
      class="absolute left-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none
             text-white/90 nav-link-font mix-blend-difference"
      aria-label="Zurück zum ersten Slide"
      @click.prevent="goTo(0)"
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
        back
      </span>
    </a>

    <!-- rechte Kante: "projects" nur beim ersten Slide, sonst "more" -->
    <a
      :href="isFirstSlide ? '#projects' : '#more'"
      class="absolute right-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none
             text-white/90 nav-link-font mix-blend-difference"
      :aria-label="isFirstSlide ? 'Zu Projects' : 'Nächster Slide'"
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
        {{ isFirstSlide ? 'projects' : 'more' }}
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
import { ref, computed, watchEffect, onMounted } from 'vue'
import { withBase, useRouter } from 'vitepress'

type Slide = {
  id?: string | number        // z.B. 'Klanggestalten'
  title?: string
  subtitle?: string
  description?: string
  image?: string | null       // optional bestehendes Bild
  previewImage?: string | null// automatisch abgeleitetes Bild, z.B. '/images/<id>-cover.jpg'
  video?: string | null       // z.B. '/videos/intro.mp4'
  previewVideo?: string | null// z.B. '/videos/Klanggestalten-cover.mp4'
  href?: string               // optional, aber hier nicht für preview genutzt
  titleFontClass?: string     // Neue optionale Klassen für die Titelschrift (z.B. 'font-display-a', 'font-display-b', ...)
}

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

const currentIndex = ref(0)
const timer = ref<number | null>(null)
const isHovered = ref(false)

// Erster Slide mit lokalem Video aus docs/public/videos/intro.mp4
const firstVideoSlide: Slide = {
  id: 'intro-video',
  //title: 'Mein Video',
  //subtitle: 'Intro',
  //description: 'Dieses Video wird als erstes im Loop abgespielt.',
  video: '/videos/intro.mp4',
  href: undefined,
  titleFontClass: 'font-intro' // Beispiel: eigene Font-Klasse für den Intro-Titel
}

// Mapping: jede Projekt-ID bekommt ihre eigene Font-Klasse
const titleFontById: Record<string, string> = {
  'Klanggestalten': 'font-klanggestalten',
  'Migration': 'font-migration',

  // Beispiel: wenn deine Konsole z.B. "Studio X" ausgibt:
  // 'Studio X': 'font-studiox',

  // Platzhalter ersetzen oder löschen, sonst passiert dafür nichts:
  // 'DEINE_3_SLIDE_ID': 'font-third',
}

// Array, das dein Video + optionalen Start-Slide + Projekt-Slides kombiniert
const displaySlides = computed<Slide[]>(() => {
  const baseSlides: Slide[] = props.startSlide
    ? [props.startSlide, ...props.slides]
    : props.slides

  const enrichedBaseSlides = baseSlides.map((slide) => {
    let updated = { ...slide }

    // 1) Preview-Video aus id ableiten, falls noch keins gesetzt
    if (!updated.previewVideo && updated.id) {
      updated.previewVideo = `/videos/${String(updated.id)}-cover.mp4`
    }

    // 2) Wenn es *trotzdem* kein Video gibt, ein Preview-Bild aus id ableiten
    //    (nur wenn noch kein Bild/previewImage gesetzt ist)
    if (
      !updated.previewVideo &&
      !updated.video &&
      !updated.previewImage &&
      !updated.image &&
      updated.id
    ) {
      // Passe das Pattern bei Bedarf an (.png, anderer Pfad, ...)
      updated.previewImage = `/images/${String(updated.id)}-cover.jpg`
    }

    // 3) Pro-Projekt-Font-Klasse aus Mapping setzen, falls noch nicht vorhanden
    if (!updated.titleFontClass && updated.id) {
      const key = String(updated.id)
      if (titleFontById[key]) {
        updated.titleFontClass = titleFontById[key]
      }
    }

    // FIX 1: falls title fehlt, nimm id als Titel (damit du überhaupt Text siehst)
    if (!updated.title && updated.id) {
      updated.title = String(updated.id)
    }

    // FIX 2: Font-Mapping: erst id, sonst title als Key benutzen
    if (!updated.titleFontClass) {
      const key =
        updated.id ? String(updated.id)
        : updated.title ? String(updated.title)
        : ''

      if (key && titleFontById[key]) {
        updated.titleFontClass = titleFontById[key]
      }
    }

    // Debug: zeigt dir, ob Migration wirklich die Klasse bekommt
    console.log('[Carousel] font:', { id: updated.id, title: updated.title, titleFontClass: updated.titleFontClass })

    console.debug('[Carousel] slide media:', updated.id, {
      previewVideo: updated.previewVideo,
      video: updated.video,
      previewImage: updated.previewImage,
      image: updated.image
    })

    return updated
  })

  return [firstVideoSlide, ...enrichedBaseSlides]
})

// Debug: alle aktuellen Slide-IDs einmal ausgeben
watchEffect(() => {
  const ids = displaySlides.value.map((s) => String(s.id ?? '(no-id)'))
  console.log('[Carousel] slide ids:', ids) // statt console.debug
})

// DEBUG: ist die Font wirklich geladen/verfügbar?
watchEffect(() => {
  const ok = typeof document !== 'undefined' && 'fonts' in document
    ? document.fonts.check('16px "Migration"')
    : null

  console.log('[Fonts] Migration verfügbar?', ok)
})

const intervalMs = () => (props.interval && props.interval > 0 ? props.interval : 5000)
const isLoop = () => props.loop !== false

const navbarHeightRem = 4
const carouselHeightClass = computed(
  () => `h-[calc(100vh-${navbarHeightRem}rem)]`
)

// gibt an, ob der aktuell sichtbare Slide der erste (Intro-)Slide ist
const isFirstSlide = computed(() => currentIndex.value === 0)

// Index des ersten Projekt-Slides (nach Intro + optional startSlide)
const firstProjectIndex = computed(
  () => 1 + (props.startSlide ? 1 : 0)
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
</script>

<style scoped>
/* Erzwingt vertikale Schrift für die Navigation-Pills */
.works-vertical {
  writing-mode: vertical-rl;
  text-orientation: mixed; /* alternativ: upright, falls du Buchstaben einzeln aufrecht willst */
}

.center-text-shadow {
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}
</style>