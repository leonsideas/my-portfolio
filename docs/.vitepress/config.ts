import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/',
  cleanUrls: true,  // ← NEU

  title: 'Portfolio',
  titleTemplate: ':title | Leon Albers',

  // ✅ Preload Videos + GitHub Pages Redirect Restore
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
    ],

    // ✅ GitHub Pages: stellt /Migration wieder her nach 404 redirect
    [
      'script',
      {},
      `
      (function () {
        var params = new URLSearchParams(location.search);
        var r = params.get('redirect');
        if (!r) return;

        try {
          var decoded = decodeURIComponent(r);
          history.replaceState(null, '', decoded);
        } catch (e) {}
      })();
      `
    ]
  ],

  themeConfig: {
    // ...falls du etwas hast, bleibt das hier
  },

  vite: {
    resolve: {
      alias: {
        '@theme': resolve(__dirname, './theme'),
      },
    },

    // ✅ LOKALER Clean-URL Fallback
    // erlaubt Reload / Direktaufruf von /Migration im dev server
    plugins: [
      {
        name: 'local-clean-url-fallback-to-works',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (!req.url) return next()

            const original = req.url
            const path = original.split('?')[0]

            const ignore =
              path.startsWith('/@') ||
              path.startsWith('/assets') ||
              path.startsWith('/cv') ||
              path.startsWith('/about') ||
              path.startsWith('/uebermich') ||
              path.startsWith('/videos') ||
              path === '/' ||
              path === '/works' ||
              path === '/works/' ||
              path.endsWith('.html') ||
              path.includes('.')

            if (ignore) return next()

            // /works/Klanggestalten -> /works/?id=Klanggestalten
            const worksMatch = path.match(/^\/works\/(.+)$/)
            if (worksMatch) {
              const slug = worksMatch[1]
              const qs = new URLSearchParams(original.split('?')[1] || '')
              const play = qs.get('play') === '1' ? '&play=1' : ''
              req.url = `/works/?id=${encodeURIComponent(slug)}${play}`
              return next()
            }

            // alles andere (z.B. /Klanggestalten) -> /works/?redirect=...
            req.url = `/works/?redirect=${encodeURIComponent(original)}`
            next()
          })
        }
      }
    ]
  },
})
