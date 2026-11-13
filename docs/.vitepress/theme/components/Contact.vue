<template>
  <section class="contact-screen" :aria-label="text('Kontakt', 'Contact')">
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
    <div class="contact-content">
      <h1 class="contact-heading">
        <a
          class="contact-heading-link"
          href="mailto:leon-albers@web.de"
          :aria-label="text('E-Mail an leon-albers@web.de schreiben', 'Email leon-albers@web.de')"
        >
          Moin
        </a>
      </h1>
      <div class="contact-cutout" aria-hidden="true">
        <img :src="kontaktCutout" alt="" width="1672" height="941" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { watchEffect, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'
import { useSiteLanguage } from '../composables/useSiteLanguage'

const { text } = useSiteLanguage()

const kontaktCutout = withBase('/images/kontakt-leon-schafe-cutout-red.webp')

const previousTitle = typeof document !== 'undefined' ? document.title : ''

watchEffect(() => {
  if (typeof document !== 'undefined') document.title = text('Kontakt', 'Contact') + ' | Leon Albers'
})

onBeforeUnmount(() => {
  document.title = previousTitle
})
</script>

<style scoped>
.contact-screen {
  --contact-image-width: min(calc(72 * var(--site-vw)), 960px, calc((100 * var(--site-vh) - 300px) * 2.38857));
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
  justify-content: center;
  gap: clamp(4px, calc(1 * var(--site-vh)), 12px);
  padding: clamp(100px, calc(14 * var(--site-vh)), 128px) clamp(20px, calc(6 * var(--site-vw)), 48px) max(76px, calc(env(safe-area-inset-bottom) + 64px));
  text-align: center;
}

.contact-cutout {
  flex: 0 0 auto;
  width: var(--contact-image-width);
  max-width: 100%;
  /* Der Ausschnitt entfernt nur den transparenten Raum über der Herde. */
  aspect-ratio: 1672 / 700;
  overflow: hidden;
  pointer-events: none;
}

.contact-cutout img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center bottom;
  filter: url(#contact-royal-purple);
}

.contact-heading {
  flex: 0 0 auto;
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
  .contact-screen {
    --contact-image-width: min(calc(92 * var(--site-vw)), calc((100 * var(--site-vh) - 300px) * 2.38857));
  }
}
</style>
