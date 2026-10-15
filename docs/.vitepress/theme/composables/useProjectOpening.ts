import { shallowRef } from 'vue'
import type { CoverMedia } from './useCoverMedia'

export type OpeningBox = { left: number; top: number; width: number; height: number }
type OpeningProject = {
  slug: string
  title: string
  href: string
}

export type MediaProjectOpening = OpeningProject & {
  kind?: 'media'
  media: CoverMedia
  poster: string
  previewSrc: string
  currentTime: number
  openingBox: OpeningBox
  sourceBox: OpeningBox
  filter?: string
}

export type SceneProjectOpening = OpeningProject & {
  kind: 'scene'
  source: HTMLElement
}

export type ProjectOpening = MediaProjectOpening | SceneProjectOpening

// Im Layout gehalten: die Überblendung bleibt beim Seitenwechsel sichtbar.
export const projectOpening = shallowRef<ProjectOpening | null>(null)

export function beginProjectOpening(opening: ProjectOpening) {
  if (!projectOpening.value) projectOpening.value = opening
}

export function beginSceneProjectOpening(opening: Omit<SceneProjectOpening, 'kind'>) {
  beginProjectOpening({ ...opening, kind: 'scene' })
}
