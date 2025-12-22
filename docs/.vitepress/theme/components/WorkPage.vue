<script setup lang="ts">
import { withBase, useRouter } from 'vitepress'
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'

type Card = {
  slug: string
  title: string
  name: string
  excerpt: string
  route: string   // `/works/?id=slug`
  image: string | null
  video: string | null
  component: any
}

// 1) Markdown as Vue components
const markdownModules = import.meta.glob('../../../works/**/index.md', {
  eager: true
})

// 2) Raw markdown text for meta (title, name, excerpt)
const markdownFiles = import.meta.glob('../../../works/**/index.md', {
  as: 'raw',
  eager: true
})

// Images
const imageFiles = import.meta.glob('../../../works/**/cover.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default'
})

// Videos (z.B. cover.mp4 im selben Ordner wie cover.jpg)
const videoFiles = import.meta.glob('../../../works/**/cover.{mp4,webm,ogg}', {
  eager: true,
  import: 'default'
})

const cards = ref<Card[]>([])

for (const path in markdownFiles) {
  const raw = markdownFiles[path] as string
  const lines = raw.split('\n')

  const titleLine = lines.find(line => line.startsWith('# '))
  const nameLine = lines.find(line => line.startsWith('## '))
  const excerptLine = lines.find(line => line.trim() && !line.startsWith('#'))

  // e.g. docs/works/my-work/index.md -> slug = "my-work"
  const match = path.match(/works\/([^/]+)\/index\.md$/)
  const slug = match?.[1] ?? ''

  // We stay on /works and switch via ?id=slug
  const route = `/works/?id=${slug}`

  const folder = path.replace(/\/index\.md$/, '/')
  const imageKey = Object.keys(imageFiles).find(k => k.startsWith(folder))
  const videoKey = Object.keys(videoFiles).find(k => k.startsWith(folder))

  const mod = markdownModules[path] as any

  cards.value.push({
    slug,
    title: titleLine?.replace(/^# /, '') || 'Untitled',
    name: nameLine?.replace(/^## /, '') || 'Anonymous',
    excerpt: excerptLine || '',
    route,
    image: imageKey ? (imageFiles[imageKey] as string) : null,
    video: videoKey ? (videoFiles[videoKey] as string) : null,
    component: mod?.default || null
  })
}

const router = useRouter()

// 👇 this is the *actual* selected work
const currentSlug = ref<string | undefined>(cards.value[0]?.slug)

// === Fullscreen-Overlay-Video State ===
const overlayVisible = ref(false)
const overlayVideoSrc = ref<string | null>(null)
const overlayTargetSlug = ref<string | null>(null)
const overlayFadingOut = ref(false)
const overlayVideoReady = ref(false) // NEW: erst anzeigen wenn Video wirklich ready ist

// Fade startet nach X ms, läuft dann über overlayFadeMs
const overlayFadeStartMs = 2000
const overlayFadeMs = 2000

// harte Umschaltzeit: nach 4s WorkPage zeigen, auch wenn Video noch läuft
const overlayCutToPageMs = 4000

let overlayFadeTimer: number | null = null
let overlayAfterFadeTimer: number | null = null // wird jetzt als Cut-Timer genutzt

function clearOverlayFadeTimer() {
  if (overlayFadeTimer !== null) {
    window.clearTimeout(overlayFadeTimer)
    overlayFadeTimer = null
  }
  if (overlayAfterFadeTimer !== null) {
    window.clearTimeout(overlayAfterFadeTimer)
    overlayAfterFadeTimer = null
  }
}

function showWorkPageFromOverlay() {
  const target = overlayTargetSlug.value
  if (!target) return

  overlayVisible.value = false
  overlayFadingOut.value = false
  overlayVideoSrc.value = null
  overlayVideoReady.value = false // NEW

  currentSlug.value = target
  router.go(withBase(`/works/?id=${encodeURIComponent(target)}`))
}

onBeforeUnmount(() => {
  clearOverlayFadeTimer()
})

const NAV_WHITE_CLASS = 'workpage-nav-white'

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add(NAV_WHITE_CLASS)
  }

  // initialer Slug aus URL
  currentSlug.value = getSlugFromLocation()

  // Wenn von Carousel mit ?play=1 gekommen:
  const { id, play } = getParamsFromLocation()
  if (id) {
    currentSlug.value = id
  }
  if (id && play) {
    // URL direkt bereinigen, bevor wir das Overlay starten
    updateUrlWithoutPlayParam(id)
    playProjectIntro(id, withBase('/Transition.mp4'))
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove(NAV_WHITE_CLASS)
  }
  clearOverlayFadeTimer()
})

