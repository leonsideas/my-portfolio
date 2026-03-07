<script setup lang="ts">
import { withBase, useRouter } from 'vitepress'
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'

type CardVideo = {
  url: string
  title?: string
}

type Card = {
  slug: string
  title: string
  name: string
  excerpt: string
  route: string
  image: string | null
  video: string | null
  component: any
  images: string[]
  videos: CardVideo[]
}

type OverlayFadeMode = 'fade-out' | 'fade-in' | 'none'
const overlayFadeMode = ref<OverlayFadeMode>('fade-out')

// kein schwarzer Fade-Layer rendern
const overlayFadeDisabled = ref(false)
// nach Ende der Transition ein Hard-Reload auf targetRoute?
const overlayUseHardReload = ref(false)
// Spezialfall – Transition_up zurück zum Home-Carousel
const overlayHomeToRoot = ref(false)

// Standard-Seitentitel merken, damit wir ihn wiederherstellen können
const defaultDocumentTitle =
  typeof document !== 'undefined' ? document.title : 'Leon Albers | Portfolio'

// 1) Markdown as Vue components
const markdownModules = import.meta.glob('../../../works/**/index.md', { eager: true })

// 2) Raw markdown text for meta (title, name, excerpt)
const markdownFiles = import.meta.glob('../../../works/**/index.md', { as: 'raw', eager: true })

// Images
const imageFiles = import.meta.glob('../../../works/**/cover.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default'
})

// Videos (Cover)
const videoFiles = import.meta.glob('../../../works/**/cover.{mp4,webm,ogg}', {
  eager: true,
  import: 'default'
})

// beliebige Projektbilder
const projectImageFiles = import.meta.glob('../../../works/**/*.{jpg,jpeg,png,webp,gif}', {
  eager: true,
  import: 'default'
})

// Einfacher Frontmatter-Parser aus Raw-Text
function parseRawFrontmatter(raw: string): Record<string, any> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const block = match[1]
  const result: Record<string, any> = {}
  let currentKey: string | null = null
  let currentArray: any[] | null = null

  for (const line of block.split('\n')) {
    const topLevel = line.match(/^(\w+)\s*:\s*(.*)$/)
    if (topLevel) {
      if (currentKey && currentArray) {
        result[currentKey] = currentArray
      }
      const [, key, val] = topLevel
      if (val.trim() === '') {
        currentKey = key
        currentArray = []
      } else {
        result[key] = val.trim()
        currentKey = null
        currentArray = null
      }
      continue
    }
    const arrayItem = line.match(/^\s+-\s+(.*)$/)
    if (arrayItem && currentArray !== null) {
      const val = arrayItem[1].trim()
      if (val.startsWith('url:') || val.startsWith('title:')) {
        // key-value in object
        const kv = val.match(/^(\w+):\s*(.*)$/)
        if (kv) {
          const last = currentArray[currentArray.length - 1]
          if (last && typeof last === 'object') {
            last[kv[1]] = kv[2].trim()
          } else {
            currentArray.push({ [kv[1]]: kv[2].trim() })
          }
        }
      } else {
        currentArray.push(val)
      }
      continue
    }
    const nestedKv = line.match(/^\s+(\w+):\s*(.*)$/)
    if (nestedKv && currentArray !== null) {
      const last = currentArray[currentArray.length - 1]
      if (last && typeof last === 'object') {
        last[nestedKv[1]] = nestedKv[2].trim()
      }
    }
  }
  if (currentKey && currentArray) {
    result[currentKey] = currentArray
  }
  return result
}

const cards = ref<Card[]>([])

