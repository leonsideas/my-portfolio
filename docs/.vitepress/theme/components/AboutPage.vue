<script setup lang="ts">
import { watchEffect } from 'vue'
import { useSiteLanguage } from '../composables/useSiteLanguage'

const { text } = useSiteLanguage()
watchEffect(() => {
  if (typeof document !== 'undefined') document.title = text('Über mich & CV', 'About & CV') + ' | Leon Albers'
})
</script>

<script lang="ts">
export default {
  name: 'AboutPage',
}
</script>

<template>
  <div class="aboutpage-root">
    <div class="about-content">
      <article class="about-card">
        <header>
          <div class="about-copy">
            <p>
              {{ text(
                'Ich bin Leon Albers und studiere Digitale Medien an der HfK Bremen. Ich liebe es, Geschichten zu erzählen und Ideen eine Form zu geben. Als Creative Designer suche ich dafür immer wieder neue Wege – mit Film, interaktiven Arbeiten, Code oder KI.',
                'I’m Leon Albers, a creative designer studying Digital Media at the University of the Arts Bremen. I love telling stories and giving ideas a form. Sometimes that means making a film, sometimes an interactive piece, or trying something with code or AI. I enjoy finding the approach that feels right for each idea.'
              ) }}
            </p>
          </div>
        </header>

        <section class="education" aria-labelledby="education-title">
          <h2 id="education-title">{{ text('Ausbildung', 'Education') }}</h2>
          <div class="about-entry">
            <h3>{{ text('HfK Bremen — Digitale Medien (B.A.)', 'University of the Arts Bremen — Digital Media (B.A.)') }}</h3>
            <p>{{ text('Seit 2023', 'Since 2023') }}</p>
          </div>
          <div class="about-entry">
            <h3>{{ text('Mediengestalter — Konzeption & Visualisierung', 'Media Design — Concept & Visualisation') }}</h3>
            <p>{{ text('Ausbildung, 2018–2021', 'Vocational training, 2018–2021') }}</p>
          </div>
        </section>

        <section class="experience" aria-labelledby="experience-title">
          <h2 id="experience-title">{{ text('Berufserfahrung', 'Experience') }}</h2>
          <div class="about-entry">
            <h3>manymany motion GmbH — Motion Designer</h3>
            <p>{{ text('Seit 2021', 'Since 2021') }}</p>
          </div>
        </section>

        <section class="exhibitions" aria-labelledby="exhibitions-title">
          <h2 id="exhibitions-title">Exhibitions</h2>
          <div class="about-entry">
            <h3>
              <a href="https://www.9isdsc.csic.es/binomials/" target="_blank" rel="noopener noreferrer">BINOMIALS</a>
            </h3>
            <p>{{ text('November 2026 · Barcelona · bevorstehend', 'November 2026 · Barcelona · upcoming') }}</p>
            <p>{{ text('Gruppenausstellung im Rahmen des 9th International Symposium on Deep-Sea Corals.', 'Group exhibition as part of the 9th International Symposium on Deep-Sea Corals.') }}</p>
            <p>{{ text('Mein Beitrag:', 'My contribution:') }} REEFRESH – MAYBE NEXT TIME.</p>
          </div>
          <div class="about-entry">
            <h3>Local Dreamer</h3>
            <p>{{ text('2019 · Nordenham · Einzelausstellung', '2019 · Nordenham · solo exhibition') }}</p>
            <p>{{ text('Gezeigt wurden vor allem Gemälde auf Leinwand, Fotografien und grafisch bearbeitete Arbeiten.', 'Featuring paintings on canvas, photography and digitally altered works.') }}</p>
          </div>
        </section>
      </article>
    </div>
  </div>
</template>

<style scoped>
.aboutpage-root {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: var(--page-bg);
  color: var(--brand-red);
}

.about-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: clamp(76px, calc(10 * var(--site-vh)), 100px) clamp(20px, calc(6 * var(--site-vw)), 48px) clamp(48px, calc(7 * var(--site-vh)), 72px);
  overflow-y: auto;
}

.about-card {
  width: min(760px, calc(82 * var(--site-vw)));
  text-align: left;
}

.about-copy {
  display: grid;
  gap: 0.8rem;
  margin-top: 1rem;
}

.about-copy p,
.about-entry h3,
.about-entry p {
  font-size: clamp(0.8rem, calc(1.15 * var(--site-vw)), 0.95rem);
  line-height: 1.35;
}

.about-copy p {
  margin: 0;
}

.education,
.experience,
.exhibitions {
  margin-top: 0.8rem;
  padding-top: 0.4rem;
}

.education h2,
.experience h2,
.exhibitions h2 {
  margin: 0 0 0.65rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.about-entry h3 {
  margin: 0;
  font-weight: 650;
}

.about-entry + .about-entry {
  margin-top: 0.65rem;
}

.about-entry p {
  margin: 0.1rem 0 0;
  opacity: 0.78;
}

.about-entry a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.about-entry a:hover,
.about-entry a:focus-visible {
  color: var(--cream, #f2efe9);
}

@media (max-width: 767px) {
  .about-content {
    padding-top: clamp(72px, calc(9 * var(--site-vh)), 88px);
    padding-bottom: clamp(40px, calc(6 * var(--site-vh)), 56px);
  }

  .about-card {
    width: calc(90 * var(--site-vw));
  }

  .about-copy {
    gap: 0.55rem;
    margin-top: 0.9rem;
  }

  .about-copy p,
  .about-entry h3,
  .about-entry p {
    font-size: clamp(0.66rem, calc(2.8 * var(--site-vw)), 0.82rem);
    line-height: 1.25;
  }

  .education {
    margin-top: 0.65rem;
    padding-top: 0.4rem;
  }

  .experience,
  .exhibitions {
    margin-top: 0.55rem;
    padding-top: 0;
  }

  .education h2,
  .experience h2,
  .exhibitions h2 {
    margin-bottom: 0.65rem;
    font-size: 0.62rem;
  }
}
</style>
