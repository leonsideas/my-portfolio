<template>
  <section
    class="contact-screen"
    aria-label="Kontakt"
    :style="{ backgroundImage: `url(${currentBgSrc})` }"
  >
    <div class="content">
      <div class="links">
        <a class="email" href="mailto:leon-albers@web.de">leon-albers@web.de</a>
        <a
          class="instagram"
          href="https://www.instagram.com/leonsideas"
          target="_blank"
          rel="noopener noreferrer"
        >
          @leonsideas
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const kontaktDesktopSrc = withBase('/images/Kontakt.png')
const kontaktMobileSrc = withBase('/images/Kontakt-mobil.jpg')

const kontaktNightDesktopSrc = withBase('/images/background-night2.jpg')
const kontaktNightMobileSrc = withBase('/images/background-night-mobil2.jpg')

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
  gap: 12px;
}

.email,
.instagram {
  font-weight: 800;
  letter-spacing: 0.02em;
  text-decoration: none;
  color: #fff;
  font-size: clamp(12px, 6vw, 72px);
  line-height: 1.05;
}

.email:hover,
.instagram:hover {
  text-decoration: underline;
}
</style>