<template>
  <div class="project-frame" :class="{ 'has-generated-frame': frameReady }" :style="frameStyle" aria-hidden="true">
    <img :key="frameSrc" :src="frameSrc" class="project-frame__preload" alt="" @load="frameReady = true" @error="frameReady = false" />
    <div class="project-frame__opening" />
    <div v-if="!frameReady" class="project-frame__sides">
      <div v-for="side in sides" :key="side" class="project-frame__side" :class="`project-frame__side--${side}`" />
    </div>
    <div v-if="frameReady" class="project-frame__art" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { projectFrameFor, FRAME_SLICE } from '../data/projectFrames'

const props = defineProps<{ slug: string }>()
const sides = ['top', 'right', 'bottom', 'left'] as const
const frameSrc = computed(() => withBase(`/images/frames/${projectFrameFor(props.slug).file}`))
const frameReady = ref(false)
watch(frameSrc, () => { frameReady.value = false })
const frameStyle = computed(() => {
  const { inner, outer } = projectFrameFor(props.slug)
  return {
    '--frame-image': `url(${frameSrc.value})`,
    '--frame-slice': `${FRAME_SLICE * 100}%`,
    ...Object.fromEntries(sides.flatMap(side => [
      [`--frame-inner-${side}`, inner[side]],
      [`--frame-outer-${side}`, outer[side]],
    ])),
  }
})
</script>

<style scoped>
.project-frame {
  color: var(--brand-red);
  overflow: visible;
  box-sizing: border-box;
}

/* Neun Teilflächen halten die Ecken unverzerrt. Die Reliefleisten werden
   wiederholt, damit ihre Ornamente bei anderen Bildschirmmaßen erhalten bleiben. */
.project-frame__art {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  border: var(--frame-depth, 80px) solid transparent;
  border-image-source: var(--frame-image);
  border-image-slice: var(--frame-slice);
  border-image-width: 1;
  border-image-repeat: round;
}

.project-frame__preload { display: none; }

.project-frame__sides {
  position: absolute;
  inset:
    calc(var(--frame-depth, 80px) * var(--frame-outer-top))
    calc(var(--frame-depth, 80px) * var(--frame-outer-right))
    calc(var(--frame-depth, 80px) * var(--frame-outer-bottom))
    calc(var(--frame-depth, 80px) * var(--frame-outer-left));
}

.project-frame__side { position: absolute; background: currentColor; }
.project-frame__side--top,
.project-frame__side--bottom {
  left: 0;
  right: 0;
  height: calc(var(--frame-depth, 80px) * (var(--frame-inner-top) - var(--frame-outer-top)));
}
.project-frame__side--top { top: 0; }
.project-frame__side--bottom { bottom: 0; }
.project-frame__side--left,
.project-frame__side--right {
  top: 0;
  bottom: 0;
  width: calc(var(--frame-depth, 80px) * (var(--frame-inner-left) - var(--frame-outer-left)));
}
.project-frame__side--left { left: 0; }
.project-frame__side--right { right: 0; }

.project-frame__opening {
  position: absolute;
  inset:
    calc(var(--frame-depth, 80px) * var(--frame-inner-top))
    calc(var(--frame-depth, 80px) * var(--frame-inner-right))
    calc(var(--frame-depth, 80px) * var(--frame-inner-bottom))
    calc(var(--frame-depth, 80px) * var(--frame-inner-left));
}
</style>
