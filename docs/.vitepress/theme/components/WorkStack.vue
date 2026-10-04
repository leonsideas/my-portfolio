<template>
  <div class="fixed inset-0 overflow-hidden">
    <TitleIndex v-if="projects.length" :projects="projects" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TitleIndex from './TitleIndex.vue'

type Project = {
  slug: string
  title: string
  year: string | null
  fontClass: string
  featured: boolean
  logoSrc?: string
  logoOnly?: boolean
}

const featuredOrder = [
  'Klanggestalten',
  'Migration',
  'Uebergangsobjekte',
  'Stottern',
  'Portfolio',
]

const markdownFiles = import.meta.glob('../../../works/**/index.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Jedes Projekt bekommt seine eigene Schrift. Fehlt hier ein Eintrag,
// greift die Reihenfolge in fallbackFontClasses.
const fontClassBySlug: Record<string, string> = {
  Kilma: 'font-kilma',
  Klanggestalten: 'font-klanggestalten',
  LightbyNight: 'font-lightbynight',
  Migration: 'font-migration',
  Moi: 'font-moi',
  Portfolio: 'font-portfolio',
  Reefresh: 'font-migration',
  Stottern: 'font-stottern',
  Uebergangsobjekte: 'font-uebergangsobjekte',
  Uebersee: 'font-uebersee',
}

const logoBySlug: Record<string, string> = {
  Klanggestalten: '/images/project-logos/klanggestalten-logo.svg',
  Uebergangsobjekte: '/images/project-logos/uebergangsobjekte-logo.svg',
  Kilma: '/images/project-logos/kilma-logo-filled.png',
  Reefresh: '/images/project-logos/corals-logo.svg',
}

const logoOnlySlugs = new Set(['Klanggestalten', 'Kilma', 'Reefresh'])

// Abweichende Namen gelten nur für die Projektübersicht. Die Inhalte der
// einzelnen Projektseiten bleiben davon unberührt.
const titleBySlug: Record<string, string> = {
  Reefresh: 'REEFRESH – MAYBE NEXT TIME',
}

const fallbackFontClasses = [
  'font-migration',
  'font-klanggestalten',
  'font-moi',
  'font-lightbynight',
  'font-kilma',
  'font-save',
  'font-uebergangsobjekte',
]

const projects = computed<Project[]>(() => {
  const list: Project[] = []

  for (const path in markdownFiles) {
    const raw = markdownFiles[path] as string
    const lines = raw.split('\n')

    const match = path.match(/works\/([^/]+)\/index\.md$/)
    const slug = match?.[1] ?? ''
    if (!slug) continue

    const titleLine = lines.find(line => line.startsWith('# '))
    const yearLine = lines.find(line => /^#{3,6}\s+\d{4}\s*$/.test(line))

    list.push({
      slug,
      title: titleBySlug[slug] || titleLine?.replace(/^# /, '').trim() || slug,
      year: yearLine ? yearLine.replace(/^#+\s+/, '').trim() : null,
      fontClass:
        fontClassBySlug[slug] ||
        fallbackFontClasses[list.length % fallbackFontClasses.length],
      featured: featuredOrder.includes(slug),
      logoSrc: logoBySlug[slug],
      logoOnly: logoOnlySlugs.has(slug),
    })
  }

  // Die fünf stärksten Fallstudien stehen zuerst; der Rest folgt chronologisch.
  return list.sort((a, b) => {
    const featuredA = featuredOrder.indexOf(a.slug)
    const featuredB = featuredOrder.indexOf(b.slug)
    if (featuredA >= 0 || featuredB >= 0) {
      if (featuredA < 0) return 1
      if (featuredB < 0) return -1
      return featuredA - featuredB
    }
    if (a.year === b.year) return a.title.localeCompare(b.title)
    if (!a.year) return 1
    if (!b.year) return -1
    return Number(b.year) - Number(a.year)
  })
})

</script>