for (const path in markdownFiles) {
  const raw = markdownFiles[path] as string
  const lines = raw.split('\n')

  const titleLine = lines.find(line => line.startsWith('# '))
  const nameLine = lines.find(line => line.startsWith('## '))
  const excerptLine = lines.find(line => line.trim() && !line.startsWith('#'))

  const match = path.match(/works\/([^/]+)\/index\.md$/)
  const slug = match?.[1] ?? ''

  // ✅ intern echte VitePress-Seite (existiert wirklich)
  const route = `/works/?id=${slug}`

  const folder = path.replace(/\/index\.md$/, '/')
  const imageKey = Object.keys(imageFiles).find(k => k.startsWith(folder))
  const videoKey = Object.keys(videoFiles).find(k => k.startsWith(folder))

  const coverImage = imageKey ? (imageFiles[imageKey] as string) : null

  const projectImages: string[] = Object.keys(projectImageFiles)
    .filter(k => k.startsWith(folder))
    .filter(k => !/\/cover\.(jpg|jpeg|png|webp|gif)$/i.test(k))
    .map(k => projectImageFiles[k] as string)
    .sort()

  const images = projectImages.length ? projectImages : coverImage ? [coverImage] : []

  const mod = markdownModules[path] as any

  // Frontmatter: zuerst aus dem kompilierten Modul, dann Fallback aus Raw-Text
  let fm = mod?.frontmatter
  if (!fm || (typeof fm === 'object' && Object.keys(fm).length === 0)) {
    fm = parseRawFrontmatter(raw)
  }

  const fmVideos = Array.isArray(fm.videos) ? fm.videos : []
  const youtubeVideos: CardVideo[] = fmVideos
    .map((v: any) => {
      if (typeof v === 'string') return { url: v }
      if (v && typeof v.url === 'string') return { url: v.url, title: v.title }
      return null
    })
    .filter(Boolean) as CardVideo[]

  cards.value.push({
    slug,
    title: titleLine?.replace(/^# /, '') || 'Untitled',
    name: nameLine?.replace(/^## /, '') || 'Anonymous',
    excerpt: excerptLine || '',
    route,
    image: coverImage,
    video: videoKey ? (videoFiles[videoKey] as string) : null,
    component: mod?.default || null,
    images,
    videos: youtubeVideos
  })
}

const router = useRouter()
const currentSlug = ref<string | undefined>(cards.value[0]?.slug)

// === Fullscreen-Overlay-Video State ===
const overlayVisible = ref(false)
const overlayVideoSrc = ref<string | null>(null)
const overlayTargetSlug = ref<string | null>(null)
const overlayTargetRoute = ref<string | null>(null)
const overlayFadingOut = ref(false)
const overlayVideoReady = ref(false)

// Timing
const overlayFadeStartMs = 2000
const overlayFadeMs = 2000
const overlayCutToPageMs = 4000

let overlayFadeTimer: number | null = null
let overlayAfterFadeTimer: number | null = null

// Content ist initial unsichtbar – wird erst nach Video eingeblendet
const contentVisible = ref(false)

// Safety-Fallback nur falls @ended nie kommt (z.B. Video startet nicht)
const overlaySafetyFallbackMs = 30000

// verhindert mehrfaches Starten der Timer und startet sie erst, wenn Video wirklich spielt
const overlayTimersStarted = ref(false)

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

// Nachtmodus: zwischen 20:00 und 06:00 keine Transition-Videos
function isNightTime(): boolean {
  const hour = new Date().getHours()
  return hour >= 20 || hour < 6
}

// ✅ Clean URL nur anzeigen (ohne VitePress Navigation)
// - entfernt id/redirect aus der sichtbaren URL
// - behält optional play=1
function setCleanSlugUrl(slug: string) {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const play = params.get('play') === '1' ? '1' : null
  const cleanPath = withBase(`/${encodeURIComponent(slug)}`)
  const cleanQuery = play ? `?play=1` : ''

  window.history.replaceState({}, '', cleanPath + cleanQuery)
}

// ✅ Timer erst nach echtem Playback-Start starten
function startOverlayTimersAfterPlaybackStarts() {
  if (!overlayVisible.value) return
  if (overlayFadeDisabled.value) return
  if (overlayTimersStarted.value) return

  overlayTimersStarted.value = true
  clearOverlayFadeTimer()

  overlayFadeTimer = window.setTimeout(() => {
    overlayFadingOut.value = true
  }, overlayFadeStartMs)

  overlayAfterFadeTimer = window.setTimeout(() => {
    clearOverlayFadeTimer()
    showWorkPageFromOverlay()
    // Fallback: falls @ended nicht kam, Content trotzdem anzeigen
    contentVisible.value = true
  }, overlayCutToPageMs)
}

function showWorkPageFromOverlay() {
  // Route-Ziel hat Priorität (z.B. zurück ins Carousel)
  const targetRoute = overlayTargetRoute.value
  if (targetRoute) {
    overlayVisible.value = false
    overlayFadingOut.value = false
    overlayVideoSrc.value = null
    overlayVideoReady.value = false

    const hardReload = overlayUseHardReload.value

    overlayTargetRoute.value = null
    overlayTargetSlug.value = null
    overlayUseHardReload.value = false

    if (hardReload) {
      if (typeof window !== 'undefined') window.location.href = withBase(targetRoute)
    } else {
      router.go(withBase(targetRoute))
    }
    return
  }

  const target = overlayTargetSlug.value
  if (!target) return

  overlayVisible.value = false
  overlayFadingOut.value = false
  overlayVideoSrc.value = null
  overlayVideoReady.value = false

  overlayTargetSlug.value = null
  currentSlug.value = target

  router.go(withBase(`/works/?id=${encodeURIComponent(target)}`))
  setTimeout(() => setCleanSlugUrl(target), 50)
}

function getParamsFromLocation() {
  if (typeof window === 'undefined') {
    return { id: undefined as string | undefined, play: false, redirect: undefined as string | undefined }
  }
  const params = new URLSearchParams(window.location.search)
  let id = params.get('id') || undefined

  // ✅ Slug aus Pfad lesen wenn kein ?id= vorhanden (z.B. /Moi direkt aufgerufen)
  if (!id) {
    const pathMatch = window.location.pathname.match(/^\/([^/]+)\/?$/)
    if (pathMatch) {
      const slug = pathMatch[1]
      const knownPaths = ['works', 'about', 'uebermich', 'cv', '']
      if (!knownPaths.includes(slug)) {
        id = slug
      }
    }
  }

  return {
    id,
    play: params.get('play') === '1',
    redirect: params.get('redirect') || undefined
  }
}

// internen URL-Query aufräumen (id bleibt intern, aber play/redirect weg)
function updateInternalUrlWithoutPlayOrRedirect(id?: string) {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const params = url.searchParams

  if (id) params.set('id', id)
  else if (!params.get('id') && cards.value[0]?.slug) params.set('id', cards.value[0].slug)

  params.delete('play')
  params.delete('redirect')

  url.search = params.toString()
  window.history.replaceState({}, '', url.toString())
}

function selectCard(slug: string, routePath: string) {
  currentSlug.value = slug
  // intern navigieren, danach sofort clean URL setzen
  router.go(withBase(`/works/?id=${encodeURIComponent(slug)}`))
  // Timeout: nach router.go kommt ggf. ein URL-Update, den wir überschreiben
  setTimeout(() => setCleanSlugUrl(slug), 50)
}

function playProjectIntro(slug: string, videoSrc?: string | null) {
  const card = cards.value.find(c => c.slug === slug)
  if (!card) return

  const src = videoSrc ?? card.video
  if (!src || isNightTime()) {
    selectCard(slug, `/works/?id=${encodeURIComponent(slug)}`)
    contentVisible.value = true
    return
  }

  clearOverlayFadeTimer()
  overlayTimersStarted.value = false
  overlayFadeMode.value = 'fade-out'
  overlayFadeDisabled.value = false
  overlayFadingOut.value = false
  overlayVideoReady.value = false
  overlayVideoSrc.value = src
  overlayTargetRoute.value = null
  overlayTargetSlug.value = slug
  overlayVisible.value = true

  // Content verstecken bevor Overlay startet
  contentVisible.value = false
}

function playTransitionToRoute(routePath: string, videoSrc: string, fadeMode: OverlayFadeMode = 'fade-out') {
  if (isNightTime()) {
    // Direkt navigieren ohne Video
    if (overlayHomeToRoot.value) {
      overlayHomeToRoot.value = false
      if (typeof window !== 'undefined') {
        window.location.href = withBase(routePath || '/')
      }
      return
    }
    if (typeof window !== 'undefined') {
      window.location.href = withBase(routePath || '/')
    }
    return
  }

  clearOverlayFadeTimer()
  overlayTimersStarted.value = false

  overlayFadeMode.value = fadeMode
  overlayFadeDisabled.value = fadeMode === 'none'
  overlayUseHardReload.value = false
  overlayFadingOut.value = false

  overlayVideoReady.value = false
  overlayVideoSrc.value = videoSrc
  overlayTargetSlug.value = null

  overlayTargetRoute.value = overlayHomeToRoot.value ? null : routePath

  overlayVisible.value = true
  contentVisible.value = false

  if (fadeMode === 'none') {
    overlayAfterFadeTimer = window.setTimeout(() => {
      clearOverlayFadeTimer()

      if (overlayHomeToRoot.value && typeof window !== 'undefined') {
        const target = routePath || '/'
        overlayHomeToRoot.value = false
        window.location.href = withBase(target)
        return
      }

      overlayUseHardReload.value = true
      showWorkPageFromOverlay()
      contentVisible.value = true
      overlayFadeDisabled.value = false
    }, overlaySafetyFallbackMs)
    return
  }
}

async function handleOverlayEnded() {
  if (!overlayVisible.value) return
  clearOverlayFadeTimer()

  if (overlayHomeToRoot.value && typeof window !== 'undefined') {
    overlayHomeToRoot.value = false
    window.location.href = withBase('/')
    return
  }

  if (overlayTargetRoute.value) {
    if (overlayFadeDisabled.value) {
      if (overlayUseHardReload.value && typeof window !== 'undefined') {
        const targetRoute = overlayTargetRoute.value
        overlayVisible.value = false
        overlayFadingOut.value = false
        overlayVideoSrc.value = null
        overlayVideoReady.value = false
        overlayTargetRoute.value = null
        overlayTargetSlug.value = null
        overlayUseHardReload.value = false
        window.location.href = withBase(targetRoute || '/')
        return
      }

      showWorkPageFromOverlay()
      contentVisible.value = true
      overlayFadeDisabled.value = false
      return
    }

    overlayFadingOut.value = true
    await new Promise(resolve => setTimeout(resolve, overlayFadeMs + 100))
    showWorkPageFromOverlay()
    contentVisible.value = true
    overlayFadeDisabled.value = false
    return
  }

  if (!overlayTargetSlug.value) {
    overlayVisible.value = false
    overlayFadingOut.value = false
    contentVisible.value = true
    return
  }

  overlayFadingOut.value = true
  await new Promise(resolve => setTimeout(resolve, overlayFadeMs + 100))
  showWorkPageFromOverlay()
  contentVisible.value = true
}

function handleOverlayError() {
  if (overlayFadeDisabled.value) {
    console.warn('[WorkPage] overlay video error (no-fade). keeping overlay; will use safety fallback timer.')
    return
  }
  showWorkPageFromOverlay()
  contentVisible.value = true
}

const currentCard = computed(() => cards.value.find(card => card.slug === currentSlug.value))

const hasMedia = computed(() => {
  if (!currentCard.value) return false
  const hasImages = currentCard.value.images && currentCard.value.images.length > 0
  const hasVideos = currentCard.value.videos && currentCard.value.videos.length > 0
  return hasImages || hasVideos
})

const contentKey = ref(0)
watch(currentSlug, () => {
  contentKey.value += 1
  if (typeof document !== 'undefined') document.title = 'Projects | Leon Albers'
})

// Navbar Click-Interceptor
function interceptHomeNav(e: Event) {
  const target = e.target as HTMLElement | null
  if (!target) return

  const anchor = target.closest('a') as HTMLAnchorElement | null
  if (!anchor) return

  const rawHref = anchor.getAttribute('href') || ''

  const isHomeMarked = anchor.getAttribute('data-nav-home') === '1'
  const isAboutMarked = anchor.getAttribute('data-nav-about') === '1'

  let isHome = isHomeMarked
  let isAbout = isAboutMarked

  if (!isHome && !isAbout && typeof window !== 'undefined') {
    const hrefUrl = rawHref.startsWith('http')
      ? new URL(rawHref)
      : new URL(withBase(rawHref), window.location.origin)

    const pathname = hrefUrl.pathname.replace(withBase('/'), '/')

    isHome = pathname === '/'
    isAbout = pathname === '/cv' || pathname === '/about' || rawHref === '#cv'
  }

  if (!isHome && !isAbout) return

  if (e instanceof MouseEvent) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  }

  e.preventDefault()
  ;(e as any).stopImmediatePropagation?.()
  e.stopPropagation()

  if (overlayVisible.value) return

  const targetRoute = '/'
  overlayUseHardReload.value = true
  overlayHomeToRoot.value = true
  playTransitionToRoute(targetRoute, withBase('/videos/Transition_up.mp4'), 'none')
}

// Prev/Next
const currentIndex = computed(() => cards.value.findIndex(card => card.slug === currentSlug.value))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < cards.value.length - 1)
const prevSlug = computed(() => (hasPrev.value ? cards.value[currentIndex.value - 1].slug : undefined))
const nextSlug = computed(() => (hasNext.value ? cards.value[currentIndex.value + 1].slug : undefined))

