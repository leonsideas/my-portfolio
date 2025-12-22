<script setup lang="ts">
import { useData, withBase } from 'vitepress'

const { theme } = useData()

const items = [
  { text: 'Leon Albers', link: '/' },
  { text: 'About', link: '/about' },
  { text: 'Contact', link: '/contact' },
]
</script>

<template>
  <!-- immer transparente NavBar, Hintergrund kommt von der Seite selbst -->
  <header
    class="
      sticky top-0 z-30 w-full text-black pointer-events-auto
      /* bg-transparent entfernt, wir regeln es im CSS hart */
    "
  >
    <nav
      class="flex w-full items-center px-4 py-3 sm:px-6 lg:px-8"
      style="background: none !important;"
    >
      <ul class="flex w-full justify-between text-sm font-medium gap-0">
        <li
          v-for="item in items"
          :key="item.link"
          class="flex-1 text-center"
        >
          <a
            :href="withBase(item.link)"
            class="nav-pill nav-link-font"
          >
            {{ item.text }}
          </a>
        </li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
/* ...existing styles... */

/* Sicherstellen, dass kein Hintergrund gesetzt wird */
header {
  background: none !important;
  background-color: transparent !important;
  backdrop-filter: none !important;
}

/* Optional, falls nav selbst irgendwo überschrieben wird */
nav {
  background: none !important;
  background-color: transparent !important;
  backdrop-filter: none !important;
}

/* Wiederverwendbare Font-Klasse für NavBar-Links */
.nav-link-font {
  /* Tailwind: text-sm font-medium; falls du eine Custom-Font nutzt,
     hier z.B. font-family setzen */
  font-size: 0.875rem;
  font-weight: 500;
  /* z.B. die gleiche Font wie global, nur explizit: */
  /* font-family: var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif); */
}

/* Pill-Style: nur Kontur + schwarze Schrift (wie Carousel-Nav, aber ohne Fill) */
.nav-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0.4rem 0.9rem;
  border-radius: 9999px;

  border: 1px solid rgba(0, 0, 0, 0.55);
  background: transparent;
  color: rgba(0, 0, 0, 0.9);

  /* vorher: mix-blend-difference + uppercase/letter-spacing – je nach Geschmack lassen/entfernen */
  mix-blend-difference: normal;
  text-transform: uppercase;
  letter-spacing: 0.25em;

  transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease;
}

.nav-pill:hover {
  /* kein Fill, nur etwas stärkere Kontur */
  background: transparent;
  border-color: rgba(0, 0, 0, 1);
  color: rgba(0, 0, 0, 1);
}
</style>
