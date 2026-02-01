import { defineConfig } from 'vitepress'

export default defineConfig({
  // Für Project Pages: https://<user>.github.io/<repo>/
  // Repo heißt hier "my-portfolio" -> base muss "/my-portfolio/" sein
  base: '/my-portfolio/',

  // Globaler Titel deiner Seite (statt "VitePress")
  title: 'Portfolio',

  // Optional: Wie der Tab‑Titel aufgebaut wird
  // z.B. "Seitenname | Mein Portfolio"
  titleTemplate: ':title | Leon Albers',

  themeConfig: {
    // ...existing code (falls vorhanden)...
  },

  // NEU: eigener Theme‑Einstieg, damit /works/ immer dein Layout nutzt
  vite: {
    resolve: {
      alias: {
        // stellt sicher, dass das Theme mit WorkPage.vue benutzt wird
        '@theme': '/Users/leonalbers/Documents/my-portfolio/docs/.vitepress/theme'
      }
    }
  }
})