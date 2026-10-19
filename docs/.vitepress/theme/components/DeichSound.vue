<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { useSiteLanguage } from '../composables/useSiteLanguage'
import { deichNight } from '../composables/deichSound'

const { text } = useSiteLanguage()
const sheep = ref<HTMLAudioElement | null>(null)
const enabled = ref(false)
const busy = ref(false)
const failed = ref(false)
const label = computed(() => failed.value
  ? text('Ton nicht verfügbar – erneut versuchen', 'Sound unavailable – try again')
  : enabled.value ? text('Ton ausschalten', 'Turn sound off') : text('Ton einschalten', 'Turn sound on'))

let context: AudioContext | null = null
let windGain: GainNode | null = null
let windFilter: BiquadFilterNode | null = null
let wind: AudioBufferSourceNode | null = null
let gust: OscillatorNode | null = null
let sheepTimer: number | undefined
let suspendTimer: number | undefined
let disposed = false

function clearTimers() {
  window.clearTimeout(sheepTimer)
  window.clearTimeout(suspendTimer)
}

function makeWind() {
  const Audio = window.AudioContext || (window as any).webkitAudioContext
  if (!Audio) throw new Error('Web Audio unavailable')
  context = new Audio()
  const ctx = context!
  // A quiet, slowly changing breeze; no downloaded track or repeating melody.
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 6, ctx.sampleRate)
  const samples = buffer.getChannelData(0)
  let brown = 0
  for (let i = 0; i < samples.length; i++) {
    brown = (brown + 0.02 * (Math.random() * 2 - 1)) / 1.02
    samples[i] = brown * 3.5
  }
  wind = ctx.createBufferSource()
  wind.buffer = buffer
  wind.loop = true
  const rumble = ctx.createBiquadFilter()
  rumble.type = 'highpass'
  rumble.frequency.value = 65
  windFilter = ctx.createBiquadFilter()
  windFilter.type = 'lowpass'
  windFilter.frequency.value = deichNight.value ? 650 : 1100
  windGain = ctx.createGain()
  windGain.gain.value = 0
  wind.connect(rumble).connect(windFilter).connect(windGain).connect(ctx.destination)
  gust = ctx.createOscillator()
  gust.frequency.value = 0.075
  const gustDepth = ctx.createGain()
  gustDepth.gain.value = 0.04
  gust.connect(gustDepth).connect(windGain.gain)
  wind.start()
  gust.start()
}

function scheduleSheep(delay = 1500) {
  window.clearTimeout(sheepTimer)
  if (!enabled.value || document.hidden || disposed) return
  sheepTimer = window.setTimeout(async () => {
    const audio = sheep.value
    if (audio && enabled.value && !document.hidden && !deichNight.value) {
      audio.currentTime = 0
      audio.volume = 0.16 + Math.random() * 0.06
      audio.playbackRate = 0.96 + Math.random() * 0.08
      try {
        await audio.play()
        if (!enabled.value || document.hidden || disposed || deichNight.value) audio.pause()
      } catch {
        failed.value = true
        enabled.value = false
        hush()
        return
      }
    }
    scheduleSheep(22000 + Math.random() * 16000)
  }, delay)
}

function hush() {
  clearTimers()
  sheep.value?.pause()
  const ctx = context
  if (ctx && ctx.state !== 'closed') {
    windGain?.gain.setTargetAtTime(0, ctx.currentTime, 0.08)
    suspendTimer = window.setTimeout(() => { if (ctx.state !== 'closed') void ctx.suspend() }, 300)
  }
}

async function start() {
  clearTimers()
  if (!context) makeWind()
  await context!.resume()
  if (disposed || !enabled.value || document.hidden) return
  windGain?.gain.setTargetAtTime(0.16, context!.currentTime, 0.5)
  scheduleSheep()
}

async function toggle() {
  if (enabled.value) {
    enabled.value = false
    hush()
    return
  }
  enabled.value = true
  failed.value = false
  busy.value = true
  try { await start() }
  catch { failed.value = true; enabled.value = false; hush() }
  finally { busy.value = false }
}

function onVisibility() {
  if (document.hidden) hush()
  else if (enabled.value) void start().catch(() => { enabled.value = false; hush() })
}

watch(deichNight, night => {
  if (context && windFilter) windFilter.frequency.setTargetAtTime(night ? 650 : 1100, context.currentTime, 2)
  if (night) sheep.value?.pause()
  if (enabled.value) scheduleSheep()
})

onMounted(() => document.addEventListener('visibilitychange', onVisibility))
onBeforeUnmount(() => {
  disposed = true
  enabled.value = false
  clearTimers()
  document.removeEventListener('visibilitychange', onVisibility)
  sheep.value?.pause()
  wind?.stop()
  gust?.stop()
  if (context && context.state !== 'closed') void context.close()
})
</script>

<template>
  <button
    class="deich-sound"
    type="button"
    :aria-label="label"
    :title="label"
    :aria-pressed="enabled"
    :disabled="busy"
    @click="toggle"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <template v-if="enabled">
        <path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
      </template>
      <path v-else d="m16 9 6 6m0-6-6 6" />
    </svg>
    <audio ref="sheep" :src="withBase('/audio/sheep.mp3')" preload="none" aria-hidden="true" />
  </button>
</template>

<style scoped>
.deich-sound {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 22px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  pointer-events: auto;
  transition: opacity 180ms ease;
}
.deich-sound::after { content: ''; position: absolute; inset: -11px -10px; }
.deich-sound svg { width: 21px; height: 21px; }
.deich-sound:hover { opacity: 0.65; }
.deich-sound:focus-visible { outline: 1px solid currentColor; outline-offset: 5px; }
.deich-sound:disabled { cursor: wait; opacity: 0.5; }
</style>
