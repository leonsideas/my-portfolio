<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  document.title = 'Über mich & CV | Leon Albers'
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
              Ich bin Leon Albers und studiere Digitale Medien an der HfK Bremen.
              Als Creative Designer entwickle ich Ideen und Geschichten und suche
              für jede die passende Form – zum Beispiel als Film, interaktive Arbeit
              oder mit Code und KI.
            </p>
          </div>
        </header>

        <section class="education" aria-labelledby="education-title">
          <h2 id="education-title">Ausbildung</h2>
          <div class="about-entry">
            <h3>HfK Bremen — Digitale Medien (B.A.)</h3>
            <p>Seit 2023</p>
          </div>
          <div class="about-entry">
            <h3>Mediengestalter — Konzeption &amp; Visualisierung</h3>
            <p>Ausbildung, 2018–2021</p>
          </div>
        </section>

        <section class="experience" aria-labelledby="experience-title">
          <h2 id="experience-title">Berufserfahrung</h2>
          <div class="about-entry">
            <h3>manymany motion GmbH — Motion Designer</h3>
            <p>Seit 2021</p>
          </div>
        </section>

        <section class="exhibitions" aria-labelledby="exhibitions-title">
          <h2 id="exhibitions-title">Exhibitions</h2>
          <div class="about-entry">
            <h3>REEFRESH – MAYBE NEXT TIME</h3>
            <p>November 2026 · Barcelona · bevorstehend</p>
            <p>
              <a href="https://www.9isdsc.csic.es/binomials/" target="_blank" rel="noopener noreferrer">BINOMIALS</a>
              — Gruppenausstellung im Rahmen des 9th International Symposium on Deep-Sea Corals.
            </p>
          </div>
          <div class="about-entry">
            <h3>Local Dreamer</h3>
            <p>2019 · Nordenham · Einzelausstellung</p>
            <p>Gezeigt wurden vor allem Gemälde auf Leinwand, Fotografien und grafisch bearbeitete Arbeiten.</p>
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
  background: #000;
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
  padding: clamp(76px, 10vh, 100px) clamp(20px, 6vw, 48px) clamp(48px, 7vh, 72px);
  overflow-y: auto;
}

.about-card {
  width: min(760px, 82vw);
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
  font-size: clamp(0.8rem, 1.15vw, 0.95rem);
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
    padding-top: clamp(72px, 9vh, 88px);
    padding-bottom: clamp(40px, 6vh, 56px);
  }

  .about-card {
    width: 90vw;
  }

  .about-copy {
    gap: 0.55rem;
    margin-top: 0.9rem;
  }

  .about-copy p,
  .about-entry h3,
  .about-entry p {
    font-size: clamp(0.66rem, 2.8vw, 0.82rem);
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
