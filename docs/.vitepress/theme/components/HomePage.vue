
<template>
  <!-- ...existing code, NavBar etc. ... -->

  <Carousel
    :slides="slides"
    @open-project="onOpenProject"
  />

  <WorkPage ref="workPageRef" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Carousel from './Carousel.vue'
import WorkPage from './WorkPage.vue'