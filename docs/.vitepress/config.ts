import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/',
  cleanUrls: true,  // ← NEU

  // ✅ VitePress kennt jetzt /works/ als gültige Route
  rewrites: {
    'works/index.md': 'works/index.md',
  },

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
        // ✅ Abfangen von dynamischen .md Importen (VitePress intern)
        resolveId(id) {
          // z.B. /Moi/index.md oder /Moi.md → auf works/index.md umleiten
          const mdMatch = id.match(/^\/([^/]+?)(\/index)?\.md$/)
          if (mdMatch) {
            const slug = mdMatch[1]
            const knownRoutes = ['works', 'about', 'uebermich', 'cv', 'index', '404', 'kontakt']
            if (!knownRoutes.includes(slug)) {
              return { id: '/works/index.md', moduleSideEffects: false }
            }
          }
          return undefined
        },
        configureServer(server) {
          // ✅ früher einbinden: vor VitePress's eigenem Middleware
          server.middlewares.use((req, _res, next) => {
            if (!req.url) return next()

            const original = req.url
            const path = original.split('?')[0]

            // .md?import Requests abfangen die VitePress selbst generiert
            if (path.endsWith('.md')) {
              const mdSlugMatch = path.match(/^\/([^/]+?)(\/index)?\.md$/)
              if (mdSlugMatch) {
                const slug = mdSlugMatch[1]
                const knownRoutes = ['works', 'about', 'uebermich', 'cv', 'index', 'kontakt']
                if (!knownRoutes.includes(slug)) {
                  const qs = new URLSearchParams(original.split('?')[1] || '')
                  const play = qs.get('play') === '1' ? '&play=1' : ''
                  req.url = `/works/index.md?id=${encodeURIComponent(slug)}${play}`
                  return next()
                }
              }
            }

            const ignore =
              path.startsWith('/@') ||
              path.startsWith('/assets') ||
              path.startsWith('/cv') ||
              path.startsWith('/about') ||
              path.startsWith('/uebermich') ||
              path.startsWith('/kontakt') ||
              path.startsWith('/videos') ||
              path.startsWith('/works') ||
              path === '/' ||
              path.endsWith('.html') ||
              path.includes('.')

            if (ignore) return next()

            // /works/Klanggestalten -> /works/?id=Klanggestalten
            const worksMatch = path.match(/^\/works\/(.+)$/)
            if (worksMatch) {
              const slug = worksMatch[1].replace(/\/$/, '')
              const qs = new URLSearchParams(original.split('?')[1] || '')
              const play = qs.get('play') === '1' ? '&play=1' : ''
              req.url = `/works/?id=${encodeURIComponent(slug)}${play}`
              return next()
            }

            // /Moi -> /works/?id=Moi
            const slugMatch = path.match(/^\/([^/]+)\/?$/)
            if (slugMatch) {
              const slug = slugMatch[1]
              const qs = new URLSearchParams(original.split('?')[1] || '')
              const play = qs.get('play') === '1' ? '&play=1' : ''
              req.url = `/works/?id=${encodeURIComponent(slug)}${play}`
              return next()
            }

            req.url = `/works/?redirect=${encodeURIComponent(original)}`
            next()
          })
        }
      }
    ]
  },
})
