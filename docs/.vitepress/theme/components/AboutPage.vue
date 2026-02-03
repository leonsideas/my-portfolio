<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'

// Hintergrund: erst Video, dann Bild
const showVideoBg = ref(true)

const handleVideoEnded = () => {
  showVideoBg.value = false
}

const handleVideoError = () => {
  showVideoBg.value = false
}

// Timeout entfernt, damit das Video nicht vorzeitig ausgeblendet wird

const showText = ref(false)
let textTimer: number | undefined

const startTextFade = () => {
  if (showText.value) return
  if (textTimer) return
  textTimer = window.setTimeout(() => {
    showText.value = true
  }, 0) // Fade startet sofort, Dauer steuert die CSS-Transition (5000ms)
}

const bgPoster = withBase('/images/background-fallback.jpg')
const bgVideo = withBase('/videos/background.mp4')

onMounted(() => {
  // Fallback: falls Video nicht spielt (z.B. direkt Bild), starte Fade trotzdem
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
      <!-- Video-Hintergrund -->
      <video
        v-if="showVideoBg"
        class="absolute inset-0 w-full h-full object-cover"
        autoplay
        muted
        playsinline
        :poster="bgPoster"
        @play="startTextFade"
        @ended="handleVideoEnded"
        @error="() => { handleVideoError(); startTextFade() }"
      >
        <source :src="bgVideo" type="video/mp4" />
      </video>

      <!-- Fallback-Bild im Fullscreen -->
      <img
        v-else
        :src="bgPoster"
        alt="Hintergrundbild"
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

              <section class="space-y-3">
                <h3 class="text-base sm:text-lg font-semibold">Skills</h3>
                <ul class="space-y-2 text-sm sm:text-base leading-relaxed">
                  <li>Motion Design · After Effects · Premiere</li>
                  <li>Design · Layout · Typografie</li>
                  <li>3D/Tools · …</li>
                  <!-- ... -->
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
