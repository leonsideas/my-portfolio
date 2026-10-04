import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Gemeinsame Logik für Cover-Medien (Video oder Bild) eines Projekts.
 *
 * Regeln – identisch zum Carousel:
 *  - Nacht (20–6 Uhr): Desktop bevorzugt `<id>_cover-night-animated.mp4`,
 *    sonst Nachtbild (mobil die `-mobil`-Variante)
 *  - Mobil + Tag: `<id>-cover_mobile-animated.mp4`, sonst `<id>-cover_mobile.webp`
 *    (nie das 16:9-Desktop-Video, das würde im 9:16 beschnitten)
 *  - Desktop + Tag: `<id>-cover-animated.mp4`, sonst `<id>-cover.webp`
 */

export type CoverMedia = {
  type: 'video' | 'image'
  src: string
}

// Alle -animated Videos einsammeln, damit neue Dateien ohne Code-Änderung greifen
const animatedVideoFiles = import.meta.glob(
  '../../../videos/*-animated.mp4',
  { eager: true, import: 'default' }
) as Record<string, string>

const animatedVideoMap: Record<string, string> = {}
for (const path in animatedVideoFiles) {
  const filename = path.split('/').pop() || ''
  animatedVideoMap[filename] = animatedVideoFiles[path]
}

// Diese Projekte verwenden bewusst statische Coverbilder.
const staticCoverIds = new Set(['Klanggestalten', 'Uebergangsobjekte', 'Stottern'])

function calcIsNight(): boolean {
  if (typeof window === 'undefined') return false
  const h = new Date().getHours()
  return h >= 20 || h < 6
}

function calcIsMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

export function useCoverMedia() {
  const isNight = ref(false)
  const isMobile = ref(false)

  let nightInterval: number | null = null

  function updateIsMobile() {
    isMobile.value = calcIsMobile()
  }

  onMounted(() => {
    isNight.value = calcIsNight()
    updateIsMobile()

    nightInterval = window.setInterval(() => {
      isNight.value = calcIsNight()
    }, 60_000)

    window.addEventListener('resize', updateIsMobile)
  })

  onBeforeUnmount(() => {
    if (nightInterval !== null) clearInterval(nightInterval)
    window.removeEventListener('resize', updateIsMobile)
  })

  /** Cover-Medium eines Projekts für den aktuellen Kontext (Tag/Nacht, Mobil/Desktop) */
  function mediaFor(id: string): CoverMedia {
    const useStaticCover = staticCoverIds.has(id)

    if (id === 'Reefresh') {
      return {
        type: 'image',
        src: isMobile.value
          ? '/images/Reefresh-cover_mobile.webp'
          : '/images/Reefresh-cover.webp',
      }
    }

    if (isNight.value) {
      const nightVideo = !isMobile.value && !useStaticCover
        ? animatedVideoMap[`${id}_cover-night-animated.mp4`]
        : null

      if (nightVideo) return { type: 'video', src: nightVideo }

      return {
        type: 'image',
        src: isMobile.value
          ? `/images/${id}_cover-night-mobil.webp`
          : `/images/${id}_cover-night.webp`,
      }
    }

    if (isMobile.value) {
      const mobileVideo = useStaticCover
        ? null
        : animatedVideoMap[`${id}-cover_mobile-animated.mp4`]
      if (mobileVideo) return { type: 'video', src: mobileVideo }
      return { type: 'image', src: `/images/${id}-cover_mobile.webp` }
    }

    const desktopVideo = useStaticCover
      ? null
      : animatedVideoMap[`${id}-cover-animated.mp4`]
    if (desktopVideo) return { type: 'video', src: desktopVideo }
    return { type: 'image', src: `/images/${id}-cover.webp` }
  }

  /** Ruhezustand der Startseite: das Intro-Motiv */
  function introMedia(): CoverMedia {
    if (isNight.value) {
      return {
        type: 'image',
        src: isMobile.value
          ? '/images/background-night-mobil.webp'
          : '/images/background-night.webp',
      }
    }

    return {
      type: 'video',
      src: isMobile.value ? '/videos/intro-mobil.mp4' : '/videos/intro.mp4',
    }
  }

  return { isNight, isMobile, mediaFor, introMedia }
}
