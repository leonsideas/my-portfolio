<script setup lang="ts">
  import { withBase, useRouter } from 'vitepress'
  import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
  
  type Card = {
    slug: string
    title: string
    name: string
    excerpt: string
    route: string
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
  
  // Videos
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
  
    const match = path.match(/works\/([^/]+)\/index\.md$/)
    const slug = match?.[1] ?? ''
  
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
  
  const currentSlug = ref<string | undefined>(cards.value[0]?.slug)
  
  // === Fullscreen-Overlay-Video State ===
  const overlayVisible = ref(false)
  const overlayVideoSrc = ref<string | null>(null)
  const overlayTargetSlug = ref<string | null>(null)
  const overlayFadingOut = ref(false)
  const overlayVideoReady = ref(false)
  
  const overlayFadeStartMs = 2000
  const overlayFadeMs = 2000
  const overlayCutToPageMs = 4000
  
  let overlayFadeTimer: number | null = null
  let overlayAfterFadeTimer: number | null = null
  
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
    overlayVideoReady.value = false
  
    currentSlug.value = target
    router.go(withBase(`/works/?id=${encodeURIComponent(target)}`))
  }
  
  onBeforeUnmount(() => {
    clearOverlayFadeTimer()
  })
  
  /** ✅ EINZIGE klasse für workpage-styles */
  const WORKPAGE_CLASS = 'is-workpage'
  
  onMounted(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add(WORKPAGE_CLASS)
    }
  
    // initialer Slug aus URL
    currentSlug.value = getSlugFromLocation()
  
    // Wenn von Carousel mit ?play=1 gekommen:
    const { id, play } = getParamsFromLocation()
    if (id) currentSlug.value = id
  
    if (id && play) {
      updateUrlWithoutPlayParam(id)
      playProjectIntro(id, withBase('/Transition.mp4'))
    }
  })
  
  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove(WORKPAGE_CLASS)
    }
    clearOverlayFadeTimer()
  })
  
  function getSlugFromLocation(): string | undefined {
    if (typeof window === 'undefined') return cards.value[0]?.slug
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    return id || cards.value[0]?.slug
  }
  
  function getParamsFromLocation() {
    if (typeof window === 'undefined') {
      return { id: undefined as string | undefined, play: false, url: '' }
    }
    const url = window.location.href
    const params = new URLSearchParams(window.location.search)
    return {
      id: params.get('id') || undefined,
      play: params.get('play') === '1',
      url
    }
  }
  
  function updateUrlWithoutPlayParam(id?: string) {
    if (typeof window === 'undefined') return
  
    const url = new URL(window.location.href)
    const params = url.searchParams
  
    if (id) params.set('id', id)
    else if (!params.get('id') && cards.value[0]?.slug) params.set('id', cards.value[0].slug)
  
    params.delete('play')
    url.search = params.toString()
    window.history.replaceState({}, '', url.toString())
  }
  
  watch(
    () => (typeof window !== 'undefined' ? window.location.search : ''),
    () => {
      const { id, play } = getParamsFromLocation()
      if (id) currentSlug.value = id
      if (id && play) {
        updateUrlWithoutPlayParam(id)
        playProjectIntro(id, withBase('/Transition.mp4'))
      }
    }
  )
  
  function selectCard(slug: string, routePath: string) {
    currentSlug.value = slug
    router.go(withBase(routePath))
  }
  
  function playProjectIntro(slug: string, videoSrc?: string | null) {
    const card = cards.value.find(c => c.slug === slug)
    if (!card) return
  
    const src = videoSrc ?? card.video
    if (!src) {
      selectCard(slug, `/works/?id=${slug}`)
      return
    }
  
    clearOverlayFadeTimer()
    overlayFadingOut.value = false
    overlayVideoReady.value = false
    overlayVideoSrc.value = src
    overlayTargetSlug.value = slug
    overlayVisible.value = true
  
    overlayFadeTimer = window.setTimeout(() => {
      overlayFadingOut.value = true
    }, overlayFadeStartMs)
  
    overlayAfterFadeTimer = window.setTimeout(() => {
      clearOverlayFadeTimer()
      showWorkPageFromOverlay()
    }, overlayCutToPageMs)
  }
  
  async function handleOverlayEnded() {
    if (!overlayVisible.value) return
    clearOverlayFadeTimer()
  
    if (!overlayTargetSlug.value) {
      overlayVisible.value = false
      overlayFadingOut.value = false
      return
    }
  
    overlayFadingOut.value = true
    await new Promise(resolve => setTimeout(resolve, overlayFadeMs + 100))
  
    showWorkPageFromOverlay()
  }
  
  const currentCard = computed(() => cards.value.find(card => card.slug === currentSlug.value))
  
  const contentKey = ref(0)
  watch(currentSlug, () => {
    contentKey.value += 1
  })
  </script>
  
  <template>
    <div class="h-screen w-full bg-black workpage-root overflow-hidden">
      <div class="flex flex-col h-full min-h-0">
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
          <div
            class="absolute inset-0 bg-black pointer-events-none transition-opacity ease-in-out"
            style="transition-duration: 2000ms;"
            :class="overlayFadingOut ? 'opacity-100' : 'opacity-0'"
          />
        </div>
  
        <section class="flex-1 min-h-0 w-full bg-black overflow-y-auto text-gray-100 workpage-content pt-16">
          <div class="px-6 pb-6">
            <Transition name="fade" mode="out-in">
              <div v-if="currentCard" :key="contentKey" class="text-left">
                <component
                  v-if="currentCard.component"
                  :is="currentCard.component"
                  class="prose prose-invert prose-base md:prose-lg max-w-none text-left"
                />
              </div>
  
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
  .workpage-content {
    -webkit-overflow-scrolling: touch;
  }
  
  /* =========================
     ✅ GLOBAL VITEPRESS OVERRIDES
     Hintergrund exakt wie Carousel: #000, kein Blur
     ========================= */
  
  :global(html.is-workpage) {
    color-scheme: dark;
    --vp-nav-bg-color: #000 !important;
    --vp-nav-screen-bg-color: #000 !important;
  }
  
  /* 2) Echte VitePress Navbar DOM-Elemente: schwarz + kein Blur */
  :global(html.is-workpage .VPNav),
  :global(html.is-workpage .VPNavBar),
  :global(html.is-workpage .VPNavBar .container),
  :global(html.is-workpage .VPNavBar .content),
  :global(html.is-workpage .VPNavScreen) {
    background: #000 !important;
    background-color: #000 !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    box-shadow: none !important;
    border-bottom: 0 !important;
  }
  
  /* 3) Pseudo-Overlays killen (oft Ursache für “grau”) */
  :global(html.is-workpage .VPNavBar::before),
  :global(html.is-workpage .VPNavBar::after),
  :global(html.is-workpage .VPNav::before),
  :global(html.is-workpage .VPNav::after) {
    content: none !important;
    display: none !important;
  }
  
  /* 4) Alle Navbar-Texte/Icons weiß */
  :global(html.is-workpage .VPNavBar),
  :global(html.is-workpage .VPNavBar a),
  :global(html.is-workpage .VPNavBar .title),
  :global(html.is-workpage .VPNavBar .VPNavBarTitle),
  :global(html.is-workpage .VPNavBar .VPLink),
  :global(html.is-workpage .VPNavBar .link),
  :global(html.is-workpage .VPNavBar .text) {
    color: #fff !important;
  }
  
  :global(html.is-workpage .VPNavBar svg),
  :global(html.is-workpage .VPNavBar .icon) {
    fill: #fff !important;
    stroke: #fff !important;
  }
  
  /* 5) Kein Blend/Filter irgendwo in der Navbar */
  :global(html.is-workpage .VPNav),
  :global(html.is-workpage .VPNavBar),
  :global(html.is-workpage .VPNavBar *),
  :global(html.is-workpage .VPNavScreen) {
    mix-blend-mode: normal !important;
    filter: none !important;
    opacity: 1 !important;
  }
  
  /* Optional: Layout-Flächen schwarz halten */
  :global(html.is-workpage .Layout),
  :global(html.is-workpage .VPContent),
  :global(html.is-workpage .VPContent .container),
  :global(html.is-workpage .VPContent .content),
  :global(html.is-workpage .VPDoc),
  :global(html.is-workpage .VPDoc .container),
  :global(html.is-workpage .VPDoc .content-container) {
    background: #000 !important;
  }

  /* Zusätzliche Sicherheit: Body-Hintergrund im WorkPage-Kontext */
  :global(html.is-workpage body) {
    background: #000 !important;
  }
  </style>
