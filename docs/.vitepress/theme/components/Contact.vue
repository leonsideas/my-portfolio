<template>
  <section
    class="contact-screen"
    aria-label="Kontakt"
    :style="{ backgroundImage: `url(${currentBgSrc})` }"
  >
    <div class="contact-overlay" aria-hidden="true" />

    <div class="contact-content">
      <div class="contact-intro">
        <h1 class="contact-heading">Sag Moin</h1>
      </div>

      <ul class="contact-links" role="list">
        <li>
          <a class="contact-link" href="mailto:leon-albers@web.de">
            <span class="contact-link-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
            <span class="contact-link-body">
              <span class="contact-link-label">E-Mail</span>
              <span class="contact-link-value">leon-albers@web.de</span>
            </span>
            <span class="contact-link-arrow" aria-hidden="true">→</span>
          </a>
        </li>
        <li>
          <a
            class="contact-link"
            href="https://www.instagram.com/leonsideas"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="contact-link-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
              </svg>
            </span>
            <span class="contact-link-body">
              <span class="contact-link-label">Instagram</span>
              <span class="contact-link-value">@leonsideas</span>
            </span>
            <span class="contact-link-arrow" aria-hidden="true">→</span>
          </a>
        </li>
      </ul>

    </div>
  </section>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const kontaktDesktopSrc = withBase('/images/Kontakt.webp')
const kontaktMobileSrc = withBase('/images/Kontakt-mobil.webp')

const kontaktNightDesktopSrc = withBase('/images/background-night2.webp')
const kontaktNightMobileSrc = withBase('/images/background-night-mobil2.webp')

const isMobile = ref(false)
const isNight = ref(false)

const currentBgSrc = computed(() => {
  if (isNight.value) {
    return isMobile.value ? kontaktNightMobileSrc : kontaktNightDesktopSrc
  }
  return isMobile.value ? kontaktMobileSrc : kontaktDesktopSrc
})

const updateIsMobile = () => {
  if (typeof window === 'undefined') return
  isMobile.value = window.innerWidth < 768
}

const updateIsNight = () => {
  if (typeof window === 'undefined') return
  const hour = new Date().getHours()
  isNight.value = hour >= 20 || hour < 6
}

const previousTitle = typeof document !== 'undefined' ? document.title : ''
let nightCheckInterval: number | undefined

onMounted(() => {
  document.title = 'Kontakt'
  updateIsMobile()
  updateIsNight()
  window.addEventListener('resize', updateIsMobile)
  nightCheckInterval = window.setInterval(updateIsNight, 60 * 1000)
})

onBeforeUnmount(() => {
  document.title = previousTitle
  window.removeEventListener('resize', updateIsMobile)

  if (nightCheckInterval) {
    window.clearInterval(nightCheckInterval)
  }
})
</script>

<style scoped>
.contact-screen {
  position: fixed;
  inset: 0;
  margin: 0;
  padding: 0;
  background-color: #000;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
  overflow: hidden;
  color: #fff;
}

/* Dezenter dunkler Verlauf oben und unten, damit Text auf hellem Hintergrund
   immer gut lesbar bleibt */
.contact-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.15) 35%, rgba(0, 0, 0, 0.15) 65%, rgba(0, 0, 0, 0.65) 100%);
  z-index: 1;
}

.contact-content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: clamp(120px, 16vh, 200px) clamp(20px, 6vw, 48px) clamp(40px, 8vh, 72px);
  text-align: center;
  gap: clamp(24px, 5vh, 48px);
}

/* Intro */
.contact-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  max-width: 34rem;
}

.contact-eyebrow {
  font-size: 0.7rem;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  padding: 0.4rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: rgba(255, 255, 255, 0.9);
}

.contact-heading {
  margin: 0;
  font-family: var(--font-heading, "Playfair Display"), Georgia, serif;
  font-weight: 600;
  font-style: italic;
  font-size: clamp(2.75rem, 11vw, 5.25rem);
  line-height: 1;
  letter-spacing: -0.02em;
  color: #fff;
  text-shadow: 0 1px 24px rgba(0, 0, 0, 0.5);
}

.contact-lead {
  margin: 0;
  font-size: clamp(0.95rem, 2.8vw, 1.125rem);
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.88);
  max-width: 32rem;
  text-shadow: 0 1px 14px rgba(0, 0, 0, 0.55);
}

/* Links */
.contact-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 26rem;
}

/* Desktop: Links nebeneinander, damit sie weniger vom Motiv verdecken */
@media (min-width: 768px) {
  .contact-links {
    flex-direction: row;
    justify-content: center;
    align-items: stretch;
    max-width: 52rem;
    gap: 1rem;
  }

  .contact-links > li {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
  }

  .contact-links > li > .contact-link {
    width: 100%;
  }
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.95rem 1.1rem 0.95rem 1rem;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #fff;
  text-decoration: none;
  text-align: left;
  transition:
    transform 220ms ease,
    border-color 220ms ease,
    background 220ms ease;
}

.contact-link:hover,
.contact-link:focus-visible {
  outline: none;
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.55);
  background: rgba(0, 0, 0, 0.5);
}

.contact-link-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.contact-link-icon svg {
  width: 20px;
  height: 20px;
  color: #fff;
}

.contact-link-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.contact-link-label {
  font-size: 0.7rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.contact-link-value {
  font-size: clamp(0.95rem, 3.4vw, 1.05rem);
  font-weight: 500;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-link-arrow {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.55);
  transition: transform 220ms ease, color 220ms ease;
}

.contact-link:hover .contact-link-arrow,
.contact-link:focus-visible .contact-link-arrow {
  color: #fff;
  transform: translateX(4px);
}

/* Footer */
.contact-footer {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.55);
}

.contact-footer-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: #7ee787;
  box-shadow: 0 0 10px rgba(126, 231, 135, 0.65);
}

@media (max-width: 420px) {
  .contact-link {
    gap: 0.75rem;
    padding: 0.85rem 0.9rem 0.85rem 0.9rem;
  }
  .contact-link-icon {
    width: 36px;
    height: 36px;
  }
  .contact-link-value {
    font-size: 0.95rem;
  }
}
</style>