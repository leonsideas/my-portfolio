<script setup lang="ts">
import { useData, withBase } from 'vitepress'

const { theme } = useData()
const nav = theme.value.nav || []
</script>

<template>
  <header class="border-b border-black bg-white">
    <nav class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
      <div class="text-lg font-bold tracking-tight">
        Portfolio
      </div>

      <ul class="flex gap-4 text-sm font-medium">
        <li
          v-for="item in nav"
          :key="item.link"
        >
          <a
            :href="withBase(item.link)"
            class="px-3 py-1 rounded-full border border-black hover:bg-black hover:text-white transition"
          >
            {{ item.text }}
          </a>
        </li>
      </ul>
    </nav>
  </header>
</template>
