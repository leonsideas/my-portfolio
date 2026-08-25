<template>
  <footer class="site-footer">
    <a :href="withBase('/rechtliches')" class="site-footer__link">Impressum</a>
    <span class="site-footer__copy">© Leon Albers {{ year }}</span>
  </footer>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'

const year = new Date().getFullYear()
</script>

<style scoped>
/*
 * Fest am unteren Rand, weil die Startseite als `fixed inset-0` den ganzen
 * Schirm einnimmt – eine mitfliessende Fussleiste laege dort ausserhalb des
 * Sichtbereichs. Der z-index muss ueber dem Seiteninhalt liegen.
 */
.site-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.25rem max(0.9rem, env(safe-area-inset-bottom));
  color: var(--brand-red);
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  pointer-events: none;
}

/* Nur die Schrift selbst soll klickbar sein, nicht die ganze Leiste –
   sonst blockiert sie den Hover auf den Titeln darueber. */
.site-footer__link,
.site-footer__copy {
  pointer-events: auto;
}

.site-footer__link {
  color: inherit;
  text-decoration: none;
}

.site-footer__link:hover,
.site-footer__link:focus-visible {
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

@media (min-width: 1024px) {
  .site-footer {
    padding-left: 2rem;
    padding-right: 2rem;
    font-size: 0.75rem;
    letter-spacing: 0.25em;
  }
}
</style>
