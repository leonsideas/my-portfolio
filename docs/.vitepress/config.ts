import { defineConfig, type HeadConfig } from 'vitepress'

const siteUrl = 'https://www.leonalbers.de'
const defaultImage = '/images/Kontakt.webp'

function pageUrl(relativePath: string): string {
  if (relativePath === 'index.md') return `${siteUrl}/`

  const cleanPath = relativePath
    .replace(/index\.md$/, '')
    .replace(/\.md$/, '')

  return `${siteUrl}/${cleanPath}`
}

export default defineConfig({
  base: '/',
  cleanUrls: true,
  srcExclude: ['documentation/**'],
  lang: 'de-DE',
  locales: {
    root: { label: 'Deutsch', lang: 'de-DE' },
    en: {
      label: 'English',
      lang: 'en-GB',
      description: 'Leon Albers works with storytelling, film, code, artificial intelligence and interactive media.',
    },
  },
  title: 'Leon Albers',
  titleTemplate: ':title | Leon Albers',
  description:
    'Leon Albers entwickelt Geschichten, Ideen und medienübergreifende Erlebnisse – von Film und KI bis zu Apps und interaktiven Installationen.',

  appearance: false,

  sitemap: {
    hostname: siteUrl,
  },

  head: [
    ['meta', { name: 'author', content: 'Leon Albers' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['meta', { property: 'og:site_name', content: 'Leon Albers' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  transformHead({ pageData, title, description }) {
    if (pageData.isNotFound) return

    const canonical = pageUrl(pageData.relativePath)
    const isEnglish = pageData.relativePath.startsWith('en/')
    const otherPath = isEnglish ? pageData.relativePath.slice(3) : `en/${pageData.relativePath}`
    const imagePath = pageData.frontmatter.image || defaultImage
    const image = imagePath.startsWith('http') ? imagePath : `${siteUrl}${imagePath}`
    const socialTitle = title || pageData.title || 'Leon Albers'
    const socialDescription = description || pageData.description

    const head: HeadConfig[] = [
      ['link', { rel: 'canonical', href: canonical }],
      ['link', { rel: 'alternate', hreflang: isEnglish ? 'en' : 'de', href: canonical }],
      ['link', { rel: 'alternate', hreflang: isEnglish ? 'de' : 'en', href: pageUrl(otherPath) }],
      ['meta', { property: 'og:locale', content: isEnglish ? 'en_GB' : 'de_DE' }],
      ['meta', { property: 'og:title', content: socialTitle }],
      ['meta', { property: 'og:url', content: canonical }],
      ['meta', { property: 'og:image', content: image }],
      ['meta', { name: 'twitter:title', content: socialTitle }],
      ['meta', { name: 'twitter:image', content: image }],
    ]

    if (socialDescription) {
      head.push(
        ['meta', { property: 'og:description', content: socialDescription }],
        ['meta', { name: 'twitter:description', content: socialDescription }],
      )
    }

    return head
  },
})
