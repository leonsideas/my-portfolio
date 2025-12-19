<template>
  <div
    ref="containerRef"
    class="fixed inset-0 w-screen h-screen"
  >
    <!-- Full-width Carousel -->
    <Carousel
      v-if="cards.length"
      :slides="slides"
      :autoplay="true"
      :interval="5000"
      :loop="true"
      class="w-full h-full"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'
import Carousel from './Carousel.vue'

type Card = {
  slug: string
  title: string
  name: string
  excerpt: string
  route: string      // `/works/?id=slug`
  image: string | null          // Bild im Projekt selbst
  previewImage: string | null   // separates Vorschaubild fürs Carousel
}

const markdownFiles = import.meta.glob('../../../works/**/index.md', {
  as: 'raw',
  eager: true,
})
const imageFiles = import.meta.glob('../../../works/**/cover.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
})
// NEU: eigene Vorschaubilder, z.B. preview.jpg im gleichen Ordner wie index.md
const previewImageFiles = import.meta.glob('../../../works/**/preview.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
})

const cards = ref<Card[]>([])

for (const path in markdownFiles) {
  const raw = markdownFiles[path] as string
  const lines = raw.split('\n')

  const titleLine = lines.find(line => line.startsWith('# '))
  const nameLine = lines.find(line => line.startsWith('## '))
  const excerptLine = lines.find(line => line.trim() && !line.startsWith('#'))

  const match = path.match(/works\/([^/]+)\/index\.md$/)
  const slug = match?.[1] ?? ''
  const route = `/works/?id=${slug}`

  const folder = path.replace(/\/index\.md$/, '/')
  const imageKey = Object.keys(imageFiles).find(k => k.startsWith(folder))
  const previewKey = Object.keys(previewImageFiles).find(k => k.startsWith(folder))

  cards.value.push({
    slug,
    title: titleLine?.replace(/^# /, '') || 'Untitled',
    name: nameLine?.replace(/^## /, '') || 'Anonymous',
    excerpt: excerptLine || '',
    route,
    image: imageKey ? (imageFiles[imageKey] as string) : null,
    previewImage: previewKey ? (previewImageFiles[previewKey] as string) : null,
  })
}

// Slides für das Carousel aus cards ableiten
const slides = computed(() =>
  cards.value.map(card => ({
    id: card.slug,
    title: card.title,
    subtitle: card.name,
    description: card.excerpt,
    // wichtig: hier das Vorschaubild an Carousel geben
    previewImage: card.previewImage,
    // optional: das eigentliche Bild kann zusätzlich mitgegeben werden
    image: card.image,
    href: withBase(card.route),
  }))
)

// Optional: falls containerRef weiterhin gebraucht wird
const containerRef = ref<HTMLElement | null>(null)
</script>

<style scoped>
/* Optional: sicherstellen, dass der Container selbst auch 100% Höhe hat, falls nötig */
:host {
  display: block;
  height: 100vh;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
