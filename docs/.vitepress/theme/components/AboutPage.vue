<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { withBase, useData } from 'vitepress'

// Zustände für Text-Einblendung
const showText = ref(false)
let textTimer: number | undefined

const startTextFade = () => {
  if (showText.value) return
  if (textTimer) return
  textTimer = window.setTimeout(() => {
    showText.value = true
  }, 0)
}

const bgCover = withBase('/images/Background-cover.jpg')
const bgCoverMobile = withBase('/images/Background-cover_mobile.jpg')

const { site } = useData()

const isNight = ref(false)
const isMobile = ref(false)
const nightBgSrc = withBase('/images/bg-cover-night.png')

const nightTextClass = computed(() => (isNight.value ? 'night-text' : 'day-text'))
const currentBgCover = computed(() => (isMobile.value ? bgCoverMobile : bgCover))

const updateIsMobile = () => {
  if (typeof window === 'undefined') return
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  // Globalen Site-Titel NICHT überschreiben, nur Tab-Titel setzen
  if (typeof document !== 'undefined') {
    document.title = 'Über mich | Leon Albers'
  }

  const hour = new Date().getHours()
  isNight.value = hour >= 20 || hour < 6

  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)

  startTextFade()
})

onBeforeUnmount(() => {
  if (textTimer) window.clearTimeout(textTimer)
  window.removeEventListener('resize', updateIsMobile)
})
</script>

<script lang="ts">
export default {
  name: 'AboutPage',
}
</script>

<template>
  <!-- Abstand nach unten von der NavBar: 4rem (passt zu Layout) -->
  <div class="relative overflow-hidden bg-black">
    <!-- Hintergrund-Layer -->
    <div class="fixed inset-0 w-screen h-screen overflow-hidden">
      <!-- Nacht: fixes Cover-Background -->
      <div
        v-if="isNight"
        class="absolute inset-0 bg-cover bg-center bg-no-repeat"
        :style="{ backgroundImage: `url(${nightBgSrc})` }"
        aria-hidden="true"
      />

      <!-- Tag: Desktop/Mobile Bild -->
      <img
        v-else
        :src="currentBgCover"
        alt="Background Cover"
        class="absolute inset-0 w-full h-full object-cover"
      />
    </div>

    <!-- Vordergrund-Content: auf Mobile scrollbar, auf Desktop fixierte Höhe -->
    <div
      class="relative z-10 isolate px-6
             min-h-screen
             flex items-start justify-center pt-32 sm:pt-40 md:pt-48 pb-10"
    >
      <div class="w-full max-w-6xl">
        <!-- 2-Spalten Layout -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">

          <!-- Links: Intro – auf Desktop eigener Scroll-Container -->
          <div class="intro-panel text-white mix-blend-difference" :class="nightTextClass">
            <h1
              class="text-left text-2xl sm:text-3xl md:text-4xl font-semibold mb-6"
            >
              Über mich
            </h1>
            <p
              :class="[
                'text-left text-sm sm:text-base md:text-lg leading-relaxed transition-opacity duration-[5000ms] ease-out',
                showText ? 'opacity-100' : 'opacity-0',
              ]"
            >
              Moin, ich bin Leon, 27 Jahre alt und Gestalter aus Bremen.<br />
              Aktuell arbeite ich im Bereich Motion Design &amp; Grafik bei der manymany motion GmbH und studiere im fünften Semester Digitale Medien (B.A.) an der Hochschule für Künste Bremen.
              Bevor’s ins Studium ging, habe ich eine Ausbildung zum Mediengestalter für Konzeption und Visualisierung gemacht.
              Was mich antreibt? Viel Bewegen. Mit ganz neuen Ideen, Geschichten und immer neuen Wegen.
            </p>
          </div>

          <!-- Rechts: Scrollbares CV -->
          <aside
            class="cv-panel text-white mix-blend-difference"
            :class="[nightTextClass, showText ? 'opacity-100' : 'opacity-0']"
            aria-label="Lebenslauf"
          >
            <div class="space-y-8">
              <section>
                <h2 class="text-lg sm:text-xl md:text-2xl font-semibold">CV</h2>
              </section>

              <section class="space-y-3">
                <h3 class="text-base sm:text-lg font-semibold">Erfahrung</h3>
                <ul class="space-y-3 text-sm sm:text-base leading-relaxed">
                  <li>
                    <div class="font-medium">
                      manymany motion GmbH — Motion Design &amp; Grafik
                    </div>
                    <div class="opacity-80">Seit 2021 · Bremen</div>
                  </li>
                  <!-- ...weitere Stationen... -->
                </ul>
              </section>

              <section class="space-y-3">
                <h3 class="text-base sm:text-lg font-semibold">Ausbildung</h3>
                <ul class="space-y-3 text-sm sm:text-base leading-relaxed">
                  <li>
                    <div class="font-medium">
                      HfK Bremen — Digitale Medien (B.A.)
                    </div>
                    <div class="opacity-80">Seit 2023 · 5. Semester</div>
                  </li>
                  <li>
                    <div class="font-medium">
                      Ausbildung — Mediengestalter (Konzeption &amp; Visualisierung)
                    </div>
                    <div class="opacity-80">2018–2021</div>
                  </li>
                </ul>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* ...existing code (html, body, #app, .VPApp etc.)... */

/* Gemeinsame Basis für beide Panels */
.intro-panel,
.cv-panel {
  -webkit-overflow-scrolling: touch;
  transition: opacity 5000ms ease-out;
}

/* Auf Desktop: beide Spalten unabhängig scrollbar, feste Höhe */
@media (min-width: 768px) {
  .intro-panel,
  .cv-panel {
    max-height: calc(100vh - 10rem);
    overflow-y: auto;
  }

  .intro-panel {
    padding-right: 0.75rem;
  }
}

/* Auf Mobile: kein eigener Scroll-Container, natürlicher Seitenfluss */
@media (max-width: 767px) {
  .intro-panel,
  .cv-panel {
    max-height: none;
    overflow-y: visible;
  }
}

.cv-panel {
  max-height: calc(100vh - 10rem); /* ggf. an dein Padding anpassen */
  overflow-y: auto;
  padding-right: 0.75rem;
  transition: opacity 5000ms ease-out;
  -webkit-overflow-scrolling: touch;
}

.cv-panel::-webkit-scrollbar,
.intro-panel::-webkit-scrollbar {
  width: 10px;
}

.cv-panel::-webkit-scrollbar-thumb,
.intro-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  border: 3px solid rgba(0, 0, 0, 0);
  background-clip: padding-box;
}

.day-text {
  color: #fff;
  mix-blend-mode: difference;
}

.night-text {
  color: #fff;
  mix-blend-mode: normal;
}
</style>