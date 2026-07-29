<template>
  <section class="contact-screen" aria-label="Kontakt">
    <div class="page-crop filtered-crop" aria-hidden="true">
      <img
        :ref="el => setSource(0, el)"
        :src="kontaktSrc"
        class="filtered-crop__source"
        :class="{ 'is-visible-source': keepSourceVisible }"
        alt=""
      />
      <canvas
        :ref="el => setCanvas(0, el)"
        class="filtered-crop__canvas"
      />
    </div>

    <div class="contact-content">
      <h1 class="contact-heading">
        <a
          class="contact-heading-link"
          href="mailto:leon-albers@web.de"
          aria-label="E-Mail an leon-albers@web.de schreiben"
        >
          Moin
        </a>
      </h1>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'
import { useBackgroundFilter, BACKGROUND_FILTER } from '../composables/useBackgroundFilter'

/* Motiv fuer den Bildausschnitt: ab 20 Uhr das Nachtbild.
   Die Mobil-Varianten sind hier bewusst nicht im Spiel – der Ausschnitt ist
   auf allen Groessen querformatig, die 9:16-Fassungen wuerden beschnitten. */
const kontaktDay = withBase('/images/Kontakt.webp')
const kontaktNight = withBase('/images/background-night2.webp')

const isNight = ref(false)
const kontaktSrc = computed(() => (isNight.value ? kontaktNight : kontaktDay))
const { setSource, setCanvas, start: startFilter } = useBackgroundFilter()
const keepSourceVisible = BACKGROUND_FILTER.mode === 'none'

const updateIsNight = () => {
  if (typeof window === 'undefined') return
  const hour = new Date().getHours()
  isNight.value = hour >= 20 || hour < 6
}

let nightCheckInterval: number | undefined

const previousTitle = typeof document !== 'undefined' ? document.title : ''

onMounted(() => {
  document.title = 'Kontakt'
  updateIsNight()
  startFilter()
  nightCheckInterval = window.setInterval(updateIsNight, 60 * 1000)
})

onBeforeUnmount(() => {
  document.title = previousTitle
  if (nightCheckInterval) window.clearInterval(nightCheckInterval)
})
</script>

<style scoped>
.contact-screen {
  position: fixed;
  inset: 0;
  margin: 0;
  padding: 0;
  /* Heller Grund wie auf der Startseite, rote Schrift, kein Motiv */
  background-color: var(--page-bg);
  z-index: 0;
  overflow: hidden;
  color: var(--brand-red);
}

.contact-content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(64px, 8vh, 96px) clamp(20px, 6vw, 48px);
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
  color: var(--brand-red);
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
