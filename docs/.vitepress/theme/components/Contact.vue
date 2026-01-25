<template>
  <section class="contact-screen" aria-label="Kontakt">
    <video
      class="bgVideo"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
    >
      <source :src="videoSrc" type="video/mp4" />
    </video>
    <div class="overlay" aria-hidden="true"></div>

    <div class="content">
      <a class="email" href="mailto:leon-albers@web.de">leon-albers@web.de</a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'

const videoSrc = withBase('/videos/contact-bg.mp4')
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
  z-index: 0; /* Hintergrund-Layer */
}

/* Hintergrundvideo */
.bgVideo {
  position: fixed;
  top: 0;
  left: 0;

  width: 100vw;
  height: 100vh;

  object-fit: cover;

  z-index: 0;
  pointer-events: none;
}

/* Dunkles Overlay */
.overlay {
  position: fixed;
  top: 0;
  left: 0;

  width: 100vw;
  height: 100vh;

  background: rgba(0, 0, 0, 0.1);
  z-index: 1;
  pointer-events: none;
}

/* Content */
.content {
  position: fixed;
  top: 0;
  left: 0;

  width: 100vw;
  height: 100vh;

  z-index: 10; /* über Video, aber unter Navbar falls diese höher ist */

  display: grid;
  place-items: center;
  padding: 24px;
  text-align: center;
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

</style>