function goToPrev() {
  if (!hasPrev.value || !prevSlug.value) return
  selectCard(prevSlug.value, `/works/?id=${encodeURIComponent(prevSlug.value)}`)
}
function goToNext() {
  if (!hasNext.value || !nextSlug.value) return
  selectCard(nextSlug.value, `/works/?id=${encodeURIComponent(nextSlug.value)}`)
}

// Swipe
const swipeStartX = ref<number | null>(null)
const swipeStartY = ref<number | null>(null)

function onImagesTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  swipeStartX.value = t.clientX
  swipeStartY.value = t.clientY
}
function onImagesTouchEnd(e: TouchEvent) {
  if (swipeStartX.value == null || swipeStartY.value == null) return
  const t = e.changedTouches[0]
  const dx = t.clientX - swipeStartX.value
  const dy = t.clientY - swipeStartY.value

  swipeStartX.value = null
  swipeStartY.value = null

  if (Math.abs(dy) > Math.abs(dx)) return

  const threshold = 50
  if (dx < -threshold && hasNext.value) goToNext()
  else if (dx > threshold && hasPrev.value) goToPrev()
}

const backgroundImage = withBase('/erde.jpg')

/** EINZIGE klasse für workpage-styles */
const WORKPAGE_CLASS = 'is-workpage'

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add(WORKPAGE_CLASS)
    document.title = 'Projects | Leon Albers'
  }

  // 1) redirect (kommt von 404.html oder lokalem middleware fallback)
  const { id, play, redirect } = getParamsFromLocation()

  if (redirect && typeof window !== 'undefined') {
    // redirect enthält z.B. "/Klanggestalten?play=1"
    const decoded = decodeURIComponent(redirect)
    const slug = decoded.replace(/^\/+|\/+$/g, '').split('?')[0].split('#')[0]
    if (slug) {
      currentSlug.value = slug

      // intern echte Seite + id setzen
      router.go(withBase(`/works/?id=${encodeURIComponent(slug)}`))

      // play ggf. wieder aktivieren (aus redirect)
      const hasPlay = decoded.includes('play=1')

      // intern query aufräumen (redirect raus)
      updateInternalUrlWithoutPlayOrRedirect(slug)

      // außen clean anzeigen (mit play, wenn nötig)
      if (hasPlay) {
        window.history.replaceState({}, '', withBase(`/${encodeURIComponent(slug)}?play=1`))
      } else {
        setCleanSlugUrl(slug)
      }
    }
  } else if (id) {
    currentSlug.value = id
    if (play) updateInternalUrlWithoutPlayOrRedirect(id)
    // clean URL erst nach kurzem Delay setzen (nach VitePress-Initialisierung)
    setTimeout(() => setCleanSlugUrl(id), 50)
  } else if (cards.value[0]?.slug) {
    currentSlug.value = cards.value[0].slug
    setTimeout(() => setCleanSlugUrl(cards.value[0].slug), 50)
  }

  // Intro Video
  if (currentSlug.value && play) {
    // interne URL bereinigen (play weg)
    updateInternalUrlWithoutPlayOrRedirect(currentSlug.value)
    playProjectIntro(currentSlug.value, withBase('/videos/Transition.mp4'))
  } else {
    contentVisible.value = true
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', interceptHomeNav, true)
    document.addEventListener('click', interceptHomeNav, true)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove(WORKPAGE_CLASS)
    document.removeEventListener('pointerdown', interceptHomeNav, true)
    document.removeEventListener('click', interceptHomeNav, true)
    document.title = defaultDocumentTitle
  }
  clearOverlayFadeTimer()
})

