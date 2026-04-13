/// <reference types="node" />  // 👈 keep this if you use TypeScript

import { defineConfig } from 'vitepress'

const isProd = process.env.NODE_ENV === 'production'

// ⚠️ make sure this matches your repo name exactly
const repoName = 'my-portfolio'

const siteUrl = isProd
  ? `https://leonsideas.github.io/${repoName}`
  : 'http://localhost:5173'

export default defineConfig({
  title: 'Leon Albers',
  description: 'Leon Albers – Gestalter in Digitalen Medien',

  lang: 'de-DE',

  // GitHub Pages project site: https://<user>.github.io/<repo>/
  base: isProd ? `/${repoName}/` : '/',

  themeConfig: {
    nav: [
      // ❌ no BASE_URL here, just plain paths
      { text: 'Home',  link: '/' },
      { text: 'about', link: '/about/' },
      { text: 'works', link: '/works/' },
    ],
  },

  head: [
    ['meta', { charset: 'UTF-8' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { name: 'author', content: 'Leon Albers' }],
    ['meta', { name: 'robots', content: 'index, follow' }],

    // Open Graph
    ['meta', { property: 'og:site_name', content: 'Leon Albers' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'de_DE' }],
    ['meta', { property: 'og:image', content: `${siteUrl}/images/Kontakt.webp` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],

    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:creator', content: '@leonsideas' }],
    ['meta', { name: 'twitter:image', content: `${siteUrl}/images/Kontakt.webp` }],

  ]
})
