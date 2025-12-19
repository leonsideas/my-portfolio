
<script setup lang="ts">
import { ref } from 'vue'
import Carousel from './Carousel.vue'
import WorkPage from './WorkPage.vue'

// ...existing code (z.B. slides, props, etc.)...

const workPageRef = ref<InstanceType<typeof WorkPage> | null>(null)

function handleOpenProject(payload: { slug: string; videoSrc: string | null }) {
  // WorkPage-API aufrufen → spielt Transition-Video im Overlay ab
  workPageRef.value?.openFromCarousel(payload.slug, payload.videoSrc)
}
</script>

<template>
  <!-- ...existing layout... -->

  <Carousel
    :slides="slides"
    @open-project="handleOpenProject"
  />

  <WorkPage ref="workPageRef" />
</template>