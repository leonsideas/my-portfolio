
<template>
  <Carousel :slides="slides" />
</template>

<script setup lang="ts">
import Carousel from '../.vitepress/theme/components/Carousel.vue'
import { slides } from './slides'
</script>