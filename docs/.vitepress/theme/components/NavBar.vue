<script setup lang="ts">
  import { withBase } from 'vitepress'
  
  const items = [
    { text: 'Leon Albers', link: '/', isHome: true },
    { text: 'Über mich', link: '/about', class: 'nav-item--about', isAbout: true },
    { text: 'Kontakt', link: '/contact' },
  ]
</script>

<template>
  <header class="my-nav nav-blend">
      <nav class="my-nav__inner">
        <ul class="my-nav__list">
          <li
            v-for="item in items"
            :key="item.link"
            class="my-nav__item"
            :class="item.class"
          >
            <a
              :href="withBase(item.link)"
              class="nav-pill nav-link-font nav-blend"
              :data-nav-home="item.isHome ? '1' : null"
              :data-nav-about="item.isAbout ? '1' : null"
            >
              {{ item.text }}
            </a>
          </li>
        </ul>
      </nav>
    </header>
</template>

<style scoped>
  /* Sticky + transparent by default */
  .my-nav {
    position: sticky;
    top: 0;
    z-index: 30;
    width: 100%;
    pointer-events: auto;
    background: transparent;
  }
  
  .my-nav__inner {
    display: flex;
    width: 100%;
    align-items: center;
    padding: 0.75rem 1rem;
    background: transparent;
  }
  
  @media (min-width: 640px) {
    .my-nav__inner {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }
  }
  @media (min-width: 1024px) {
    .my-nav__inner {
      padding-left: 2rem;
      padding-right: 2rem;
    }
  }
  
  .my-nav__list {
    display: flex;
    width: 100%;
    justify-content: space-between;
    gap: 0;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .my-nav__item {
    flex: 1;
    text-align: center;
  }

  /* 🔹 Neu: nur Desktop – Abstand zwischen Buttons */
  @media (min-width: 1024px) {
    .my-nav__list {
      justify-content: center;
      gap: 1.5rem; /* Abstand zwischen den Pills */
    }

    .my-nav__item {
      flex: 0; /* Items werden so breit wie ihre Pills */
    }

    .nav-pill {
      width: auto; /* Desktop: Breite nur nach Inhalt */
    }
  }

  /* Link font */
  .nav-link-font {
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  /* Default Pills: schwarz */
  .nav-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  
    padding: 0.4rem 0.9rem;
    border-radius: 9999px;
  
    border: 1px solid rgba(255, 255, 255, 0.7);
    background: transparent;
    color: rgba(255, 255, 255, 0.95);
  
    text-transform: uppercase;
    letter-spacing: 0.25em;
  
    transition: border-color 200ms ease, color 200ms ease;

    /* 🔹 Neu: überall gleiche Höhe/Breite + kein Zeilenumbruch */
    white-space: nowrap;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  /* 🔹 Neu: Mobile – alle Kästen gleiche minimale Breite/Höhe */
  @media (max-width: 639px) {
    .my-nav__item {
      display: flex;
      justify-content: center;
    }

    .nav-pill {
      min-width: 0;
      min-height: 2.5rem; /* gleiche Höhe */
    }
  }
  
  .nav-pill:hover {
    border-color: rgba(255, 255, 255, 1);
    color: rgba(255, 255, 255, 1);
  }
  
  /* ✅ NUR WorkPage: Pills weiß (Navbar-Hintergrund kommt von VitePress-CSS global) */
  /* :global(html.is-workpage) .nav-pill {
    border-color: rgba(255, 255, 255, 0.6) !important;
    color: rgba(255, 255, 255, 0.95) !important;
  }
  
  :global(html.is-workpage) .nav-pill:hover {
    border-color: rgba(255, 255, 255, 1) !important;
    color: rgba(255, 255, 255, 1) !important;
  } */

  /* NavBar soll wie Carousel-Navigation blenden */
  .nav-blend {
    mix-blend-mode: difference;
  }
</style>
