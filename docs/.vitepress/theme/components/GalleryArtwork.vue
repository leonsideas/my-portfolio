<template>
  <a
    ref="linkRef"
    :href="withBase(`/works/${encodeURIComponent(project.slug)}/`)"
    class="gallery-artwork vp-raw"
    :class="{ 'is-enabled': canOpen, 'has-project-logo': !!project.logoSrc, 'has-hover-logo': project.slug === 'Uebergangsobjekte' && !!project.logoSrc }"
    :style="artworkStyle"
    :data-project-slug="project.slug"
    :aria-label="`${project.title}${project.year ? ', ' + project.year : ''} – Projekt öffnen`"
    :aria-disabled="!canOpen"
    :tabindex="enabled ? 0 : -1"
    @click.stop.prevent="openProject"
    @focus="$emit('focus')"
  >
    <figure>
      <div ref="paintingRef" class="gallery-artwork__painting">
        <div class="gallery-artwork__viewport">
          <template v-if="loadMedia">
            <video
              v-if="media.type === 'video'"
              ref="coverRef"
              :key="media.src"
              :src="withBase(media.src)"
              class="gallery-artwork__media gallery-artwork__cover"
              :style="{ opacity: coverOpacity }"
              muted loop playsinline
              :preload="visible ? 'auto' : 'metadata'"
              @loadeddata="coverReady = true; syncPlayback()"
            />
            <img
              v-else
              ref="coverRef"
              :key="media.src"
              :src="withBase(media.src)"
              class="gallery-artwork__media gallery-artwork__cover"
              :style="{ opacity: coverOpacity }"
              alt=""
              decoding="async"
              @load="coverReady = true"
            />
          </template>
          <template v-if="intro">
            <video
              v-if="intro.type === 'video'"
              ref="introRef"
              :key="intro.src"
              :src="withBase(intro.src)"
              class="gallery-artwork__media gallery-artwork__intro"
              :style="{ opacity: 1 - coverOpacity }"
              autoplay muted loop playsinline preload="auto"
              @loadeddata="introReady = true; syncPlayback()"
            />
            <img
              v-else
              ref="introRef"
              :key="intro.src"
              :src="withBase(intro.src)"
              class="gallery-artwork__media gallery-artwork__intro"
              :style="{ opacity: 1 - coverOpacity }"
              alt=""
              @load="introReady = true"
            />
          </template>
        </div>
        <ProjectFrame :slug="project.slug" class="gallery-artwork__frame" />
      </div>
      <figcaption class="gallery-artwork__caption">
        <span class="gallery-artwork__title" :class="project.fontClass">
          <span class="gallery-artwork__title-text">{{ project.title }}</span>
          <img
            v-if="project.logoSrc"
            :src="withBase(project.logoSrc)"
            class="gallery-artwork__logo"
            :class="`gallery-artwork__logo--${project.slug.toLowerCase()}`"
            alt=""
            aria-hidden="true"
          />
        </span>
        <time v-if="project.year" :datetime="project.year" class="gallery-artwork__year">{{ project.year }}</time>
      </figcaption>
    </figure>
  </a>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import ProjectFrame from './ProjectFrame.vue'
import { projectFrameFor } from '../data/projectFrames'
import type { CoverMedia } from '../composables/useCoverMedia'
import { beginProjectOpening, projectOpening, type OpeningBox } from '../composables/useProjectOpening'

const props = defineProps<{
  project: { slug: string; title: string; year: string | null; fontClass?: string; logoSrc?: string }
  media: CoverMedia
  intro?: CoverMedia
  frameDepth: number
  paintingHeight: number
  frameReveal: number
  captionReveal: number
  coverReveal: number
  enabled: boolean
  visible: boolean
  shouldLoad: boolean
}>()
defineEmits<{ focus: [] }>()

type Source = HTMLVideoElement | HTMLImageElement
const linkRef = ref<HTMLAnchorElement | null>(null)
const paintingRef = ref<HTMLElement | null>(null)
const coverRef = ref<Source | null>(null)
const introRef = ref<Source | null>(null)
const loadMedia = ref(props.shouldLoad)
const coverReady = ref(false)
const introReady = ref(false)
const coverOpacity = computed(() => props.intro ? (coverReady.value ? props.coverReveal : 0) : 1)
const canOpen = computed(() => props.enabled && (coverReady.value || introReady.value))
const artworkStyle = computed(() => {
  const { inner } = projectFrameFor(props.project.slug)
  return {
    '--painting-height': `${props.paintingHeight}px`,
    '--frame-depth': `${props.frameDepth}px`,
    '--frame-reveal': props.frameReveal,
    '--caption-reveal': props.captionReveal,
    '--opening-top': `${props.frameDepth * inner.top - 2}px`,
    '--opening-right': `${props.frameDepth * inner.right - 2}px`,
    '--opening-bottom': `${props.frameDepth * inner.bottom - 2}px`,
    '--opening-left': `${props.frameDepth * inner.left - 2}px`,
  }
})

watch(() => props.shouldLoad, value => { if (value) loadMedia.value = true })
watch(() => props.media.src, () => { coverReady.value = false })
watch(() => props.intro?.src, () => { introReady.value = false })
watch([() => props.visible, coverOpacity, projectOpening], () => { nextTick(syncPlayback) })

function syncPlayback() {
  for (const [source, show] of [[coverRef.value, coverOpacity.value > 0], [introRef.value, coverOpacity.value < 1]] as const) {
    if (!(source instanceof HTMLVideoElement)) continue
    if (props.visible && show && !projectOpening.value) source.play().catch(() => {})
    else source.pause()
  }
}

