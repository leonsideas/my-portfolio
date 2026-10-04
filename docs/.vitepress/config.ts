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
    ['meta', { property: 'og:locale', content: 'de_DE' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  transformHead({ pageData, title, description }) {
    if (pageData.isNotFound) return

    const canonical = pageUrl(pageData.relativePath)
    const imagePath = pageData.frontmatter.image || defaultImage
    const image = imagePath.startsWith('http') ? imagePath : `${siteUrl}${imagePath}`
    const socialTitle = title || pageData.title || 'Leon Albers'
    const socialDescription = description || pageData.description

    const head: HeadConfig[] = [
      ['link', { rel: 'canonical', href: canonical }],
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
