<template>
  <section class="contact-screen" aria-label="Kontakt">
    <!-- Poster-Bild, sichtbar bis Video spielt -->
    <img
      v-if="!isVideoPlaying"
      class="posterImage"
      :src="posterSrc"
      alt="Kontakt Hintergrund"
    />
    <video
      class="bgVideo"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
      @loadeddata="onVideoLoaded"
      @playing="onVideoPlaying"
    >
      <source :src="videoSrc" type="video/mp4" />
    </video>
    <div class="overlay" aria-hidden="true"></div>

    <div class="content">
      <div class="links">
        <a class="email" href="mailto:leon-albers@web.de">leon-albers@web.de</a>
        <a
          class="instagram"
          href="https://www.instagram.com/leonsideas"
          target="_blank"
          rel="noopener noreferrer"
        >
          @leonsideas
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'
import { ref } from 'vue'

const videoSrc = withBase('/videos/contact-bg.mp4')
const posterSrc = withBase('/images/contact.png')

const isVideoPlaying = ref(false)

const onVideoLoaded = () => {
  // optional: könnte schon hier auf true setzen
}

const onVideoPlaying = () => {
  isVideoPlaying.value = true
}
</script>

<style scoped>
.contact-screen {
  position: fixed;
  top: 0;
  left: 0;

  width: 100vw;
  height: 100vh;

  margin: 0;
  padding: 0;
  background: #000;
  z-index: 0;
  overflow: hidden; /* wichtig gegen "Springen" */
}

/* Poster-Bild über dem Video, gleiche Position/Größe */
.posterImage,
.bgVideo {
  position: absolute; /* statt fixed */
  top: 0;
  left: 0;

  width: 100%;
  height: 100%;

  object-fit: cover;
}

/* Bild über dem Video, bis dieses spielt */
.posterImage {
  z-index: 0;
  pointer-events: none;
}

.bgVideo {
  z-index: -1; /* hinter dem Bild, aber im selben Container */
  pointer-events: none;
}

/* Dunkles Overlay */
.overlay {
  position: absolute;
  top: 0;
  left: 0;

  width: 100%;
  height: 100%;

  background: rgba(0, 0, 0, 0.1);
  z-index: 1;
  pointer-events: none;
}

/* Content */
.content {
  position: absolute;
  top: 0;
  left: 0;

  width: 100%;
  height: 100%;

  z-index: 10;
  display: grid;
  place-items: center;
  padding: 24px;
  text-align: center;
}

/* Container für Links */
.links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Mail-Link */
.email {
  font-weight: 800;
  letter-spacing: 0.02em;
  text-decoration: none;

  color: #000;
  font-size: clamp(28px, 6vw, 72px);
  line-height: 1.05;
}

.email:hover {
  text-decoration: underline;
}

/* Instagram-Link */
.instagram {
  font-weight: 800;
  letter-spacing: 0.02em;
  text-decoration: none;
  color: #000;
  font-size: clamp(28px, 6vw, 72px);
  line-height: 1.05;
}

.instagram:hover {
  text-decoration: underline;
}

</style>
