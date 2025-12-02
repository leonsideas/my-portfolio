<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import NavBar from './components/NavBar.vue'
import WorkPage from './components/WorkPage.vue'
import WorkStack from './components/WorkStack.vue'
import AboutPage from './components/AboutPage.vue'
import HeroSection from './home-page-components/hero-section/HeroSection.vue'
import { computed } from 'vue'

const { frontmatter, site } = useData()
const route = useRoute()

// Remove base from the path so matching works in dev & GitHub Pages
const normalizedPath = computed(() => {
  const base = site.value.base || '/'
  // ensure leading slash and strip any base prefix
  return route.path.replace(base, '/') || '/'
})

const currentPageComponent = computed(() => {
  if (frontmatter.value.layout === 'home') return WorkStack
  if (normalizedPath.value.startsWith('/works/')) return WorkPage
  if (normalizedPath.value.startsWith('/about')) return AboutPage
  return null
})
</script>

<template>
  <!-- <HeroSection/> -->
  <div class="min-h-screen font-plexsans bg-stone-200 text-black">
    <NavBar />
    
    <main class="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <component
        v-if="currentPageComponent"
        :is="currentPageComponent"
        :key="route.path"
      />
      <Content
        v-else
        class="prose prose-base md:prose-lg lg:prose-xl max-w-none mt-8"
      />
    </main>
  </div>
</template>
