<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { useData, useRoute, withBase } from 'vitepress'

  const route = useRoute()
  const { site } = useData()
  const phrases = [
    'Hallo, ich bin Leon Albers',
    'Ich bin Creative Designer',
    'Ich liebe es, Geschichten zu erzählen',
  ]
  const typedText = ref('')

  let phraseIndex = 0
  let characterIndex = 0
  let isDeleting = false
  let typeTimer: number | undefined

  function queueTypeStep(delay: number) {
    typeTimer = window.setTimeout(typeStep, delay)
  }

  function typeStep() {
    const phrase = phrases[phraseIndex]

    if (!isDeleting) {
      characterIndex += 1
      typedText.value = phrase.slice(0, characterIndex)

      if (characterIndex >= phrase.length) {
        isDeleting = true
        queueTypeStep(1700)
      } else {
        queueTypeStep(72)
      }
      return
    }

    characterIndex -= 1
    typedText.value = phrase.slice(0, characterIndex)

    if (characterIndex <= 0) {
      isDeleting = false
      phraseIndex = (phraseIndex + 1) % phrases.length
      queueTypeStep(380)
    } else {
      queueTypeStep(36)
    }
  }

  onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      typedText.value = phrases[0]
      return
    }

    queueTypeStep(450)
  })

  onBeforeUnmount(() => {
    if (typeTimer) window.clearTimeout(typeTimer)
  })

  const normalizedPath = computed(() => {
    const base = site.value.base || '/'
    let path = route.path

    if (base !== '/' && path.startsWith(base)) {
      path = `/${path.slice(base.length)}`
    }

    return path.replace(/\/+$/, '') || '/'
  })

  const isAboutPage = computed(() =>
    ['/uebermich', '/about', '/cv'].some(path =>
      normalizedPath.value === path || normalizedPath.value.startsWith(`${path}/`)
    )
  )

  const isContactPage = computed(() =>
    normalizedPath.value === '/kontakt' || normalizedPath.value.startsWith('/kontakt/')
  )

  const isLegalPage = computed(() =>
    normalizedPath.value === '/rechtliches' || normalizedPath.value.startsWith('/rechtliches/')
  )

  const leftNavItem = computed(() =>
    isAboutPage.value
      ? { text: 'Projekte', link: '/', isAbout: false }
      : { text: 'CV', link: '/uebermich', isAbout: true }
  )

  const rightNavItem = computed(() =>
    isContactPage.value
      ? { text: 'Projekte', link: '/' }
      : { text: 'Kontakt', link: '/kontakt' }
  )
</script>

<template>
  <header class="my-nav" :class="{ 'my-nav--black': isLegalPage || isAboutPage }">
      <nav class="my-nav__inner">
        <ul class="my-nav__list">
          <li class="my-nav__item my-nav__item--left">
            <a
              :href="withBase(leftNavItem.link)"
              class="nav-pill nav-link-font"
              :data-nav-about="leftNavItem.isAbout ? '1' : null"
            >
              {{ leftNavItem.text }}
            </a>
          </li>

          <li class="my-nav__item my-nav__item--center">
            <span
              class="nav-pill nav-link-font nav-typewriter"
            >
              <span class="visually-hidden">
                Hallo, ich bin Leon Albers. Ich bin Creative Designer. Ich liebe es, Geschichten zu erzählen.
              </span>
              <span aria-hidden="true">{{ typedText }}</span>
              <span class="nav-typewriter__caret" aria-hidden="true" />
            </span>
          </li>

          <li class="my-nav__item my-nav__item--right">
            <a :href="withBase(rightNavItem.link)" class="nav-pill nav-link-font">
              {{ rightNavItem.text }}
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
    background: var(--page-bg);
    transition: background-color 260ms ease;
  }

  :global(html.home-intro-active .my-nav) {
    background: transparent;
  }

  :global(html.home-intro-active .my-nav .nav-pill),
  :global(html.home-intro-active .my-nav .nav-pill:hover),
  :global(html.home-intro-active .my-nav .nav-pill:focus-visible) {
    color: var(--cream);
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
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    width: 100%;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .my-nav__item {
    display: flex;
  }

  .my-nav__item--left {
    justify-self: start;
  }

  .my-nav__item--center {
    justify-self: center;
  }

  .my-nav__item--right {
    justify-self: end;
  }

  .nav-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 0.4rem 0.5rem;

    background: transparent;
    color: var(--brand-red);

    text-transform: uppercase;
    letter-spacing: 0.18em;

    transition: color 200ms ease;

    width: auto;
    box-sizing: border-box;
    white-space: nowrap;
    font-size: 0.7rem;
  }

  .nav-pill:hover {
    color: var(--brand-red);
  }

  .my-nav.my-nav--black {
    background: #000;
  }

  .my-nav--black .nav-pill,
  .my-nav--black .nav-pill:hover,
  .my-nav--black .nav-pill:focus-visible {
    color: var(--brand-red);
  }

  .nav-typewriter {
    width: clamp(17rem, 48vw, 30rem);
    padding-inline: 0;
    overflow: hidden;
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    text-transform: none;
  }

  .nav-typewriter__caret {
    flex: 0 0 auto;
    width: 1px;
    height: 0.95em;
    margin-left: 0.18em;
    background: currentColor;
    animation: type-caret 760ms steps(1, end) infinite;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  @keyframes type-caret {
    0%,
    48% {
      opacity: 1;
    }

    49%,
    100% {
      opacity: 0;
    }
  }

  /* Desktop ONLY */
  @media (min-width: 1024px) {
    .my-nav__inner {
      padding-left: 2rem;
      padding-right: 2rem;
    }

    .my-nav__item {
      display: block;
    }

    .nav-pill {
      width: auto;
      white-space: nowrap;
      padding: 0.4rem 0.9rem;
      font-size: 0.875rem;
      letter-spacing: 0.25em;
    }

    .nav-typewriter {
      font-size: 0.8rem;
      letter-spacing: 0.12em;
    }
  }

  @media (max-width: 767px) {
    .my-nav__inner {
      padding-inline:
        max(0.5rem, env(safe-area-inset-left))
        max(0.5rem, env(safe-area-inset-right));
    }

    .my-nav__list {
      grid-template-columns: auto minmax(0, 1fr) auto;
      grid-template-areas: "left center right";
      gap: 0.25rem;
    }

    .my-nav__item {
      min-width: 0;
    }

    .my-nav__item--left {
      grid-area: left;
    }

    .my-nav__item--center {
      grid-area: center;
      justify-self: stretch;
      min-width: 0;
    }

    .my-nav__item--right {
      grid-area: right;
    }

    .nav-pill {
      padding-inline: 0.2rem;
      font-size: 0.62rem;
      letter-spacing: 0.1em;
    }

    .nav-typewriter {
      width: 100%;
      min-height: 1.2rem;
      font-size: clamp(0.42rem, 1.8vw, 0.56rem);
      letter-spacing: 0.015em;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-typewriter__caret {
      display: none;
    }
  }

  /* Überschriften global weiß setzen (trotz scoped) */
  :global(h1, h2, h3, h4, h5, h6) {
    color: var(--brand-red);
  }

  :global(h1 a, h2 a, h3 a, h4 a, h5 a, h6 a) {
    color: var(--brand-red);
  }
</style>
