import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // Für Project Pages: https://<user>.github.io/<repo>/
  base: '/',

  title: 'Portfolio',
  titleTemplate: ':title | Leon Albers',

  // ✅ Preload Transition-Videos (global im <head>)
  head: [
    [
      'link',
      {
        rel: 'preload',
        as: 'video',
        href: '/videos/Transition.mp4',
        type: 'video/mp4'
      }
    ],
    [
      'link',
      {
        rel: 'preload',
        as: 'video',
        href: '/videos/Transition_up.mp4',
        type: 'video/mp4'
      }
    ]
  ],

  themeConfig: {
    // ...existing code (falls vorhanden)...
  },

  // ✅ Plattformunabhängig (funktioniert lokal + in GitHub Actions)
  vite: {
    resolve: {
      alias: {
        '@theme': resolve(__dirname, './theme'),
      },
    },
  },
})
