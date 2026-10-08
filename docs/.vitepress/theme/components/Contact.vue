<template>
  <section class="contact-screen" aria-label="Kontakt">
    <div class="contact-cutout" aria-hidden="true">
      <img :src="kontaktCutout" alt="" />
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
import { onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'

const kontaktCutout = withBase('/images/kontakt-leon-schafe-cutout-red.webp')

const previousTitle = typeof document !== 'undefined' ? document.title : ''

onMounted(() => {
  document.title = 'Kontakt'
})

onBeforeUnmount(() => {
  document.title = previousTitle
})
</script>

<style scoped>
.contact-screen {
  position: fixed;
  inset: 0;
  margin: 0;
  padding: 0;
  /* Schwarzer Grund auf der gesamten Website, rote Schrift, kein Motiv */
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
  justify-content: flex-start;
  padding: clamp(178px, 28vh, 250px) clamp(20px, 6vw, 48px) 32vh;
  text-align: center;
}

.contact-cutout {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: min(72vw, 960px);
  z-index: 1;
  pointer-events: none;
  transform: translateX(-50%);
}

.contact-cutout img {
  display: block;
  width: 100%;
  height: auto;
}

.contact-heading {
  margin: 0;
  font-family: var(--font-heading, "Playfair Display"), Georgia, serif;
  font-weight: 600;
  font-style: italic;
  font-size: clamp(3.25rem, 13vw, 6.25rem);
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

@media (max-width: 767px) {
  .contact-content {
    padding-top: clamp(158px, 24vh, 210px);
  }

  .contact-cutout {
    width: 92vw;
  }
}
</style>
