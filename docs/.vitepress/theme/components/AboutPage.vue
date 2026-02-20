<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { withBase, useData } from 'vitepress'

// Zustände für die Hintergründe
const sheepVisible = ref(true)        // zuerst Sheep.jpg
const showVideoBg = ref(false)        // Video sichtbar, wenn es läuft
const showFallbackBg = ref(false)     // Fallback nach Ende des Videos
const videoLoaded = ref(false)

const handleVideoCanPlay = () => {
  videoLoaded.value = true
}

const handleVideoPlay = () => {
  // Video startet:
  sheepVisible.value = false          // Sheep ausblenden
  showFallbackBg.value = false
  showVideoBg.value = true           // Video zeigen (ohne Fade)
  startTextFade()
}

const handleVideoEnded = () => {
  // Video fertig:
  showVideoBg.value = false
  showFallbackBg.value = true        // Fallback anzeigen
}

const handleVideoError = () => {
  // Video konnte nicht geladen werden:
  videoLoaded.value = false
  showVideoBg.value = false
  showFallbackBg.value = false       // kein Fallback, Sheep bleibt
  sheepVisible.value = true
  startTextFade()
}

// Timeout entfernt, damit das Video nicht vorzeitig ausgeblendet wird
const showText = ref(false)
let textTimer: number | undefined

const startTextFade = () => {
  if (showText.value) return
  if (textTimer) return
  textTimer = window.setTimeout(() => {
    showText.value = true
  }, 0)
}

const bgSheep = withBase('/images/Sheep.jpg')                   // immer zuerst
const bgFallback = withBase('/images/background-fallback.jpg')  // nach Videoende
const bgVideo = withBase('/videos/background.mp4')

const { site } = useData()

onMounted(() => {
  // Globalen Site-Titel NICHT überschreiben, nur Tab-Titel setzen
  if (typeof document !== 'undefined') {
    document.title = 'Uebermich'
  }

  // Fallback: falls Video nie startet, Text trotzdem einblenden
  if (!showVideoBg.value) startTextFade()
})

onBeforeUnmount(() => {
  if (textTimer) window.clearTimeout(textTimer)
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
      <!-- Video-Hintergrund: immer im DOM, aber OHNE Fade/Transition -->
      <video
        class="absolute inset-0 w-full h-full object-cover"
        :class="showVideoBg ? 'opacity-100' : 'opacity-0'"
        autoplay
        muted
        playsinline
        :poster="bgSheep"
        @canplay="handleVideoCanPlay"
        @play="handleVideoPlay"
        @ended="handleVideoEnded"
        @error="handleVideoError"
      >
        <source :src="bgVideo" type="video/mp4" />
      </video>

      <!-- 1. Sheep.jpg – immer zuerst, und bei Fehler -->
      <img
        v-if="sheepVisible"
        :src="bgSheep"
        alt="Sheep Hintergrundbild"
        class="absolute inset-0 w-full h-full object-cover"
      />

      <!-- 2. Fallback-Bild NUR nach dem Videoende -->
      <img
        v-else-if="showFallbackBg"
        :src="bgFallback"
        alt="Fallback Hintergrundbild"
        class="absolute inset-0 w-full h-full object-cover"
      />
    </div>

    <!-- Vordergrund-Content -->
    <div
      class="relative z-10 h-screen overflow-hidden px-6 isolate
           flex items-start justify-center pt-32 sm:pt-40 md:pt-48"
    >
      <div class="w-full max-w-6xl">
        <!-- NEU: 2-Spalten Layout -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">
          <!-- Links: Intro -->
          <div>
            <h1
              class="text-black mix-blend-difference text-left text-2xl sm:text-3xl md:text-4xl font-semibold mb-6"
            >
              Über mich
            </h1>
            <p
              :class="[
                'text-black mix-blend-difference text-left text-sm sm:text-base md:text-lg leading-relaxed transition-opacity duration-[5000ms] ease-out',
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
            class="cv-panel text-black mix-blend-difference"
            :class="[showText ? 'opacity-100' : 'opacity-0']"
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

/* Rechtes Panel: eigener Scrollcontainer (nur hier scrollen) */
.cv-panel {
  max-height: calc(100vh - 10rem); /* ggf. an dein Padding anpassen */
  overflow-y: auto;
  padding-right: 0.75rem;
  transition: opacity 5000ms ease-out;
  -webkit-overflow-scrolling: touch;
  border-left: 1px solid rgba(255, 255, 255, 0.18);
  padding-left: 1.25rem;
}

.cv-panel::-webkit-scrollbar {
  width: 10px;
}
.cv-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  border: 3px solid rgba(0, 0, 0, 0);
  background-clip: padding-box;
}
</style>