// watcher: wenn intern /works/?id=... geändert wird, URL außen clean halten
// watch auf location.search deaktivieren – er kämpft gegen setCleanSlugUrl
// watch(
//   () => (typeof window !== 'undefined' ? window.location.search : ''),
//   ...
// )
</script>

<template>
  <div
    class="h-screen w-full bg-black/80 workpage-root overflow-y-auto lg:overflow-hidden"
    :style="{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }"
  >
    <div class="flex flex-col h-full min-h-0">
      <!-- Overlay mit Transition-Video -->
      <div
        v-if="overlayVisible && overlayVideoSrc"
        class="workpage-overlay fixed inset-0 bg-black flex items-center justify-center z-[9999]"
      >
        <video
          :src="overlayVideoSrc"
          class="w-full h-full object-cover"
          :class="overlayVideoReady ? 'opacity-100' : 'opacity-0'"
          autoplay
          muted
          playsinline
          preload="metadata"
          @loadeddata="overlayVideoReady = true"
          @canplay="overlayVideoReady = true"
          @playing="startOverlayTimersAfterPlaybackStarts()"
          @error="handleOverlayError"
          @ended="handleOverlayEnded"
        />

        <div
          v-if="!overlayFadeDisabled"
          class="absolute inset-0 bg-black pointer-events-none transition-opacity ease-in-out"
          style="transition-duration: 2000ms;"
          :class="[
            overlayFadeMode === 'fade-out'
              ? (overlayFadingOut ? 'opacity-100' : 'opacity-0')
              : (overlayFadingOut ? 'opacity-0' : 'opacity-100')
          ]"
        />
      </div>

      <!-- Hauptinhalt -->
      <section v-if="contentVisible" class="flex-1 min-h-0 w-full text-gray-100 workpage-content">
        <div class="pt-20 lg:pt-24 px-8 lg:px-12 pb-2 h-full flex flex-col lg:min-h-0">
          <Transition name="content-fade" mode="out-in" appear>
            <div v-if="currentCard" :key="contentKey" class="flex flex-col lg:flex-1 lg:min-h-0">
              <div class="flex items-center justify-between gap-4 mb-4 text-xs md:text-sm text-gray-400 shrink-0">
                <button
                  v-if="hasPrev"
                  type="button"
                  class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10"
                  @click="goToPrev"
                >
                  <span>‹</span>
                  <span>Vorheriges Projekt</span>
                </button>

                <button
                  v-if="hasNext"
                  type="button"
                  class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 ml-auto"
                  @click="goToNext"
                >
                  <span>Nächstes Projekt</span>
                  <span>›</span>
                </button>
              </div>

              <div class="lg:flex-1 lg:min-h-0">
                <div
                  class="grid grid-cols-1 gap-8 items-start lg:h-full lg:min-h-0"
                  :class="hasMedia ? 'lg:grid-cols-2' : 'lg:grid-cols-1 lg:max-w-3xl lg:mx-auto'"
                >
                  <!-- Text -->
                  <div class="text-left lg:min-h-0 lg:h-full lg:overflow-y-auto lg:pr-6">
                    <component
                      v-if="currentCard.component"
                      :is="currentCard.component"
                      class="prose prose-invert prose-base md:prose-lg max-w-none text-left"
                    />
                  </div>

                  <!-- Medien -->
                  <div
                    v-if="hasMedia"
                    class="mt-8 lg:mt-0 lg:min-h-0 lg:h-full lg:overflow-y-auto lg:pl-6 relative"
                    @touchstart.passive="onImagesTouchStart"
                    @touchend.passive="onImagesTouchEnd"
                  >
                    <div class="space-y-6">
                      <div v-if="currentCard.images && currentCard.images.length" class="grid grid-cols-1 gap-4">
                        <figure
                          v-for="(img, idx) in currentCard.images"
                          :key="img + '-' + idx"
                          class="w-full overflow-hidden rounded-lg bg-neutral-900"
                        >
                          <img
                            :src="img"
                            :alt="currentCard.title + ' – Bild ' + (idx + 1)"
                            class="w-full h-auto object-contain"
                            loading="lazy"
                          />
                        </figure>
                      </div>

                      <div v-if="currentCard.videos && currentCard.videos.length" class="grid grid-cols-1 gap-4">
                        <figure
                          v-for="(vid, vIdx) in currentCard.videos"
                          :key="vid.url + '-' + vIdx"
                          class="w-full overflow-hidden rounded-lg bg-neutral-900 aspect-video"
                        >
                          <iframe
                            class="w-full h-full"
                            :src="vid.url"
                            title="YouTube video player"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen
                          ></iframe>
                        </figure>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else :key="'not-found'" class="text-gray-300">
              Projekt nicht gefunden.
            </div>
          </Transition>

          <footer class="mt-2 pt-2 border-t border-white/10 text-xs text-gray-500 shrink-0">
            © {{ new Date().getFullYear() }} Leon Albers
          </footer>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.workpage-root {
  -webkit-overflow-scrolling: touch;
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
</style>