function openProject() {
  if (!canOpen.value || projectOpening.value) return
  const source = props.intro && coverOpacity.value < 0.5 ? introRef.value : coverRef.value
  const opening = paintingRef.value?.querySelector<HTMLElement>('.project-frame__opening')
  if (!source || !opening) return

  const bounds = source.getBoundingClientRect()
  const previewSrc = source.getAttribute('src') || ''
  let poster = previewSrc
  try {
    const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth
    const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight
    if (!sw || !sh) return
    const canvas = document.createElement('canvas')
    const resolution = Math.min(2, 1600 / bounds.width)
    canvas.width = Math.round(bounds.width * resolution)
    canvas.height = Math.round(bounds.height * resolution)
    const context = canvas.getContext('2d')
    if (context) {
      const scale = Math.max(canvas.width / sw, canvas.height / sh)
      const cropWidth = canvas.width / scale
      const cropHeight = canvas.height / scale
      context.drawImage(source, (sw - cropWidth) / 2, (sh - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height)
      poster = canvas.toDataURL('image/jpeg', 0.9)
    }
  } catch { /* Die sichtbare Quelle bleibt auch ohne Momentaufnahme erhalten. */ }

  const box = (rect: DOMRect): OpeningBox => ({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })
  beginProjectOpening({
    slug: props.project.slug,
    title: props.project.title,
    href: withBase(`/works/${encodeURIComponent(props.project.slug)}/`),
    media: { type: source instanceof HTMLVideoElement ? 'video' : 'image', src: previewSrc },
    poster,
    previewSrc,
    currentTime: source instanceof HTMLVideoElement ? source.currentTime : 0,
    openingBox: box(opening.getBoundingClientRect()),
    sourceBox: box(bounds),
    filter: 'none',
  })
}

defineExpose({ focus: () => linkRef.value?.focus({ preventScroll: true }) })
onBeforeUnmount(() => {
  if (coverRef.value instanceof HTMLVideoElement) coverRef.value.pause()
  if (introRef.value instanceof HTMLVideoElement) introRef.value.pause()
})
</script>

<style scoped>
.gallery-artwork { position: absolute; display: block; color: var(--brand-red); text-decoration: none; touch-action: pan-y; container-type: inline-size; }
.gallery-artwork figure { margin: 0; }
.gallery-artwork__painting { position: relative; width: 100%; height: var(--painting-height); }
.gallery-artwork__viewport {
  position: absolute; inset: 0; overflow: hidden;
  clip-path: inset(
    calc(var(--opening-top) * var(--frame-reveal))
    calc(var(--opening-right) * var(--frame-reveal))
    calc(var(--opening-bottom) * var(--frame-reveal))
    calc(var(--opening-left) * var(--frame-reveal))
  );
}
.gallery-artwork__media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
.gallery-artwork__frame { position: absolute; inset: 0; opacity: var(--frame-reveal); pointer-events: none; }
.gallery-artwork__caption { margin: 22px 0 0; opacity: var(--caption-reveal); text-align: center; }
.gallery-artwork__title {
  position: absolute; top: 0; left: 0; width: 100%;
  display: flex; align-items: center; justify-content: center;
  transform: translateY(calc(-100% - 28px));
  font-size: clamp(32px, 11cqw, 62px); line-height: 1.1; text-wrap: balance;
}
.gallery-artwork[data-project-slug="Migration"] .gallery-artwork__title { font-size: clamp(45px, 15.5cqw, 85px); }
.gallery-artwork[data-project-slug="Moi"] .gallery-artwork__title { font-size: clamp(42px, 14cqw, 78px); }
.gallery-artwork__logo { display: block; width: auto; height: clamp(52px, 18cqw, 94px); max-width: 90%; object-fit: contain; object-position: center; }
.gallery-artwork__logo--klanggestalten { height: clamp(70px, 22cqw, 108px); }
.gallery-artwork__logo--kilma { height: clamp(72px, 26cqw, 140px); }
.gallery-artwork.has-project-logo:not(.has-hover-logo) .gallery-artwork__title-text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
.gallery-artwork.has-hover-logo .gallery-artwork__title { min-height: clamp(52px, 18cqw, 94px); }
.gallery-artwork.has-hover-logo .gallery-artwork__title-text { font-size: clamp(32px, 10cqw, 56px); transition: opacity 220ms ease, transform 220ms ease; }
.gallery-artwork.has-hover-logo .gallery-artwork__logo { position: absolute; inset: 0; margin: auto; opacity: 0; transform: translateY(6px); transition: opacity 220ms ease, transform 220ms ease; }
.gallery-artwork.has-hover-logo:is(:hover, :focus-visible) .gallery-artwork__title-text { opacity: 0; transform: translateY(-6px); }
.gallery-artwork.has-hover-logo:is(:hover, :focus-visible) .gallery-artwork__logo { opacity: 1; transform: translateY(0); }
.gallery-artwork__year { display: block; font-size: 13px; line-height: 1.3; letter-spacing: 0.14em; opacity: 0.72; }
.gallery-artwork:focus-visible { outline: none; }
.gallery-artwork:focus-visible .gallery-artwork__title { text-decoration: underline; text-underline-offset: 5px; }
.gallery-artwork:not(.is-enabled) { pointer-events: none; }
@media (max-width: 767px) {
  .gallery-artwork__title { transform: translateY(calc(-100% - 24px)); }
  .gallery-artwork__year { font-size: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .gallery-artwork.has-hover-logo .gallery-artwork__title-text,
  .gallery-artwork.has-hover-logo .gallery-artwork__logo { transition: none; }
}
</style>
