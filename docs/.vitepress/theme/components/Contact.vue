<template>
  <section class="contact-screen" aria-label="Kontakt">
    <svg class="contact-color-filter" aria-hidden="true" focusable="false">
      <defs>
        <!-- Royal Purple (19-3642 TCX, #603f83) als Mittelton; Schatten dunkler, helle Wolle als heller Lavendelton -->
        <filter id="contact-royal-purple" color-interpolation-filters="sRGB">
          <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="gray" />
          <feComponentTransfer in="gray">
            <feFuncR type="table" tableValues="0.208 0.376 0.718" />
            <feFuncG type="table" tableValues="0.137 0.247 0.663" />
            <feFuncB type="table" tableValues="0.282 0.514 0.780" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
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
  background-color: var(--page-bg);
  z-index: 0;
  overflow: hidden;
  color: var(--brand-red);
}

.contact-color-filter {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
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
  padding: clamp(178px, calc(28 * var(--site-vh)), 250px) clamp(20px, calc(6 * var(--site-vw)), 48px) calc(32 * var(--site-vh));
  text-align: center;
}

.contact-cutout {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: min(calc(72 * var(--site-vw)), 960px);
  z-index: 1;
  pointer-events: none;
  transform: translateX(-50%);
}

.contact-cutout img {
  display: block;
  width: 100%;
  height: auto;
  filter: url(#contact-royal-purple);
}

.contact-heading {
  margin: 0;
  font-family: var(--font-heading, "Playfair Display"), Georgia, serif;
  font-weight: 600;
  font-style: italic;
  font-size: clamp(3.25rem, calc(13 * var(--site-vw)), 6.25rem);
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
    padding-top: clamp(158px, calc(24 * var(--site-vh)), 210px);
  }

  .contact-cutout {
    width: calc(92 * var(--site-vw));
  }
}
</style>
