<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{
  video: { url: string; title?: string; poster?: string; aspectRatio?: string }
  projectTitle: string
}>()

const isFile = computed(() => /\.(mp4|webm|ogg)(?:[?#]|$)/i.test(props.video.url))
const title = computed(() => props.video.title || props.projectTitle)
const mediaUrl = (url: string) => url.startsWith('/') ? withBase(url) : url
</script>

<template>
  <figure
    class="workpage-media-frame"
    :class="{ 'project-video-frame--portrait': video.aspectRatio === '9 / 16' }"
  >
    <div
      class="project-video"
      :style="{ aspectRatio: video.aspectRatio || '16 / 9' }"
    >
      <video
        v-if="isFile"
        :src="mediaUrl(video.url)"
        :poster="video.poster ? mediaUrl(video.poster) : undefined"
        :aria-label="title"
        controls
        playsinline
        preload="none"
      />
      <iframe
        v-else
        :src="mediaUrl(video.url)"
        :title="title"
        frameborder="0"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      />
    </div>
    <figcaption v-if="isFile && video.title" class="project-video-caption">
      {{ video.title }}
    </figcaption>
  </figure>
</template>

<style scoped>
.project-video {
  width: 100%;
}

.workpage-media-frame.project-video-frame--portrait {
  width: min(100%, 20rem, calc(60svh * 9 / 16));
  margin-inline: auto;
}

.project-video video,
.project-video iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.project-video video {
  object-fit: contain;
}

.project-video-caption {
  margin-top: 0.65rem;
  color: var(--brand-red);
  font-size: 0.85rem;
  line-height: 1.5;
}
</style>
