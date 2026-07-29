<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { withBase, useData } from 'vitepress'
import { useBackgroundFilter, BACKGROUND_FILTER } from '../composables/useBackgroundFilter'

const bgCover = withBase('/images/Background-cover.webp')

const nightBgDesktop = withBase('/images/bg-cover-night.webp')

const { site } = useData()
const { setSource, setCanvas, start: startFilter } = useBackgroundFilter()
const keepSourceVisible = BACKGROUND_FILTER.mode === 'none'

const isNight = ref(false)
const isMobile = ref(false)

const nightTextClass = computed(() => (isNight.value ? 'night-text' : 'day-text'))
/* Motiv fuer den Bildausschnitt: ab 20 Uhr das Nachtbild.
   Die Mobil-Varianten sind hier bewusst nicht im Spiel – der Ausschnitt ist
   auf allen Groessen querformatig, die 9:16-Fassungen wuerden beschnitten. */
const cropSrc = computed(() => (isNight.value ? nightBgDesktop : bgCover))

const updateIsMobile = () => {
  if (typeof window === 'undefined') return
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.title = 'Über mich | Leon Albers'

    if (!document.getElementById('ld-person')) {
      const script = document.createElement('script')
      script.id = 'ld-person'
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Leon Albers',
        url: 'https://leonsideas.github.io/my-portfolio/',
        jobTitle: 'Gestalter in Digitalen Medien',
        worksFor: { '@type': 'Organization', name: 'manymany motion GmbH' },
        alumniOf: { '@type': 'EducationalOrganization', name: 'Hochschule für Künste Bremen' },
        sameAs: ['https://www.instagram.com/leonsideas'],
      })
      document.head.appendChild(script)
    }
  }

  const hour = new Date().getHours()
  isNight.value = hour >= 20 || hour < 6

  startFilter()
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})
</script>

<script lang="ts">
export default {
  name: 'AboutPage',
}
</script>

<template>
  <div class="relative overflow-hidden aboutpage-root">
    <div class="page-crop filtered-crop" aria-hidden="true">
      <img
        :ref="el => setSource(0, el)"
        :src="cropSrc"
        class="filtered-crop__source"
        :class="{ 'is-visible-source': keepSourceVisible }"
        alt=""
      />
      <canvas
        :ref="el => setCanvas(0, el)"
        class="filtered-crop__canvas"
      />
    </div>

    <div
      class="relative z-10 isolate px-5 sm:px-6
             h-[100dvh] overflow-hidden
             flex items-center justify-center py-20"
    >
      <div class="w-full max-w-6xl">
        <div class="flex justify-center">
          <aside
            class="cv-panel"
            :class="nightTextClass"
            aria-label="Lebenslauf"
          >
            <div class="space-y-3 sm:space-y-8">
              <section>
                <h2 class="about-heading text-left mb-3 sm:mb-6">CV</h2>
              </section>

              <section class="space-y-2 sm:space-y-3">
                <h3 class="text-sm sm:text-lg font-semibold">Ausbildung</h3>
                <ul class="space-y-2 sm:space-y-3 text-[13px] sm:text-base leading-snug sm:leading-relaxed">
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

              <section class="space-y-2 sm:space-y-3">
                <h3 class="text-sm sm:text-lg font-semibold">Berufserfahrung</h3>
                <ul class="space-y-2 sm:space-y-3 text-[13px] sm:text-base leading-snug sm:leading-relaxed">
                  <li>
                    <div class="font-medium">
                      manymany motion GmbH — Motion Designer
                    </div>
                    <div class="opacity-80">Seit 2021</div>
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
.about-heading {
  font-family: var(--font-heading, "Playfair Display"), Georgia, serif;
  font-weight: 600;
  font-style: italic;
  font-size: clamp(2rem, 7vw, 3.75rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
  padding-top: 0.1em;
}

.intro-panel,
.cv-panel {
  -webkit-overflow-scrolling: touch;
}

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

@media (max-width: 767px) {
  .intro-panel,
  .cv-panel {
    max-height: none;
    overflow: hidden;
  }
}

.aboutpage-root {
  background: var(--page-bg);
  color: var(--brand-red);
  /* kein Body-Scroll auf der Über-mich-Seite – außerhalb des Layout-Wrappers fixieren */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100dvh;
  overflow: hidden;
}

@media (min-width: 768px) {
  .cv-panel {
    padding-right: 0.75rem;
  }
}

.cv-panel::-webkit-scrollbar,
.intro-panel::-webkit-scrollbar {
  width: 10px;
}

.cv-panel::-webkit-scrollbar-thumb,
.intro-panel::-webkit-scrollbar-thumb {
  background: rgba(20, 16, 14, 0.2);
  border-radius: 999px;
  border: 3px solid rgba(0, 0, 0, 0);
  background-clip: padding-box;
}

/* Wie auf der Startseite: heller Grund, rote Schrift, kein Blend.
   Tag und Nacht sehen hier gleich aus – der Wechsel haengt am Motiv, und
   das gibt es auf dieser Seite nicht mehr. */
.day-text,
.night-text {
  color: var(--brand-red);
}
</style>
