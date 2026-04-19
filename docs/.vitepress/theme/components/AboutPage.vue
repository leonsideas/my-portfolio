<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { withBase, useData } from 'vitepress'

const bgCover = withBase('/images/Background-cover.webp')
const bgCoverMobile = withBase('/images/Background-cover_mobile.webp')

const nightBgDesktop = withBase('/images/bg-cover-night.webp')
const nightBgMobile = withBase('/images/bg-cover-night-mobil.webp')

const { site } = useData()

const isNight = ref(false)
const isMobile = ref(false)

const nightTextClass = computed(() => (isNight.value ? 'night-text' : 'day-text'))
const currentBgCover = computed(() => (isMobile.value ? bgCoverMobile : bgCover))
const currentNightBg = computed(() => (isMobile.value ? nightBgMobile : nightBgDesktop))

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
  <div class="relative overflow-hidden bg-black aboutpage-root">
    <div class="fixed inset-0 overflow-hidden">
      <div
        v-if="isNight"
        class="absolute inset-0 bg-cover bg-center bg-no-repeat"
        :style="{ backgroundImage: `url(${currentNightBg})` }"
        aria-hidden="true"
      />

      <img
        v-else
        :src="currentBgCover"
        alt="Background Cover"
        class="absolute inset-0 w-full h-full object-cover"
      />
    </div>

    <div
      class="relative z-10 isolate px-5 sm:px-6
             h-[100dvh] overflow-hidden
             flex items-start justify-center pt-20 sm:pt-40 md:pt-48 pb-6 sm:pb-10"
    >
      <div class="w-full max-w-6xl">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-10 md:gap-14 items-start">
          <div class="intro-panel text-white mix-blend-difference" :class="nightTextClass">
            <h1
              class="about-heading text-left mb-3 sm:mb-6"
            >
              Über mich
            </h1>
            <p class="text-left text-[13px] sm:text-base md:text-lg leading-snug sm:leading-relaxed">
              Moin, ich bin Leon, 27 Jahre alt und Gestalter aus Bremen.<br />
              Aktuell arbeite ich im Bereich Motion Design &amp; Grafik bei der manymany motion GmbH und studiere im fünften Semester Digitale Medien (B.A.) an der Hochschule für Künste Bremen.
              Bevor’s ins Studium ging, habe ich eine Ausbildung zum Mediengestalter für Konzeption und Visualisierung gemacht.
              Was mich antreibt? Viel Bewegen. Mit ganz neuen Ideen, Geschichten und immer neuen Wegen.
            </p>
          </div>

          <aside
            class="cv-panel text-white mix-blend-difference"
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
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow: 0 1px 24px rgba(0, 0, 0, 0.5);
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
  background: rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  border: 3px solid rgba(0, 0, 0, 0);
  background-clip: padding-box;
}

.day-text {
  color: #fff;
  mix-blend-mode: difference;
  text-shadow: 0 1px 16px rgba(0, 0, 0, 0.35);
}

.night-text {
  color: #fff;
  mix-blend-mode: normal;
  text-shadow: 0 1px 16px rgba(0, 0, 0, 0.35);
}
</style>