// helper to read slug from current URL (?id=slug)
function getSlugFromLocation(): string | undefined {
  if (typeof window === 'undefined') {
    return cards.value[0]?.slug
  }

  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')
  return id || cards.value[0]?.slug
}

function getParamsFromLocation() {
  if (typeof window === 'undefined') {
    return {
      id: undefined as string | undefined,
      play: false,
      url: ''
    }
  }
  const url = window.location.href
  const params = new URLSearchParams(window.location.search)
  return {
    id: params.get('id') || undefined,
    play: params.get('play') === '1',
    url
  }
}

// neue Helper-Funktion: ?play=1 aus der URL entfernen, ?id behalten
function updateUrlWithoutPlayParam(id?: string) {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const params = url.searchParams

  if (id) {
    params.set('id', id)
  } else if (!params.get('id') && cards.value[0]?.slug) {
    params.set('id', cards.value[0].slug)
  }

  // ?play entfernen
  params.delete('play')

  url.search = params.toString()
  window.history.replaceState({}, '', url.toString())
}

// auch reagieren, wenn nur Query wechselt (SPA), damit Klicks zuverlässig sind
watch(
  () => typeof window !== 'undefined' ? window.location.search : '',
  () => {
    const { id, play } = getParamsFromLocation()
    if (id) {
      currentSlug.value = id
    }
    if (id && play) {
      // auch bei SPA-Query-Wechsel: URL bereinigen und dann Video starten
      updateUrlWithoutPlayParam(id)
      playProjectIntro(id, withBase('/Transition.mp4'))
    }
  }
)

// when user clicks in the sidebar
function selectCard(slug: string, routePath: string) {
  currentSlug.value = slug

  // keep the URL in sync (and let VitePress do SPA navigation)
  router.go(withBase(routePath))
}

// Wird z.B. vom Carousel aufgerufen:
// 1) Fullscreen-Video zeigen
// 2) Nach Ende: currentSlug setzen + URL updaten
function playProjectIntro(slug: string, videoSrc?: string | null) {
  const card = cards.value.find(c => c.slug === slug)
  if (!card) return

  // Video-Quelle: Priorität: explizit -> card.video -> null (kein Overlay)
  const src = videoSrc ?? card.video
  if (!src) {
    // Wenn kein Video vorhanden ist: direkt zur WorkPage
    selectCard(slug, `/works/?id=${slug}`)
    return
  }

  clearOverlayFadeTimer()
  overlayFadingOut.value = false
  overlayVideoReady.value = false // NEW: reset bei jedem Start
  overlayVideoSrc.value = src
  overlayTargetSlug.value = slug
  overlayVisible.value = true

  // nach X ms anfangen zu faden
  overlayFadeTimer = window.setTimeout(() => {
    overlayFadingOut.value = true
  }, overlayFadeStartMs)

  // nach 4 Sekunden IMMER zur WorkPage wechseln
  overlayAfterFadeTimer = window.setTimeout(() => {
    clearOverlayFadeTimer()
    showWorkPageFromOverlay()
  }, overlayCutToPageMs)
}

async function handleOverlayEnded() {
  // wenn wir schon zur WorkPage gewechselt haben, nix mehr tun
  if (!overlayVisible.value) return

  clearOverlayFadeTimer()

  if (!overlayTargetSlug.value) {
    overlayVisible.value = false
    overlayFadingOut.value = false
    return
  }

  // optional: beim echten Video-Ende trotzdem sauber ins Schwarz gehen
  overlayFadingOut.value = true
  await new Promise(resolve => setTimeout(resolve, overlayFadeMs + 100))

  showWorkPageFromOverlay()
}

const currentCard = computed(() =>
  cards.value.find(card => card.slug === currentSlug.value)
)

// Fade-in trigger beim Slug-Wechsel
const contentKey = ref(0)
watch(currentSlug, () => {
  contentKey.value += 1
})
</script>

