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
    images: string[]        // NEU: zusätzliche Bilder pro Projekt
  }
  
  type OverlayFadeMode = 'fade-out' | 'fade-in' | 'none'
  const overlayFadeMode = ref<OverlayFadeMode>('fade-out')

  // NEU: falls true -> kein schwarzer Fade-Layer rendern
  const overlayFadeDisabled = ref(false)
  
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

  // NEU: beliebige Projektbilder, z.B. works/<slug>/images/foo.jpg
  const projectImageFiles = import.meta.glob('../../../works/**/*.{jpg,jpeg,png,webp,gif}', {
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

    const coverImage = imageKey ? (imageFiles[imageKey] as string) : null

    const projectImages: string[] = Object.keys(projectImageFiles)
      .filter(k => k.startsWith(folder))
      .filter(k => !/\/cover\.(jpg|jpeg|png|webp|gif)$/i.test(k))
      .map(k => projectImageFiles[k] as string)
      .sort()

    // NEU: fallback -> wenn keine images/ vorhanden, nimm cover.*
    const images = projectImages.length ? projectImages : (coverImage ? [coverImage] : [])

    const mod = markdownModules[path] as any
  
    cards.value.push({
      slug,
      title: titleLine?.replace(/^# /, '') || 'Untitled',
      name: nameLine?.replace(/^## /, '') || 'Anonymous',
      excerpt: excerptLine || '',
      route,
      image: coverImage,
      video: videoKey ? (videoFiles[videoKey] as string) : null,
      component: mod?.default || null,
      images
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
  
  const overlayFadeStartMs = 2000
  const overlayFadeMs = 2000
  const overlayCutToPageMs = 4000
  
  let overlayFadeTimer: number | null = null
  let overlayAfterFadeTimer: number | null = null
  
  // NEU: Content ist initial unsichtbar – wird erst nach Video eingeblendet
  const contentVisible = ref(false)

  // NEU: Safety-Fallback nur falls @ended nie kommt (z.B. Video startet nicht)
  const overlaySafetyFallbackMs = 30000
  
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
    // NEU: Route-Ziel hat Priorität (z.B. zurück ins Carousel)
    const targetRoute = overlayTargetRoute.value
    if (targetRoute) {
      overlayVisible.value = false
      overlayFadingOut.value = false
      overlayVideoSrc.value = null
      overlayVideoReady.value = false
    
      overlayTargetRoute.value = null
      overlayTargetSlug.value = null
      // WICHTIG: contentVisible NICHT hier auf true setzen,
      // das macht handleOverlayEnded NACH dem Videoende.
      router.go(withBase(targetRoute))
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
  
    // contentVisible NICHT hier setzen -> passiert nach Videoende
  }
  
  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove(WORKPAGE_CLASS)
      document.removeEventListener('pointerdown', interceptHomeNav, true)
      document.removeEventListener('click', interceptHomeNav, true)
    }
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
      // WICHTIG: Bei Intro-Video contentVisible NICHT hier setzen.
      // Das passiert erst nach Videoende in handleOverlayEnded().
      updateUrlWithoutPlayParam(id)
      playProjectIntro(id, withBase('/Transition.mp4'))
    } else {
      // Kein Intro-Video -> Content direkt einblenden
      contentVisible.value = true
    }
  
    // NEU: global listener aktivieren (capturing, damit wir sicher vorher intercepten)
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', interceptHomeNav, true)
      document.addEventListener('click', interceptHomeNav, true)
    }

    // NEU: Debug – zeigt dir, ob Vite die Dateien überhaupt findet
    if (typeof window !== 'undefined') {
      const slug = getSlugFromLocation()
      const c = cards.value.find(x => x.slug === slug)
      console.log('[WorkPage] slug:', slug, 'images:', c?.images)
    }
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
      // Kein Video für dieses Projekt:
      // direkt auf Workpage wechseln UND Content direkt zeigen.
      selectCard(slug, `/works/?id=${slug}`)
      contentVisible.value = true
      return
    }
  
    clearOverlayFadeTimer()
    overlayFadeMode.value = 'fade-out'
    overlayFadingOut.value = false
    overlayVideoReady.value = false
    overlayVideoSrc.value = src
    overlayTargetRoute.value = null
    overlayTargetSlug.value = slug
    overlayVisible.value = true

    // Content verstecken bevor Overlay startet
    contentVisible.value = false
  
    overlayFadeTimer = window.setTimeout(() => {
      overlayFadingOut.value = true
    }, overlayFadeStartMs)
  
    overlayAfterFadeTimer = window.setTimeout(() => {
      clearOverlayFadeTimer()
      showWorkPageFromOverlay()
      // Fallback: falls @ended nicht kam, nach Cut trotzdem Content einblenden
      contentVisible.value = true
    }, overlayCutToPageMs)
  }
  
  // NEU: generisches “play transition then go route”
  function playTransitionToRoute(routePath: string, videoSrc: string, fadeMode: OverlayFadeMode = 'fade-out') {
    clearOverlayFadeTimer()

    overlayFadeMode.value = fadeMode
    overlayFadeDisabled.value = fadeMode === 'none'

    // wichtig: bei "none" den Fade-State neutral halten
    overlayFadingOut.value = false

    overlayVideoReady.value = false
    overlayVideoSrc.value = videoSrc
    overlayTargetSlug.value = null
    overlayTargetRoute.value = routePath
    overlayVisible.value = true

    contentVisible.value = false

    // NONE: KEIN kurzer Cut. Nur Safety-Fallback.
    if (fadeMode === 'none') {
      overlayAfterFadeTimer = window.setTimeout(() => {
        clearOverlayFadeTimer()
        showWorkPageFromOverlay()
        contentVisible.value = true
        overlayFadeDisabled.value = false
      }, overlaySafetyFallbackMs)
      return
    }

    // Default: Fade-out am Ende (bisheriges Verhalten)
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
  
  async function handleOverlayEnded() {
    if (!overlayVisible.value) return
    clearOverlayFadeTimer()
  
    // NEU: wenn Route-Ziel gesetzt, nach Fade dorthin
    if (overlayTargetRoute.value) {
      // NEU: wenn fade disabled -> ohne warten sofort navigieren
      if (overlayFadeDisabled.value) {
        showWorkPageFromOverlay()
        contentVisible.value = true
        overlayFadeDisabled.value = false
        return
      }

      overlayFadingOut.value = true
      await new Promise(resolve => setTimeout(resolve, overlayFadeMs + 100))
      showWorkPageFromOverlay()

      // Transition-Video ist vorbei -> Text einblenden
      contentVisible.value = true
      overlayFadeDisabled.value = false
      return
    }
  
    if (!overlayTargetSlug.value) {
      overlayVisible.value = false
      overlayFadingOut.value = false
      // Kein Ziel: Overlay einfach weg, aber Content wieder zeigen
      contentVisible.value = true
      return
    }
  
    overlayFadingOut.value = true
    await new Promise(resolve => setTimeout(resolve, overlayFadeMs + 100))
  
    showWorkPageFromOverlay()

    // JETZT – nach Wechsel auf Workpage -> Text einblenden (mit 2s-Fade)
    contentVisible.value = true
  }

  function handleOverlayError() {
    // Im no-fade Modus NICHT sofort navigieren, sonst bricht das Video quasi direkt ab
    if (overlayFadeDisabled.value) {
      console.warn('[WorkPage] overlay video error (no-fade). keeping overlay; will use safety fallback timer.')
      return
    }

    showWorkPageFromOverlay()
    contentVisible.value = true
  }
  
  const currentCard = computed(() => cards.value.find(card => card.slug === currentSlug.value))
  
  const contentKey = ref(0)
  watch(currentSlug, () => {
    contentKey.value += 1
  })
  
  // NEU: Click-Interceptor für den Home-/About-Link (Navbar)
  function interceptHomeNav(e: Event) {
    const target = e.target as HTMLElement | null
    if (!target) return

    const anchor = target.closest('a') as HTMLAnchorElement | null
    if (!anchor) return

    const rawHref = anchor.getAttribute('href') || ''

    // explizite Marker aus der Navbar
    const isHomeMarked = anchor.getAttribute('data-nav-home') === '1'
    const isAboutMarked = anchor.getAttribute('data-nav-about') === '1'

    let isHome = isHomeMarked
    let isAbout = isAboutMarked

    if (!isHome && !isAbout) {
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

    // Home bleibt '/', About soll auf about.html
    const targetRoute = isHome ? '/' : '/about.html'
    playTransitionToRoute(targetRoute, withBase('/Transition_up.mp4'), 'none')
  }
</script>

<template>
  <div class="h-screen w-full bg-black workpage-root overflow-hidden">
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
          preload="auto"
          @loadeddata="overlayVideoReady = true"
          @canplay="overlayVideoReady = true"
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
      <section
        v-if="contentVisible"
        class="flex-1 min-h-0 w-full bg-black text-gray-100 workpage-content pt-16"
      >
        <div class="px-6 pb-6 h-full min-h-0">
          <Transition name="content-fade" mode="out-in" appear>
            <div v-if="currentCard" :key="contentKey" class="h-full min-h-0">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start h-full min-h-0">
                <!-- Text: eigener Scroll -->
                <div class="min-h-0 h-full overflow-y-auto pr-2">
                  <div class="text-left">
                    <component
                      v-if="currentCard.component"
                      :is="currentCard.component"
                      class="prose prose-invert prose-base md:prose-lg max-w-none text-left"
                    />
                  </div>
                </div>

                <!-- Bilder: eigener Scroll -->
                <div class="min-h-0 h-full overflow-y-auto pl-2">
                  <div class="space-y-4">
                    <div
                      v-if="currentCard.images && currentCard.images.length"
                      class="grid grid-cols-1 gap-4"
                    >
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
                    <div v-else class="text-sm text-gray-500">
                      Für dieses Projekt sind noch keine Bilder hinterlegt.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else :key="'not-found'" class="text-gray-300">
              Projekt nicht gefunden.
            </div>
          </Transition>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ...existing code... (deine content-fade styles) ...existing code... */
</style>
