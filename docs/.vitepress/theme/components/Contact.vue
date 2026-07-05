<template>
  <section
    class="contact-screen"
    aria-label="Kontakt"
    :style="{ backgroundImage: `url(${currentBgSrc})` }"
  >
    <div class="contact-overlay" aria-hidden="true" />

    <div class="contact-content">
      <h1 class="contact-heading">
        <a
          class="contact-heading-link"
          href="mailto:leon-albers@web.de"
          aria-label="E-Mail an leon-albers@web.de schreiben"
        >
          Sag Moin
        </a>
      </h1>
    </div>
  </section>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const kontaktDesktopSrc = withBase('/images/Kontakt.webp')
const kontaktMobileSrc = withBase('/images/Kontakt-mobil.webp')

const kontaktNightDesktopSrc = withBase('/images/background-night2.webp')
const kontaktNightMobileSrc = withBase('/images/background-night-mobil2.webp')

const isMobile = ref(false)
const isNight = ref(false)

const currentBgSrc = computed(() => {
  if (isNight.value) {
    return isMobile.value ? kontaktNightMobileSrc : kontaktNightDesktopSrc
  }
  return isMobile.value ? kontaktMobileSrc : kontaktDesktopSrc
})

const updateIsMobile = () => {
  if (typeof window === 'undefined') return
  isMobile.value = window.innerWidth < 768
}

const updateIsNight = () => {
  if (typeof window === 'undefined') return
  const hour = new Date().getHours()
  isNight.value = hour >= 20 || hour < 6
}

const previousTitle = typeof document !== 'undefined' ? document.title : ''
let nightCheckInterval: number | undefined

onMounted(() => {
  document.title = 'Kontakt'
  updateIsMobile()
  updateIsNight()
  window.addEventListener('resize', updateIsMobile)
  nightCheckInterval = window.setInterval(updateIsNight, 60 * 1000)
})

onBeforeUnmount(() => {
  document.title = previousTitle
  window.removeEventListener('resize', updateIsMobile)

  if (nightCheckInterval) {
    window.clearInterval(nightCheckInterval)
  }
})
</script>

<style scoped>
.contact-screen {
  position: fixed;
  inset: 0;
  margin: 0;
  padding: 0;
  background-color: #000;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
  overflow: hidden;
  color: #fff;
}

/* Dezenter dunkler Verlauf oben und unten, damit Text auf hellem Hintergrund
   immer gut lesbar bleibt */
.contact-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.05) 25%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.25) 100%);
  z-index: 1;
}

.contact-content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: clamp(144px, 24vh, 280px) clamp(20px, 6vw, 48px) clamp(40px, 8vh, 72px);
  text-align: center;
}

.contact-heading {
  margin: 0;
  font-family: var(--font-heading, "Playfair Display"), Georgia, serif;
  font-weight: 600;
  font-style: italic;
  font-size: clamp(2.75rem, 11vw, 5.25rem);
  line-height: 1;
  letter-spacing: -0.02em;
  color: #fff;
}

.contact-heading-link {
  color: inherit;
  text-decoration: none;
  transition: opacity 220ms ease;
}

.contact-heading-link:hover,
.contact-heading-link:focus-visible {
  outline: none;
  text-decoration: underline;
  text-underline-offset: 0.12em;
  text-decoration-thickness: 0.04em;
}
</style>