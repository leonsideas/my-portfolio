<script setup lang="ts">
import { useRoute } from 'vitepress'
import { computed } from 'vue'

const route = useRoute()
const currentPath = computed(() => route.path.replace(/\/$/, ''))

// Sidebar custom navigation links
const links = [
  { title: 'Vitepress', path: 'https://vitepress.dev/guide/what-is-vitepress' },
  { title: 'Tailwind CSS', path: 'https://tailwindcss.com/' }
]
</script>

<template>
  <div class="flex flex-col lg:flex-row min-h-[80vh] border border-black rounded-2xl overflow-hidden shadow-md">
    <!-- Sidebar -->
    <aside class="w-full lg:w-1/4 bg-white border-r border-black p-4 space-y-4">
      <h2 class="text-xl font-bold mb-4">Useful links</h2>
      <ul class="space-y-2">
        <li
          v-for="link in links"
          :key="link.path"
        >
          <a
            :href="link.path"
            class="block px-3 py-2 border border-black rounded text-sm font-medium text-black hover:bg-black hover:text-white transition"
            :class="{ 'bg-black text-white': currentPath === link.path.replace(/\/$/, '') }"
          >
            {{ link.title }}
          </a>
        </li>
      </ul>
    </aside>

    <!-- Markdown Content -->
    <section class="bg-white w-full lg:w-3/4 p-6 overflow-auto break-words overflow-x-hidden">
      <Content class="prose prose-base md:prose-lg max-w-none break-words" />
    </section>
  </div>
</template>
