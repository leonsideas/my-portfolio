<template>
  <Teleport to="body">
    <div
      v-if="projectOpening"
      ref="overlay"
      class="project-opening"
      :style="{ '--opening-filter': mediaOpening?.filter ?? 'grayscale(1)' }"
      :aria-label="text(`${projectOpening.title} wird geöffnet`, `Opening ${projectOpening.title}`)"
      aria-busy="true"
      @wheel.prevent
      @touchmove.prevent
    >
      <div ref="backdrop" class="project-opening__backdrop" />
      <div v-if="mediaOpening" ref="windowRef" class="project-opening__window" :style="boxStyle(mediaOpening.openingBox)">
        <div ref="picture" class="project-opening__picture" :style="pictureStyle">
          <video
            v-if="mediaOpening.media.type === 'video'"
            ref="video"
            :src="mediaOpening.media.src"
            class="project-opening__media"
            muted autoplay loop playsinline preload="auto"
            @loadedmetadata="syncVideo"
            @playing="mediaReady = true"
          />
          <img
            v-else
            :src="mediaOpening.media.src"
            class="project-opening__media"
            alt=""
            @load="mediaReady = true"
          />
          <img
            :src="mediaOpening.poster"
            class="project-opening__media project-opening__poster"
            :class="{ 'is-hidden': mediaReady }"
            alt=""
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vitepress'
import { projectOpening, type OpeningBox } from '../composables/useProjectOpening'
import { useSiteLanguage } from '../composables/useSiteLanguage'

const { text } = useSiteLanguage()

const router = useRouter()
const overlay = ref<HTMLElement | null>(null)
const backdrop = ref<HTMLElement | null>(null)
const windowRef = ref<HTMLElement | null>(null)
const picture = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const mediaReady = ref(false)
const animations = new Set<Animation>()
const mediaOpening = computed(() => projectOpening.value?.kind === 'scene' ? null : projectOpening.value)
let runId = 0
let navigating = false

function boxStyle(box: OpeningBox) {
  return { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` }
}

const pictureStyle = computed(() => {
  if (!mediaOpening.value) return {}
  const { sourceBox, openingBox } = mediaOpening.value
  return boxStyle({ ...sourceBox, left: sourceBox.left - openingBox.left, top: sourceBox.top - openingBox.top })
})

function syncVideo() {
  const opening = mediaOpening.value
  if (!video.value || !opening) return
  if (opening.media.src === opening.previewSrc && opening.currentTime > 0) {
    video.value.currentTime = opening.currentTime
  }
  video.value.play().catch(() => { /* Das Poster bleibt als Rückfall sichtbar. */ })
}

const delay = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms))
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

async function animate(element: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
  const animation = element.animate(keyframes, { fill: 'forwards', ...options })
  animations.add(animation)
  try { await animation.finished } catch { /* Abbruch beim Verlassen der Seite. */ }
}

function clearOpening() {
  runId++
  animations.forEach(animation => animation.cancel())
  animations.clear()
  projectOpening.value = null
  document.documentElement.classList.remove('project-opening-active')
  window.removeEventListener('keydown', onKeyDown)
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !navigating) clearOpening()
}

watch(projectOpening, async (opening) => {
  if (!opening) return
  const id = ++runId
  navigating = false
  mediaReady.value = false
  document.documentElement.classList.add('project-opening-active')
  window.addEventListener('keydown', onKeyDown)
  await nextTick()
  await nextFrame()
  if (id !== runId || !overlay.value || !backdrop.value) return

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const easing = 'cubic-bezier(0.22, 0.75, 0.16, 1)'
  try {
    if (opening.kind === 'scene') {
      const duration = reducedMotion ? 0 : 600
      await Promise.all([
        animate(backdrop.value, [{ opacity: 0 }, { opacity: 1 }], { duration, easing: 'ease-in-out' }),
        animate(opening.source, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }], { duration, easing }),
      ])
    } else {
      if (!windowRef.value || !picture.value) return
      const duration = reducedMotion ? 0 : 950
      const fullscreen = { left: '0px', top: '0px', width: `${window.innerWidth}px`, height: `${window.innerHeight}px` }
      await Promise.all([
        animate(backdrop.value, [{ opacity: 0 }, { opacity: 1 }], { duration: reducedMotion ? 0 : 600 }),
        animate(windowRef.value, [boxStyle(opening.openingBox), fullscreen], { duration, easing }),
        animate(picture.value, [pictureStyle.value, fullscreen], { duration, easing }),
        animate(picture.value, [{ filter: opening.filter ?? 'grayscale(1)' }, { filter: 'none' }], { duration, easing }),
      ])
      if (!reducedMotion) await delay(500)
    }
    if (id !== runId) return
    navigating = true
    await router.go(opening.href)
    await nextTick()
    await nextFrame()
    await nextFrame()
    if (id !== runId || !overlay.value) return
    await animate(overlay.value, [{ opacity: 1 }, { opacity: 0 }], { duration: reducedMotion ? 120 : 480, easing: 'ease' })
  } finally {
    if (id === runId) {
      navigating = false
      clearOpening()
    }
  }
}, { flush: 'post' })

onBeforeUnmount(clearOpening)
</script>

<style scoped>
.project-opening { position: fixed; inset: 0; z-index: 200; cursor: progress; touch-action: none; }
.project-opening__backdrop { position: absolute; inset: 0; background: var(--page-bg); opacity: 0; }
.project-opening__window { position: absolute; overflow: hidden; background: var(--page-bg); }
.project-opening__picture { position: absolute; filter: var(--opening-filter, grayscale(1)); }
.project-opening__media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.project-opening__poster { opacity: 1; transition: opacity 240ms ease; }
.project-opening__poster.is-hidden { opacity: 0; }
</style>
