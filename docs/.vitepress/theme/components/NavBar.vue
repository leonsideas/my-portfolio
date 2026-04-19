<script setup lang="ts">
  import { withBase } from 'vitepress'
  
  const items = [
    { text: 'Home', link: '/', isHome: true },
    { text: 'Über mich', link: '/uebermich', class: 'nav-item--about', isAbout: true },
    { text: 'Kontakt', link: '/kontakt' },
  ]
</script>

<template>
  <header class="my-nav">
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
              class="nav-pill nav-link-font"
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

  /* Auf Projektseiten: fest am oberen Rand, optisch unsichtbar
     (übernimmt den gleichen Hintergrund wie die Projektseite),
     damit der scrollende Inhalt hinter der Nav verschwindet */
  .my-nav.is-workpage {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-image: var(--workpage-bg-image);
    background-attachment: fixed;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }
  
  .my-nav__inner {
    display: flex;
    width: 100%;
    align-items: center;
    padding: 0.75rem 1rem;
    background: transparent;
  }

  .my-nav__list {
    display: flex;
    width: 100%;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: nowrap;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .my-nav__item {
    flex: 1 1 0;
    text-align: center;
    display: flex;
    justify-content: center;
  }

  .nav-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 0.4rem 0.5rem;
    border-radius: 9999px;

    border: 1px solid rgba(255, 255, 255, 0.95);
    background: transparent;
    color: rgba(255, 255, 255, 1);

    text-transform: uppercase;
    letter-spacing: 0.18em;

    transition: border-color 200ms ease, color 200ms ease;

    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    white-space: normal; /* mobile friendly */
    font-size: 0.7rem;
  }

  .nav-pill:hover {
    border-color: rgba(255, 255, 255, 1);
    color: rgba(255, 255, 255, 1);
  }

  /* Desktop ONLY */
  @media (min-width: 1024px) {
    .my-nav__inner {
      padding-left: 2rem;
      padding-right: 2rem;
    }

    .my-nav__list {
      justify-content: center;
      gap: 1.5rem;
    }

    .my-nav__item {
      flex: 0;
      display: block;
      justify-content: initial;
    }

    .nav-pill {
      width: auto;
      white-space: nowrap;
      padding: 0.4rem 0.9rem;
      font-size: 0.875rem;
      letter-spacing: 0.25em;
    }
  }

  /* Überschriften global weiß setzen (trotz scoped) */
  :global(h1, h2, h3, h4, h5, h6) {
    color: rgba(255, 255, 255, 1);
  }

  :global(h1 a, h2 a, h3 a, h4 a, h5 a, h6 a) {
    color: rgba(255, 255, 255, 1);
  }
</style>
