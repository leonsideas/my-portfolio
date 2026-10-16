// Alle Seiten benutzen am Handy denselben Querformat-Raum wie die Herde.
const MOBILE_DESKTOP = '(max-width: 1023px) and (pointer: coarse)'
const ROTATED_SITE = '(orientation: portrait) and (max-width: 900px) and (pointer: coarse)'

export function isSiteRotated() {
  return typeof window !== 'undefined' && window.matchMedia(ROTATED_SITE).matches
}

export function sitePoint(x: number, y: number) {
  return isSiteRotated() ? { x: y, y: window.innerWidth - x } : { x, y }
}

export function screenPoint(x: number, y: number) {
  return isSiteRotated() ? { x: window.innerWidth - y, y: x } : { x, y }
}

export function setupSiteViewport() {
  const mobile = window.matchMedia(MOBILE_DESKTOP)
  const rotated = window.matchMedia(ROTATED_SITE)
  const update = () => {
    document.documentElement.classList.toggle('mobile-desktop', mobile.matches)
    document.documentElement.classList.toggle('site-rotated', rotated.matches)
  }
  mobile.addEventListener('change', update)
  rotated.addEventListener('change', update)
  update()
  return () => {
    mobile.removeEventListener('change', update)
    rotated.removeEventListener('change', update)
    document.documentElement.classList.remove('mobile-desktop', 'site-rotated')
  }
}
