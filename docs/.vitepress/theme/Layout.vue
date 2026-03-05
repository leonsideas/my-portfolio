<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import NavBar from './components/NavBar.vue'
import WorkPage from './components/WorkPage.vue'
import WorkStack from './components/WorkStack.vue'
import AboutPage from './components/AboutPage.vue'
import { computed, onMounted, ref } from 'vue'

const { frontmatter, site } = useData()
const route = useRoute()

const normalizedPath = computed(() => {
  const base = site.value.base || '/'
  return route.path.replace(base, '/') || '/'
})

// ✅ NEU: About-Route umgestellt auf /Uebermich
// ✅ Alias: /about bleibt erstmal gültig
const isAboutPage = computed(() =>
  normalizedPath.value.startsWith('/uebermich') || normalizedPath.value.startsWith('/about')
)

const isWorkPage = computed(() => {
  if (normalizedPath.value.startsWith('/works/')) return true
  // ✅ SSR-safe: window nur im Browser
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.has('id')) return true
  // ✅ Jeder Pfad der nicht bekannt ist → WorkPage
  const knownPaths = ['/', '/about', '/uebermich', '/cv']
  const path = normalizedPath.value.replace(/\/$/, '') || '/'
  return !knownPaths.some(p => path === p || path.startsWith(p + '/'))
})

const isEmptyLayout = computed(() => frontmatter.value.layout === 'empty')

const currentPageComponent = computed(() => {
  if (frontmatter.value.layout === 'home') return WorkStack
  if (isWorkPage.value) return WorkPage
  if (isAboutPage.value) return AboutPage
  return null
})
</script>

<template>
  <!-- Spezialfall: Seiten mit layout: empty (z.B. contact) -->
  <template v-if="isEmptyLayout">
    <div class="min-h-screen font-plexsans text-black">
      <NavBar :class="{ 'is-workpage': isWorkPage }" />
      <Content class="empty-layout-content" />
    </div>
  </template>

  <!-- Standard-Layout -->
  <template v-else>
    <div class="min-h-screen font-plexsans text-black">
      <NavBar :class="{ 'is-workpage': isWorkPage }" />

      <!-- Für WorkPage: full-bleed rendern, ohne Wrapper/Padding -->
      <component
        v-if="currentPageComponent && isWorkPage"
        :is="currentPageComponent"
        :key="route.path"
      />

      <!-- Für alle anderen Seiten -->
      <div
        v-else
        :class="[
          'bg-black',
          'min-h-[calc(100vh-4rem)]'
        ]"
      >
        <main
          :class="[
            !isAboutPage
              ? 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8'
              : 'w-full h-full'
          ]"
        >
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
    </div>
  </template>
</template>

<style scoped>
.empty-layout-content {
  margin: 0;
  padding: 0;
}
</style>