<template>
  <!-- Fullscreen schwarzer Hintergrund -->
  <div class="h-screen w-full bg-black workpage-root overflow-hidden">
    <div class="flex flex-col h-full min-h-0">
      <!-- Fullscreen-Overlay-Video -->
      <div
        v-if="overlayVisible && overlayVideoSrc"
        class="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      >
        <video
          :src="overlayVideoSrc"
          class="w-full h-full object-contain transition-opacity duration-150"
          :class="overlayVideoReady ? 'opacity-100' : 'opacity-0'"
          autoplay
          playsinline
          preload="auto"
          @loadeddata="overlayVideoReady = true"
          @canplay="overlayVideoReady = true"
          @ended="handleOverlayEnded"
        />
        <!-- schwarzes Fade-Layer über dem Video -->
        <div
          class="absolute inset-0 bg-black pointer-events-none transition-opacity ease-in-out"
          style="transition-duration: 2000ms;"
          :class="overlayFadingOut ? 'opacity-100' : 'opacity-0'"
        />
      </div>

      <!-- Markdown Content (scrollbar hier) -->
      <section class="flex-1 min-h-0 w-full bg-black overflow-y-auto text-gray-100 workpage-content">
        <div class="p-6">
          <Transition name="fade" mode="out-in">
            <div v-if="currentCard" :key="contentKey" class="text-left">
              <component
                v-if="currentCard.component"
                :is="currentCard.component"
                class="prose prose-invert prose-base md:prose-lg max-w-none text-left"
              />
            </div>

            <!-- FIX: wieder abgeschnitten gewesen -->
            <div v-else :key="'not-found'" class="text-gray-400 text-left">
              Work not found.
            </div>
          </Transition>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* optional: besseres Scroll-Verhalten auf iOS */
.workpage-content {
  -webkit-overflow-scrolling: touch;
}

/* VitePress Theme-Hintergründe + Navbar-Variablen überschreiben */
:global(:root) {
  color-scheme: dark;
  --vp-c-bg: #000 !important;
  --vp-c-bg-alt: #000 !important;
  --vp-c-bg-elv: #000 !important;
  --vp-c-bg-soft: #000 !important;

  /* Navbar */
  --vp-nav-bg-color: #000 !important;
  --vp-nav-screen-bg-color: #000 !important;
}

/* VitePress Layout-Flächen hart auf schwarz (verhindert graue Ränder um deine Seite) */
:global(.Layout),
:global(.VPContent),
:global(.VPContent .container),
:global(.VPContent .content),
:global(.VPDoc),
:global(.VPDoc .container),
:global(.VPDoc .content-container) {
  background: #000 !important;
}

/* Navbar DOM-Elemente hart schwarz machen (falls Variablen nicht greifen) */
:global(.VPNav),
:global(.VPNavBar),
:global(.VPNavBar .container),
:global(.VPNavBar .content),
:global(.VPNavScreen) {
  background: #000 !important;
}

/* Optional: Trennlinie/Shadow der Navbar entfernen, der oft grau wirkt */
:global(.VPNavBar.has-sidebar),
:global(.VPNavBar) {
  box-shadow: none !important;
  border-bottom-color: transparent !important;
}

/* Navbar-Texte auf der WorkPage weiß machen */
:global(html.workpage-nav-white .VPNavBar .title),
:global(html.workpage-nav-white .VPNavBar .VPNavBarTitle),
:global(html.workpage-nav-white .VPNavBar .VPNavBarMenu .VPNavBarMenuLink),
:global(html.workpage-nav-white .VPNavBar .VPNavBarMenu .link),
:global(html.workpage-nav-white .VPNavBar .VPNavBarMenu .item),
:global(html.workpage-nav-white .VPNavBar .VPNavBarMenu .VPLink),
:global(html.workpage-nav-white .VPNavBar .search),
:global(html.workpage-nav-white .VPNavBar .VPNavBarSearch .search-input),
:global(html.workpage-nav-white .VPNavBar .VPNavBarSearch .search-icon) {
  color: #fff !important;
  fill: #fff !important;
}

/* Icons (z.B. Mobile Menu / GitHub-Icon) */
:global(html.workpage-nav-white .VPNavBar .VPNavBarMenu .icon),
:global(html.workpage-nav-white .VPNavBar .VPNavBarMenu .VPButton svg),
:global(html.workpage-nav-white .VPNavBar .VPNavScreenMenu .item .icon) {
  color: #fff !important;
  stroke: #fff !important;
  fill: #fff !important;
}
</style>