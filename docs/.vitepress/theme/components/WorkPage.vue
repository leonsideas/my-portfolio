<script setup lang="ts">
  import { withBase, useRouter } from 'vitepress'
  import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'

  type CardVideo = {
    // komplette Embed-URL, z.B. "https://www.youtube.com/embed/XXXXXXXXXXX"
    url: string
    // optionaler Titel
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
    videos: CardVideo[]    // jetzt YouTube-Infos statt lokaler Dateien
  }

  type OverlayFadeMode = 'fade-out' | 'fade-in' | 'none'
  const overlayFadeMode = ref<OverlayFadeMode>('fade-out')

  // NEU: falls true -> kein schwarzer Fade-Layer rendern
  const overlayFadeDisabled = ref(false)
  // NEU: sagt, ob nach Ende der Transition ein Hard-Reload auf targetRoute gemacht werden soll
  const overlayUseHardReload = ref(false)
  // NEU: Spezialfall – Transition_up zurück zum Home-Carousel
  const overlayHomeToRoot = ref(false)
  
  // NEU: Standard-Seitentitel merken, damit wir ihn wiederherstellen können
  const defaultDocumentTitle =
    typeof document !== 'undefined' ? document.title : 'Leon Albers | Portfolio'
  
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
  
  // Videos (Cover)
  const videoFiles = import.meta.glob('../../../works/**/cover.{mp4,webm,ogg}', {
    eager: true,
    import: 'default'
  })

  // NEU: beliebige Projektbilder, z.B. works/<slug>/images/foo.jpg
  const projectImageFiles = import.meta.glob('../../../works/**/*.{jpg,jpeg,png,webp,gif}', {
    eager: true,
    import: 'default'
  })

  // NEU: beliebige Projekt-Videos, z.B. works/<slug>/videos/*.mp4
  // -> nicht mehr benötigt, wenn alles über YouTube läuft
  // const projectVideoFiles = import.meta.glob('../../../works/**/*.{mp4,webm,ogg}', {
  //   eager: true,
  //   import: 'default'
  // })
  
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

    // NEU: alle Videos im Ordner außer cover.* -> entfällt bei YouTube-Umstellung
    // const projectVideos: string[] = Object.keys(projectVideoFiles)
    //   .filter(k => k.startsWith(folder))
    //   .filter(k => !/\/cover\.(mp4|webm|ogg)$/i.test(k))
    //   .map(k => projectVideoFiles[k] as string)
    //   .sort()

    const images = projectImages.length ? projectImages : (coverImage ? [coverImage] : [])

    const mod = markdownModules[path] as any

    // NEU: YouTube-Links aus dem Frontmatter lesen (Array von Strings oder Objekten)
    const fm = mod?.frontmatter || {}
    const fmVideos = Array.isArray(fm.videos) ? fm.videos : []
    const youtubeVideos: CardVideo[] = fmVideos.map((v: any) => {
      if (typeof v === 'string') {
        return { url: v }
      }
      if (v && typeof v.url === 'string') {
        return { url: v.url, title: v.title }
      }
      return null
    }).filter(Boolean) as CardVideo[]
  
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
      videos: youtubeVideos  // jetzt YouTube-Infos statt lokaler Dateien
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

      const hardReload = overlayUseHardReload.value

      overlayTargetRoute.value = null
      overlayTargetSlug.value = null
      overlayUseHardReload.value = false

      if (hardReload) {
        // Hard-Reload: verhindert, dass WorkPage noch einmal kurz gerendert wird
        if (typeof window !== 'undefined') {
          window.location.href = withBase(targetRoute)
        }
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
  
    // contentVisible NICHT hier setzen -> passiert nach Videoende
  }
  
  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove(WORKPAGE_CLASS)
      document.removeEventListener('pointerdown', interceptHomeNav, true)
      document.removeEventListener('click', interceptHomeNav, true)
      // NEU: ursprünglichen Titel wiederherstellen
      document.title = defaultDocumentTitle
    }
    clearOverlayFadeTimer()
  })
  
  /** ✅ EINZIGE klasse für workpage-styles */
  const WORKPAGE_CLASS = 'is-workpage'
  
  onMounted(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add(WORKPAGE_CLASS)
      // NEU: Tab-Titel für WorkPage setzen
      document.title = 'Projects | Leon Albers'
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

      // ✅ OPTION A: Transition liegt unter /videos/...
      playProjectIntro(id, withBase('/videos/Transition.mp4'))
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

        // ✅ OPTION A: Transition liegt unter /videos/...
        playProjectIntro(id, withBase('/videos/Transition.mp4'))
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
    // Standard: kein Hard-Reload, kann bei Bedarf aktiviert werden
    overlayUseHardReload.value = false

    // wichtig: bei "none" den Fade-State neutral halten
    overlayFadingOut.value = false

    overlayVideoReady.value = false
    overlayVideoSrc.value = videoSrc
    overlayTargetSlug.value = null

    // WICHTIG:
    // Wenn wir explizit "zur Startseite" (Leon-Albers) wollen, nutzen wir
    // NICHT overlayTargetRoute, damit handleOverlayEnded in den Spezialfall gehen kann.
    overlayTargetRoute.value = overlayHomeToRoot.value ? null : routePath

    overlayVisible.value = true
    contentVisible.value = false

    // NONE: KEIN kurzer Cut. Nur Safety-Fallback.
    if (fadeMode === 'none') {
      overlayAfterFadeTimer = window.setTimeout(() => {
        clearOverlayFadeTimer()

        // Safety-Fallback:
        // Falls das Video nie endet, trotzdem das gewünschte Ziel erreichen.
        if (overlayHomeToRoot.value && typeof window !== 'undefined') {
          const target = routePath || '/'
          overlayHomeToRoot.value = false
          window.location.href = withBase(target)
          return
        }

        // Safety für alle anderen Routen
        overlayUseHardReload.value = true
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

    // NEU: absoluter Spezialfall – zurück zum Root-Carousel (Leon-Albers-Klick)
    if (overlayHomeToRoot.value && typeof window !== 'undefined') {
      overlayHomeToRoot.value = false

      // NICHTS mehr an WorkPage-State ändern, direkt Hard-Reload:
      window.location.href = withBase('/')
      return
    }
  
    // NEU: wenn Route-Ziel gesetzt, nach Fade dorthin
    if (overlayTargetRoute.value) {
      // NEU: wenn fade disabled -> ohne warten sofort navigieren
      if (overlayFadeDisabled.value) {
        // wenn Hard-Reload gewünscht, hier direkt voll neu laden
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

    // NEU: bei jedem Projektwechsel Tab-Titel sicher auf „Projects | Leon Albers“ setzen
    if (typeof document !== 'undefined') {
      document.title = 'Projects | Leon Albers'
    }
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

    // Beim Klick auf Brand/Home/Leon-Albers:
    // wir wollen nach Ende von Transition_up direkt mit Hard-Reload nach "/"
    const targetRoute = '/'
    overlayUseHardReload.value = true
    overlayHomeToRoot.value = true

    // ✅ OPTION A: Transition_up liegt unter /videos/...
    playTransitionToRoute(targetRoute, withBase('/videos/Transition_up.mp4'), 'none')
  }

  // NEU: Index/Helfer für Navigation
  const currentIndex = computed(() =>
    cards.value.findIndex(card => card.slug === currentSlug.value)
  )
  const hasPrev = computed(() => currentIndex.value > 0)
  const hasNext = computed(() =>
    currentIndex.value >= 0 && currentIndex.value < cards.value.length - 1
  )
  const prevSlug = computed(() =>
    hasPrev.value ? cards.value[currentIndex.value - 1].slug : undefined
  )
  const nextSlug = computed(() =>
    hasNext.value ? cards.value[currentIndex.value + 1].slug : undefined
  )

  // NEU: einfache Prev/Nächste-Helfer
  function goToPrev() {
    if (!hasPrev.value || !prevSlug.value) return
    selectCard(prevSlug.value, `/works/?id=${encodeURIComponent(prevSlug.value)}`)
  }

  function goToNext() {
    if (!hasNext.value || !nextSlug.value) return
    selectCard(nextSlug.value, `/works/?id=${encodeURIComponent(nextSlug.value)}`)
  }

  // NEU: Touch-Swipe-Handling auf Bildbereich
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

    // Vertikal stärker als horizontal -> als Scroll interpretieren
    if (Math.abs(dy) > Math.abs(dx)) return

    const threshold = 50 // px
    if (dx < -threshold && hasNext.value) {
      // nach links gewischt -> nächstes Projekt
      goToNext()
    } else if (dx > threshold && hasPrev.value) {
      // nach rechts gewischt -> vorheriges Projekt
      goToPrev()
    }
  }

  // NEU: Hilfs-URL für Hintergrundbild – Bild liegt in /public/erde.jpg
  const backgroundImage = withBase('/erde.jpg')
</script>

<template>
  <!-- Voller Screen -->
  <!-- ÄNDERUNG: Hintergrundbild + dunkles Overlay -->
  <div
    class="h-screen w-full bg-black/80 workpage-root overflow-y-auto lg:overflow-hidden"
    :style="{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }"
  >
    <!-- WICHTIG: flex + h-full + min-h-0, damit Kinder schrumpfen dürfen -->
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

      <!-- Hauptinhalt unterhalb der Navbar -->
      <section
        v-if="contentVisible"
        class="flex-1 min-h-0 w-full text-gray-100 workpage-content"
      >
        <!-- Navbar-Abstand per Padding oben, aber trotzdem volle Höhe -->
        <!-- ÄNDERUNG: auf mobilen Geräten darf die Seite normal scrollen -->
        <div class="pt-16 px-6 pb-2 h-full flex flex-col lg:min-h-0">
          <Transition name="content-fade" mode="out-in" appear>
            <!-- Ganze Karte: nutzt restliche Höhe -->
            <!-- ÄNDERUNG: auf mobil kein min-h-0 + flex-1, sonst vollflächiger Container -->
            <div v-if="currentCard" :key="contentKey" class="flex flex-col lg:flex-1 lg:min-h-0">
              <!-- Buttons oben, feste Höhe -->
              <div
                class="flex items-center justify-between gap-4 mb-4 text-xs md:text-sm text-gray-400 shrink-0"
              >
                <!-- Links: nur „Vorheriges Projekt“, aber nicht beim ersten Projekt -->
                <button
                  v-if="hasPrev"
                  type="button"
                  class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10"
                  @click="goToPrev"
                >
                  <span>‹</span>
                  <span>Vorheriges Projekt</span>
                </button>

                <!-- Rechts: nur „Nächstes Projekt“, falls vorhanden -->
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

              <!-- Grid-Bereich: 
                   - mobil: normales Flow-Layout, eine Spalte, ein Scrollbereich
                   - desktop (lg): 2 Spalten, eigener Scroll je Spalte -->
              <div class="lg:flex-1 lg:min-h-0">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start lg:h-full lg:min-h-0">
                  <!-- Textspalte -->
                  <div class="text-left lg:min-h-0 lg:h-full lg:overflow-y-auto lg:pr-2">
                    <component
                      v-if="currentCard.component"
                      :is="currentCard.component"
                      class="prose prose-invert prose-base md:prose-lg max-w-none text-left"
                    />
                  </div>

                  <!-- Medien-Spalte -->
                  <div
                    class="mt-8 lg:mt-0 lg:min-h-0 lg:h-full lg:overflow-y-auto lg:pl-2 relative"
                    @touchstart.passive="onImagesTouchStart"
                    @touchend.passive="onImagesTouchEnd"
                  >
                    <div class="space-y-6">
                      <!-- Bilder (oben) -->
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

                      <!-- Videos (darunter) -->
                      <div
                        v-if="currentCard.videos && currentCard.videos.length"
                        class="grid grid-cols-1 gap-4"
                      >
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

                      <!-- Fallback, wenn weder Bilder noch Videos vorhanden -->
                      <div
                        v-if="(!currentCard.images || !currentCard.images.length) &&
                             (!currentCard.videos || !currentCard.videos.length)"
                        class="text-sm text-gray-500"
                      >
                        Für dieses Projekt sind noch keine Medien hinterlegt.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fallback, falls kein Projekt für currentSlug gefunden wurde -->
            <div v-else :key="'not-found'" class="text-gray-300">
              Projekt nicht gefunden.
            </div>
          </Transition>

          <!-- Kleiner Footer unten -->
          <footer class="mt-2 pt-2 border-t border-white/10 text-xs text-gray-500 shrink-0">
            © {{ new Date().getFullYear() }} Leon Albers
          </footer>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ...existing code... */

/* optional, aber hilfreich für iOS „momentum scrolling“ */
.workpage-root {
  -webkit-overflow-scrolling: touch;

  /* NEU: Fullscreen-Background fixiert über der gesamten Seite */
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
</style>
