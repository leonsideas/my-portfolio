import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // Für Project Pages: https://<user>.github.io/<repo>/
  base: '/my-portfolio/',

  title: 'Portfolio',
  titleTemplate: ':title | Leon Albers',

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
