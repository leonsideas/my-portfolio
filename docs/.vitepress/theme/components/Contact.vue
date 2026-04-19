<template>
  <section
    class="contact-screen"
    aria-label="Kontakt"
    :style="{ backgroundImage: `url(${currentBgSrc})` }"
  >
    <div class="content">
      <div class="links">
        <a class="contact-pill email" href="mailto:leon-albers@web.de">
          <svg
            class="contact-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          <span>leon-albers@web.de</span>
        </a>
        <a
          class="contact-pill instagram"
          href="https://www.instagram.com/leonsideas"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            class="contact-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
          </svg>
          <span>@leonsideas</span>
        </a>
      </div>
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
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #000;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
  overflow: hidden;
}

.content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: grid;
  justify-items: center;
  align-content: start;
  padding: 120px 24px 24px;
  text-align: center;
}

.links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.contact-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.6em;

  font-weight: 500;
  letter-spacing: 0.01em;
  text-decoration: none;
  color: #fff;
  font-size: clamp(18px, 4.5vw, 32px);
  line-height: 1.2;

  text-shadow: 0 1px 14px rgba(0, 0, 0, 0.55);
  transition: opacity 200ms ease;
  opacity: 0.92;
}

.contact-pill:hover {
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 0.25em;
  text-decoration-thickness: 1px;
}

.contact-icon {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}
</style>