import { shallowRef } from 'vue'
import type { CoverMedia } from './useCoverMedia'

export type OpeningBox = { left: number; top: number; width: number; height: number }
export type ProjectOpening = {
  slug: string
  title: string
  href: string
  media: CoverMedia
  poster: string
  previewSrc: string
  currentTime: number
  openingBox: OpeningBox
  sourceBox: OpeningBox
  filter?: string
}

// Im Layout gehalten: die Überblendung bleibt beim Seitenwechsel sichtbar.
export const projectOpening = shallowRef<ProjectOpening | null>(null)

export function beginProjectOpening(opening: ProjectOpening) {
  if (!projectOpening.value) projectOpening.value = opening
}
