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
        <p
          :class="[
            'text-black mix-blend-difference text-left text-lg sm:text-xl md:text-2xl leading-relaxed transition-opacity duration-[5000ms] ease-out',
            showText ? 'opacity-100' : 'opacity-0',
          ]"
        >
          Moin, ich bin Leon, 27 Jahre alt und Gestalter aus Bremen.<br />
          Aktuell arbeite ich im Bereich Motion Design &amp; Grafik bei der manymany motion GmbH und studiere im fünften Semester Digitale Medien (B.A.) an der Hochschule für Künste Bremen.
          Bevor’s ins Studium ging, habe ich eine Ausbildung zum Mediengestalter für Konzeption und Visualisierung gemacht.
          Was mich antreibt? Viel Bewegen. Mit ganz neuen Ideen, Geschichten und immer neuen Wegen.
        </p>
      </div>
    </div>
  </div>
</template>

<style>
/* Scrollen global deaktivieren (VitePress Root + Dokument) */
html,
body,
#app,
.VPApp {
  height: 100%;
  overflow: hidden;
}

/* Optional: verhindert „Scroll-Gesten“ auf Touch/Trackpad innerhalb der Seite */
body {
  overscroll-behavior: none;
}
</style>
