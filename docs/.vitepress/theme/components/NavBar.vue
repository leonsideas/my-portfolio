<script setup lang="ts">
  import { withBase } from 'vitepress'
  
  const items = [
    { text: 'Home', link: '/', isHome: true },
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

  @media (min-width: 1024px) {
    .my-nav__list {
      justify-content: center;
      gap: 1.5rem;
    }

    .my-nav__item {
      flex: 0;
    }

    .nav-pill {
      width: auto;
    }
  }

  .nav-link-font {
    font-size: 0.875rem;
    font-weight: 500;
  }
  
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

    white-space: nowrap;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  /* 🔹 Mobile – Layout sauber begrenzen */
  @media (max-width: 639px) {
    .my-nav__inner {
      padding-inline: 0.75rem;
    }

    .my-nav__list {
      width: 100%;
      justify-content: center;
      gap: 0.5rem;
      flex-wrap: nowrap;
    }

    .my-nav__item {
      flex: 1 1 0;
      display: flex;
      justify-content: center;
    }

    .nav-pill {
      max-width: 100%;
      white-space: normal;
      padding: 0.4rem 0.5rem;
      font-size: 0.7rem;
      letter-spacing: 0.18em;
    }
  }

  .nav-pill:hover {
    border-color: rgba(255, 255, 255, 1);
    color: rgba(255, 255, 255, 1);
  }

  .nav-blend {
    mix-blend-mode: difference;
  }
</style>
