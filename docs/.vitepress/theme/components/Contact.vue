<template>
  <section
    class="contact-screen"
    aria-label="Kontakt"
    :class="{ 'is-night': isNight }"
    :style="isNight ? { backgroundImage: `url(${nightBgSrc})` } : undefined"
  >
    <!-- Tagsüber statisches Hintergrundbild, mobil/desktop abhängig -->
    <img
      v-if="!isNight"
      class="posterImage"
      :src="currentPosterSrc"
      alt="Kontakt Hintergrund"
    />

    <div class="overlay" aria-hidden="true"></div>

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
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const posterSrc = withBase('/images/Background-cover.jpg')
const posterMobileSrc = withBase('/images/Background-cover_mobile.jpg')
const nightBgSrc = withBase('/images/bg-cover-night.png')

const isNight = ref(false)
const isMobile = ref(false)

const currentPosterSrc = computed(() =>
  isMobile.value ? posterMobileSrc : posterSrc
)

const updateIsMobile = () => {
  if (typeof window === 'undefined') return
  isMobile.value = window.innerWidth < 768
}

const previousTitle = document.title

onMounted(() => {
  document.title = 'Kontakt'

  const hour = new Date().getHours()
  isNight.value = hour >= 20 || hour < 6

  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})

onBeforeUnmount(() => {
  document.title = previousTitle
  window.removeEventListener('resize', updateIsMobile)
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
  background: #000;
  z-index: 0;
  overflow: hidden;
}

/* nachts statt Bild ein cover-Hintergrund */
.contact-screen.is-night {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* Tagesbild */
.posterImage {
  position: absolute;
  top: 0;
  left: 0;

  width: 100%;
  height: 100%;

  object-fit: cover;
  z-index: 0;
  pointer-events: none;
}

/* Dunkles Overlay */
.overlay {
  position: absolute;
  top: 0;
  left: 0;

  width: 100%;
  height: 100%;

  background: rgba(0, 0, 0, 0.1);
  z-index: 1;
  pointer-events: none;
}

/* Content */
.content {
  position: absolute;
  top: 0;
  left: 0;

  width: 100%;
  height: 100%;

  z-index: 10;
  display: grid;
  place-items: center;
  padding: 24px;
  text-align: center;
}

/* Container für Links */
.links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Mail-Link */
.email {
  font-weight: 800;
  letter-spacing: 0.02em;
  text-decoration: none;
  color: #fff;
  font-size: clamp(28px, 6vw, 72px);
  line-height: 1.05;
}

.email:hover {
  text-decoration: underline;
}

/* Instagram-Link */
.instagram {
  font-weight: 800;
  letter-spacing: 0.02em;
  text-decoration: none;
  color: #fff;
  font-size: clamp(28px, 6vw, 72px);
  line-height: 1.05;
}

.instagram:hover {
  text-decoration: underline;
}

/* nachts: Schrift ebenfalls weiß */
.contact-screen.is-night .email,
.contact-screen.is-night .instagram {
  color: #fff;
}

.contact-screen.is-night .email:hover,
.contact-screen.is-night .instagram:hover {
  text-decoration: underline;
}
</style>