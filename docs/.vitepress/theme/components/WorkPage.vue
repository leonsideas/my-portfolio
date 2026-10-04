<script setup lang="ts">
import { withBase, useRouter } from 'vitepress'
import { ref, computed, markRaw, onMounted, watch, onBeforeUnmount } from 'vue'

type CardVideo = {
  url: string
  title?: string
}

type Card = {
  slug: string
  title: string
  name: string
  year: string
  keywords: string[]
  excerpt: string
  summary: string
  role: string
  format: string
  tools: string[]
  route: string
  image: string | null
  video: string | null
  component: any
  images: string[]
  btsImages: string[]
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
const markdownFiles = import.meta.glob('../../../works/**/index.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Images
const imageFiles = import.meta.glob('../../../works/**/cover.{webp,gif}', {
  eager: true,
  import: 'default'
})

// Videos (Cover)
const videoFiles = import.meta.glob('../../../works/**/cover.{mp4,webm,ogg}', {
  eager: true,
  import: 'default'
})

// beliebige Projektbilder
const projectImageFiles = import.meta.glob('../../../works/**/*.{webp,gif}', {
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

  const cleanScalar = (value: string) => {
    const trimmed = value.trim()
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1)
    }
    return trimmed
  }

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
        result[key] = cleanScalar(val)
        currentKey = null
        currentArray = null
      }
      continue
    }
    const arrayItem = line.match(/^\s+-\s+(.*)$/)
    if (arrayItem && currentArray !== null) {
      const val = cleanScalar(arrayItem[1])
      if (val.startsWith('url:') || val.startsWith('title:')) {
        // key-value in object
        const kv = val.match(/^(\w+):\s*(.*)$/)
        if (kv) {
          const last = currentArray[currentArray.length - 1]
          if (last && typeof last === 'object') {
            last[kv[1]] = cleanScalar(kv[2])
          } else {
            currentArray.push({ [kv[1]]: cleanScalar(kv[2]) })
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
        last[nestedKv[1]] = cleanScalar(nestedKv[2])
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
  if (!slug) continue

  const route = `/works/${slug}/`

  const folder = path.replace(/\/index\.md$/, '/')
  const imageKey = Object.keys(imageFiles).find(k => k.startsWith(folder))
  const videoKey = Object.keys(videoFiles).find(k => k.startsWith(folder))

  const coverImage = imageKey ? (imageFiles[imageKey] as string) : null

  const allProjectImageKeys = Object.keys(projectImageFiles)
    .filter(k => k.startsWith(folder))
    .filter(k => !/\/cover\.(webp|gif)$/i.test(k))

  const projectImages: string[] = allProjectImageKeys
    .filter(k => !/(?:^|[-_/])bts(?:[-_.])/i.test(k))
    .map(k => projectImageFiles[k] as string)
    .sort()

  const btsImages: string[] = allProjectImageKeys
    .filter(k => /(?:^|[-_/])bts(?:[-_.])/i.test(k))
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

  // Jahr: erstes ##### mit 4 Ziffern
  let year = ''
  for (const line of lines) {
    const m = line.match(/^#####\s+(\d{4})\s*$/)
    if (m) { year = m[1]; break }
  }

  // Keywords: bevorzugt letztes ##### mit Komma-Liste, sonst Absatz nach "## Keywords"
  let keywords: string[] = []
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(/^#####\s+(.+)$/)
    if (m) {
      const content = m[1].trim()
      if (!/^\d{4}$/.test(content) && content.includes(',')) {
        keywords = content.split(',')
          .map(s => s.trim().replace(/\.$/, ''))
          .filter(Boolean)
        break
      }
    }
  }
  if (!keywords.length) {
    const kwIdx = lines.findIndex(l => /^##\s+Keywords\s*$/i.test(l.trim()))
    if (kwIdx >= 0) {
      const next = lines.slice(kwIdx + 1).find(l => l.trim())
      if (next) {
        keywords = next.split(',')
          .map(s => s.trim().replace(/\.$/, ''))
          .filter(Boolean)
      }
    }
  }

  cards.value.push({
    slug,
    title: titleLine?.replace(/^# /, '') || 'Untitled',
    name: nameLine?.replace(/^## /, '') || 'Anonymous',
    year,
    keywords,
    excerpt: excerptLine || '',
    summary: typeof fm.summary === 'string' ? fm.summary : '',
    role: typeof fm.role === 'string' ? fm.role : '',
    format: typeof fm.format === 'string' ? fm.format : '',
    tools: Array.isArray(fm.tools) ? fm.tools.map(String) : [],
    route,
    image: coverImage,
    video: videoKey ? (videoFiles[videoKey] as string) : null,
    component: mod?.default ? markRaw(mod.default) : null,
    images,
    btsImages,
    videos: youtubeVideos
  })
}

const preferredProjectOrder = [
  'Klanggestalten',
  'Migration',
  'Uebergangsobjekte',
  'Stottern',
  'Portfolio',
  'Uebersee',
  'Moi',
  'Kilma',
  'LightbyNight',
  'Reefresh',
]

cards.value.sort((a, b) => {
  const indexA = preferredProjectOrder.indexOf(a.slug)
  const indexB = preferredProjectOrder.indexOf(b.slug)
  if (indexA < 0) return 1
  if (indexB < 0) return -1
  return indexA - indexB
})

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

// Mobile erkennen, damit mobile Transition-Videos benutzt werden
function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 767px)').matches
}

// Richtige Transition-Video-Quelle auswählen
function transitionDownSrc(): string {
  return withBase(
    isMobileViewport()
      ? '/videos/Transition_down-mobil.mp4'
      : '/videos/Transition.mp4'
  )
}

function transitionUpSrc(): string {
  // Achtung: Dateiname enthält Typo ("Transiton_up-mobil.mp4")
  return withBase(
    isMobileViewport()
      ? '/videos/Transiton_up-mobil.mp4'
      : '/videos/Transition_up.mp4'
  )
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

  router.go(withBase(`/works/${encodeURIComponent(target)}/`))
}

function getParamsFromLocation() {
  if (typeof window === 'undefined') {
    return { id: undefined as string | undefined, play: false, redirect: undefined as string | undefined }
  }
  const params = new URLSearchParams(window.location.search)
  let id = params.get('id') || undefined

  // Reguläre Projektadresse: /works/Projektname/
  if (!id) {
    const basePath = withBase('/')
    const pathname = window.location.pathname.startsWith(basePath)
      ? `/${window.location.pathname.slice(basePath.length)}`
      : window.location.pathname
    const workPathMatch = pathname.match(/^\/works\/([^/]+)\/?$/)
    const legacyPathMatch = pathname.match(/^\/([^/]+)\/?$/)
    const pathMatch = workPathMatch || legacyPathMatch
    if (pathMatch) {
      const slug = pathMatch[1]
      const knownPaths = ['works', 'about', 'uebermich', 'cv', 'kontakt', 'rechtliches', '']
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

function selectCard(slug: string) {
  currentSlug.value = slug
  router.go(withBase(`/works/${encodeURIComponent(slug)}/`))
}

function playProjectIntro(slug: string, videoSrc?: string | null) {
  const card = cards.value.find(c => c.slug === slug)
  if (!card) return

  const src = videoSrc ?? card.video
  if (!src || isNightTime()) {
    selectCard(slug)
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

  overlayTargetRoute.value = routePath

  overlayVisible.value = true
  contentVisible.value = false

  if (fadeMode === 'none') {
    overlayAfterFadeTimer = window.setTimeout(() => {
      clearOverlayFadeTimer()

      if (overlayHomeToRoot.value && typeof window !== 'undefined') {
        const target = overlayTargetRoute.value || routePath || '/'
        overlayHomeToRoot.value = false
        overlayTargetRoute.value = null
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
    const target = overlayTargetRoute.value || '/'
    overlayHomeToRoot.value = false
    overlayTargetRoute.value = null
    window.location.href = withBase(target)
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

// Die Projektbilder sind vorübergehend ausgeblendet. Die Bildlisten bleiben
// vollständig erhalten und können über diesen Schalter wieder aktiviert werden.
const showProjectImages = false

// Hauptbilder und Making-of-Aufnahmen bilden gemeinsam die rechte Bildfolge.
// Die Dateinamen halten die BTS-Bilder innerhalb ihrer Gruppe in Reihenfolge.
const displayImages = computed(() => {
  if (!showProjectImages || !currentCard.value) return []
  return [...currentCard.value.images, ...currentCard.value.btsImages]
})

const hasMedia = computed(() => {
  if (!currentCard.value) return false
  const hasImages = displayImages.value.length > 0
  const hasVideos = currentCard.value.videos && currentCard.value.videos.length > 0
  return hasImages || hasVideos
})

const mobileLeadImage = computed(() => displayImages.value[0] || null)
const mobileLeadVideo = computed(() =>
  mobileLeadImage.value ? null : currentCard.value?.videos[0] || null
)
const mobileRemainingImages = computed(() => displayImages.value.slice(1))
const mobileRemainingVideos = computed(() =>
  mobileLeadVideo.value
    ? currentCard.value?.videos.slice(1) || []
    : currentCard.value?.videos || []
)

function updateDocumentTitle() {
  if (typeof document === 'undefined') return
  document.title = currentCard.value
    ? `${currentCard.value.title} | Leon Albers`
    : 'Projekte | Leon Albers'
}

const contentKey = ref(0)
watch(currentSlug, () => {
  contentKey.value += 1
  updateDocumentTitle()
})

// NEU: VitePress überschreibt den Titel nach Route-Updates manchmal (z.B. 404 handling).
// Daher nach jeder Route-Änderung den gewünschten Titel erneut setzen.
watch(
  () => (router as any)?.route?.path,
  () => {
    if (typeof window !== 'undefined') window.setTimeout(updateDocumentTitle, 0)
  },
  { immediate: true }
)

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
  let isKontakt = false

  if (!isHome && !isAbout && typeof window !== 'undefined') {
    const hrefUrl = rawHref.startsWith('http')
      ? new URL(rawHref)
      : new URL(withBase(rawHref), window.location.origin)

    const pathname = hrefUrl.pathname.replace(withBase('/'), '/')

    isHome = pathname === '/'
    isAbout = pathname === '/cv' || pathname === '/about' || pathname === '/uebermich' || rawHref === '#cv'
    isKontakt = pathname === '/kontakt'
  }

  if (!isHome && !isAbout && !isKontakt) return

  if (e instanceof MouseEvent) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  }

  e.preventDefault()
  ;(e as any).stopImmediatePropagation?.()
  e.stopPropagation()

  if (overlayVisible.value) return

  const targetRoute = isAbout ? '/uebermich' : isKontakt ? '/kontakt' : '/'
  overlayUseHardReload.value = true
  overlayHomeToRoot.value = true
  playTransitionToRoute(targetRoute, transitionUpSrc(), 'none')
}

// Prev/Next
const currentIndex = computed(() => cards.value.findIndex(card => card.slug === currentSlug.value))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < cards.value.length - 1)
const prevSlug = computed(() => (hasPrev.value ? cards.value[currentIndex.value - 1].slug : undefined))
const nextSlug = computed(() => (hasNext.value ? cards.value[currentIndex.value + 1].slug : undefined))

function goToPrev() {
  if (!hasPrev.value || !prevSlug.value) return
  selectCard(prevSlug.value)
}
function goToNext() {
  if (!hasNext.value || !nextSlug.value) return
  selectCard(nextSlug.value)
}
function goToIndex(idx: number) {
  const card = cards.value[idx]
  if (!card || card.slug === currentSlug.value) return
  selectCard(card.slug)
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

// Swipe auf der gesamten Projektseite (nicht nur über den Bildern).
// Ignoriert Swipes, die aus interaktiven Elementen (Links, Buttons, Iframes)
// stammen, damit Klicks/Videos weiterhin funktionieren.
const contentSwipeStartX = ref<number | null>(null)
const contentSwipeStartY = ref<number | null>(null)

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return !!target.closest('a, button, input, textarea, select, iframe, video, [role="button"]')
}

function onContentTouchStart(e: TouchEvent) {
  if (isInteractiveTarget(e.target)) {
    contentSwipeStartX.value = null
    contentSwipeStartY.value = null
    return
  }
  const t = e.touches[0]
  if (!t) return
  contentSwipeStartX.value = t.clientX
  contentSwipeStartY.value = t.clientY
}

function onContentTouchEnd(e: TouchEvent) {
  if (contentSwipeStartX.value == null || contentSwipeStartY.value == null) return
  const t = e.changedTouches[0]
  if (!t) {
    contentSwipeStartX.value = null
    contentSwipeStartY.value = null
    return
  }
  const dx = t.clientX - contentSwipeStartX.value
  const dy = t.clientY - contentSwipeStartY.value

  contentSwipeStartX.value = null
  contentSwipeStartY.value = null

  // nur horizontale, deutliche Bewegungen zählen – sonst bleibt vertikaler Scroll normal
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.2) return

  if (dx < 0 && hasNext.value) goToNext()
  else if (dx > 0 && hasPrev.value) goToPrev()
}

/* Projektseiten liegen auf demselben hellen Grund wie die Startseite.
   Die Navigation blendet sich ueber --workpage-bg-image ein und braucht dort
   einen background-image-Wert, daher der Verlauf aus einer einzigen Farbe. */
const WORKPAGE_BG = 'linear-gradient(var(--page-bg), var(--page-bg))'

/** EINZIGE klasse für workpage-styles */
const WORKPAGE_CLASS = 'is-workpage'

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add(WORKPAGE_CLASS)
    document.documentElement.style.setProperty(
      '--workpage-bg-image',
      WORKPAGE_BG
    )
  }

  // Alte Query- und 404-Adressen werden auf die echte statische Projektseite geführt.
  const { id, play, redirect } = getParamsFromLocation()

  if (redirect && typeof window !== 'undefined') {
    const decoded = decodeURIComponent(redirect)
    const slug = decoded
      .replace(/^\/+|\/+$/g, '')
      .replace(/^works\//, '')
      .split('?')[0]
      .split('#')[0]
    if (slug) {
      router.go(withBase(`/works/${encodeURIComponent(slug)}/`))
      return
    }
  } else if (id) {
    currentSlug.value = id

    const normalizedPath = window.location.pathname.replace(/\/$/, '')
    const queryRoute = normalizedPath.endsWith('/works')
    const legacyRootRoute = !normalizedPath.includes('/works/')
    if (queryRoute || legacyRootRoute) {
      router.go(withBase(`/works/${encodeURIComponent(id)}/`))
      return
    }
  } else if (cards.value[0]?.slug) {
    currentSlug.value = cards.value[0].slug
  }

  // Übergangsvideos sind derzeit abgeschaltet – der Inhalt steht sofort da.
  void play
  contentVisible.value = true
  updateDocumentTitle()
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove(WORKPAGE_CLASS)
    document.documentElement.style.removeProperty('--workpage-bg-image')

    document.title = defaultDocumentTitle
  }
  clearOverlayFadeTimer()
})
</script>

<template>
  <div
    class="h-screen w-full max-w-full workpage-root overflow-x-hidden overflow-y-auto lg:overflow-hidden"
  >
    <div class="flex flex-col h-full min-h-0">
      <!-- Hauptinhalt -->
      <section v-if="contentVisible" class="flex-1 min-h-0 w-full workpage-content">
        <div class="pt-28 lg:pt-32 px-6 sm:px-8 lg:px-12 pb-8 h-full flex flex-col lg:min-h-0">
          <Transition name="content-fade" mode="out-in" appear>
            <div
              v-if="currentCard"
              :key="contentKey"
              class="flex flex-col lg:flex-1 lg:min-h-0"
              @touchstart.passive="onContentTouchStart"
              @touchend.passive="onContentTouchEnd"
            >
              <div class="workpage-nav-row flex items-center justify-between gap-3 mb-8 text-xs md:text-sm shrink-0">
                <button
                  v-if="hasPrev"
                  type="button"
                  class="workpage-nav-pill"
                  @click="goToPrev"
                  aria-label="Vorheriges Projekt"
                >
                  <span aria-hidden="true">‹</span>
                  <span>Vorheriges Projekt</span>
                </button>
                <span
                  v-else
                  class="workpage-nav-pill workpage-nav-pill--placeholder"
                  aria-hidden="true"
                />

                <div
                  class="workpage-dots"
                  role="tablist"
                  aria-label="Projekt-Navigation"
                >
                  <button
                    v-for="(card, idx) in cards"
                    :key="card.slug"
                    type="button"
                    class="workpage-dot"
                    :class="{ 'is-active': idx === currentIndex }"
                    :aria-label="`Zu Projekt: ${card.title}`"
                    :aria-selected="idx === currentIndex"
                    role="tab"
                    @click="goToIndex(idx)"
                  />
                </div>

                <button
                  v-if="hasNext"
                  type="button"
                  class="workpage-nav-pill"
                  @click="goToNext"
                  aria-label="Nächstes Projekt"
                >
                  <span>Nächstes Projekt</span>
                  <span aria-hidden="true">›</span>
                </button>
                <span
                  v-else
                  class="workpage-nav-pill workpage-nav-pill--placeholder"
                  aria-hidden="true"
                />
              </div>
              <div class="lg:flex-1 lg:min-h-0">
                <div
                  class="grid grid-cols-1 gap-10 items-start lg:h-full lg:min-h-0"
                  :class="hasMedia ? 'lg:grid-cols-2' : 'lg:grid-cols-1 lg:max-w-3xl lg:mx-auto'"
                >
                  <article class="text-left lg:min-h-0 lg:h-full lg:overflow-y-auto lg:pr-6">
                    <div class="max-w-[65ch] mx-auto lg:mx-0">
                      <div v-if="currentCard.year" class="workpage-year">
                        {{ currentCard.year }}
                      </div>

                      <h1 class="workpage-title">{{ currentCard.title }}</h1>

                      <p v-if="currentCard.summary" class="workpage-summary">
                        {{ currentCard.summary }}
                      </p>

                      <div
                        v-if="hasMedia"
                        class="workpage-mobile-lead lg:hidden"
                        @touchstart.passive="onImagesTouchStart"
                        @touchend.passive="onImagesTouchEnd"
                      >
                        <figure v-if="mobileLeadImage" class="workpage-media-frame">
                          <img
                            :src="mobileLeadImage"
                            :alt="currentCard.title + ' – Projektansicht'"
                            loading="eager"
                            fetchpriority="high"
                          />
                        </figure>
                        <figure v-else-if="mobileLeadVideo" class="workpage-media-frame aspect-video">
                          <iframe
                            class="w-full h-full"
                            :src="mobileLeadVideo.url"
                            :title="mobileLeadVideo.title || currentCard.title"
                            frameborder="0"
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen
                          />
                        </figure>
                      </div>

                      <component
                        v-if="currentCard.component"
                        :is="currentCard.component"
                        class="prose prose-base md:prose-lg max-w-none leading-relaxed text-left workpage-prose"
                      />

                      <div v-if="hasMedia" class="workpage-mobile-gallery lg:hidden">
                        <figure
                          v-for="(img, idx) in mobileRemainingImages"
                          :key="img + '-mobile-' + idx"
                          class="workpage-media-frame"
                        >
                          <img
                            :src="img"
                            :alt="currentCard.title + ' – Bild ' + (idx + 2)"
                            loading="lazy"
                          />
                        </figure>
                        <figure
                          v-for="(vid, vIdx) in mobileRemainingVideos"
                          :key="vid.url + '-mobile-' + vIdx"
                          class="workpage-media-frame aspect-video"
                        >
                          <iframe
                            class="w-full h-full"
                            :src="vid.url"
                            :title="vid.title || currentCard.title"
                            frameborder="0"
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen
                          />
                        </figure>

                      </div>

                      <div v-if="currentCard.keywords.length" class="workpage-keywords">
                        <span
                          v-for="kw in currentCard.keywords"
                          :key="kw"
                          class="workpage-keyword-pill"
                        >
                          {{ kw }}
                        </span>
                      </div>
                    </div>
                  </article>

                  <div
                    v-if="hasMedia"
                    class="hidden lg:block lg:min-h-0 lg:h-full lg:overflow-y-auto lg:pl-6 relative"
                  >
                    <div class="space-y-6">
                      <figure
                        v-for="(img, idx) in displayImages"
                        :key="img + '-desktop-' + idx"
                        class="workpage-media-frame"
                      >
                        <img
                          :src="img"
                          :alt="currentCard.title + ' – Bild ' + (idx + 1)"
                          :loading="idx === 0 ? 'eager' : 'lazy'"
                        />
                      </figure>

                      <figure
                        v-for="(vid, vIdx) in currentCard.videos"
                        :key="vid.url + '-desktop-' + vIdx"
                        class="workpage-media-frame aspect-video"
                      >
                        <iframe
                          class="w-full h-full"
                          :src="vid.url"
                          :title="vid.title || currentCard.title"
                          frameborder="0"
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowfullscreen
                        />
                      </figure>

                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else :key="'not-found'" class="workpage-notfound">
              Projekt nicht gefunden.
            </div>
          </Transition>

          <footer class="mt-8 pt-6 text-center text-[11px] tracking-widest uppercase text-[#ff2d16] shrink-0 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>© {{ new Date().getFullYear() }} Leon Albers</span>
            <a :href="withBase('/rechtliches')" class="workpage-footer-link">Impressum &amp; Datenschutz</a>
          </footer>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.workpage-root {
  -webkit-overflow-scrolling: touch;
  background: var(--page-bg);
}

.workpage-footer-link {
  color: var(--brand-red);
  text-decoration: none;
  transition: color 200ms ease;
}

.workpage-footer-link:hover,
.workpage-footer-link:focus-visible {
  color: var(--brand-red);
  outline: none;
}

.workpage-nav-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;

  padding: 0.4rem 0.75rem;

  color: var(--brand-red);

  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.65rem;
  line-height: 1;

  max-width: 48%;

  transition: color 200ms ease;
  cursor: pointer;
}

.workpage-nav-pill:hover {
  color: rgba(255, 45, 22, 1);
}

/* Platzhalter, damit die Dots beim ersten/letzten Projekt zentriert bleiben */
.workpage-nav-pill--placeholder {
  visibility: hidden;
  pointer-events: none;
  border-color: transparent;
  background: transparent;
}

/* Auf sehr schmalen Screens nur die Pfeil-Icons zeigen, damit nichts überläuft */
@media (max-width: 480px) {
  .workpage-nav-pill > span:not([aria-hidden="true"]) {
    display: none;
  }
  .workpage-nav-pill {
    padding: 0.45rem 0.7rem;
    font-size: 0.95rem;
    letter-spacing: 0;
    gap: 0;
    min-width: 2.25rem;
    justify-content: center;
  }
  .workpage-nav-pill--placeholder {
    min-width: 2.25rem;
  }
}

/* Dots in der Navigation zwischen den Pfeilen */
.workpage-nav-row {
  flex-wrap: nowrap;
}

.workpage-dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.55rem;
  flex: 1 1 auto;
  min-width: 0;
  padding: 0 0.5rem;
}

.workpage-dot {
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(255, 45, 22, 0.38) 0 3px, transparent 3.5px);
  border: 0;
  cursor: pointer;
  transition: background 200ms ease, transform 200ms ease, border-color 200ms ease;
}

.workpage-dot:hover {
  background: radial-gradient(circle, rgba(255, 45, 22, 0.72) 0 3.5px, transparent 4px);
}

.workpage-dot.is-active {
  background: radial-gradient(circle, var(--brand-red) 0 4px, transparent 4.5px);
}

@media (max-width: 480px) {
  .workpage-dots {
    gap: 0;
    padding: 0 0.25rem;
  }
  .workpage-dot {
    width: 24px;
    height: 24px;
  }
}

@media (min-width: 1024px) {
  .workpage-nav-pill {
    font-size: 0.75rem;
    padding: 0.5rem 1.15rem;
    max-width: none;
  }
}

/* Jahresangabe – prominent und klar lesbar */
.workpage-year {
  display: inline-block;
  margin-top: 0.25rem;
  margin-bottom: 0.75rem;
  padding: 0.25rem 0;
  color: var(--brand-red);
  font-size: 0.8rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-weight: 500;
}

.workpage-title {
  margin: 0;
  color: var(--brand-red);
  font-size: clamp(2.35rem, 5vw, 4.5rem);
  font-weight: 700;
  line-height: 0.98;
  letter-spacing: -0.035em;
}

.workpage-summary {
  margin: 1.2rem 0 0;
  color: var(--brand-red);
  font-size: clamp(1.05rem, 1.8vw, 1.3rem);
  font-weight: 500;
  line-height: 1.5;
}

.workpage-mobile-lead {
  margin: 1.75rem 0 2.25rem;
}

.workpage-mobile-gallery {
  display: none;
  gap: 1rem;
  margin-top: 2.5rem;
}

@media (max-width: 1023px) {
  .workpage-mobile-gallery {
    display: grid;
  }
}

.workpage-media-frame {
  width: 100%;
  overflow: hidden;
  border-radius: 0.5rem;
  background: #14100e;
}

.workpage-media-frame img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

/* Keywords als einzelne Pills unter dem Text */
.workpage-keywords {
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 45, 22, 0.1);
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.workpage-keyword-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.35rem;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brand-red);
  white-space: nowrap;
}

/* Im Markdown eingetragenes Jahr (erstes h5) und Keyword-Zeile ausblenden,
   da wir sie über eigene Elemente rendern */
/* Der Fliesstext kommt aus dem Typography-Plugin und braeuchte sonst fuer
   jede Auszeichnung eine eigene Regel – deshalb hier gesammelt. */
.workpage-prose,
.workpage-prose :deep(p),
.workpage-prose :deep(li),
.workpage-prose :deep(strong),
.workpage-prose :deep(em),
.workpage-prose :deep(h1),
.workpage-prose :deep(h2),
.workpage-prose :deep(h3),
.workpage-prose :deep(h4),
.workpage-prose :deep(h6),
.workpage-notfound {
  color: var(--brand-red);
}

.workpage-prose :deep(a) {
  color: var(--brand-red);
  text-decoration: underline;
}

.workpage-prose :deep(h1) {
  display: none;
}

.workpage-prose :deep(h2) {
  margin-top: 2.25rem;
  margin-bottom: 0.65rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.workpage-prose :deep(p) {
  margin-top: 0;
  margin-bottom: 1.2rem;
}

.workpage-prose :deep(h5) {
  display: none;
}

/* Alte "## Keywords"-Überschrift + darunterliegender Absatz unterdrücken */
.workpage-prose :deep(h2:has(+ p)) {
  /* no-op: Stabilität */
}
</style>
