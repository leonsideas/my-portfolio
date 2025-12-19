
import type Carousel from '../.vitepress/theme/components/Carousel.vue'

// Typ ggf. aus dem Component übernehmen, hier grob nachgebaut:
type Slide = {
  id?: string | number
  title?: string
  subtitle?: string
  description?: string
  image?: string | null
  video?: string | null
  previewImage?: string | null
  previewVideo?: string | null
  href?: string
  titleFontClass?: string
}

export const slides: Slide[] = [
  {
    id: 'Klanggestalten',
    title: 'Klanggestalten',
    subtitle: 'Sound Design',
    description: '…',
    href: '/works/Klanggestalten/',
    // hier die Schrift für dieses Projekt:
    titleFontClass: 'font-klang',
  },
  {
    id: 'ProjektZwei',
    title: 'Projekt Zwei',
    subtitle: 'Installation',
    description: '…',
    href: '/works/ProjektZwei/',
    titleFontClass: 'font-projekt-zwei',
  },
  // ...weitere Projekte...
]