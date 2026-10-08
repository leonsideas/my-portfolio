export const FRAME_OUTSET = 0.08
export const FRAME_SCALE = 1 + FRAME_OUTSET * 2
export const FRAME_SLICE = 0.38

type FrameEdges = { top: number; right: number; bottom: number; left: number }
export type ProjectFrameProfile = {
  file: string
  inner: FrameEdges
  outer: FrameEdges
}

// Die ursprünglichen Ornamentrahmen. Die gemessenen Leistenkanten bestimmen
// denselben Bildbeschnitt für Vorschau, Titel und Öffnungsübergang.
const profiles: Record<string, ProjectFrameProfile> = {
  Klanggestalten: { file: 'frame-klanggestalten-red-v1.webp', inner: { top: 0.3484, right: 0.3211, bottom: 0.3945, left: 0.3211 }, outer: { top: 0.17, right: 0.128, bottom: 0.2078, left: 0.1301 } },
  Migration: { file: 'frame-migration-red-v1.webp', inner: { top: 0.3547, right: 0.3337, bottom: 0.361, left: 0.3337 }, outer: { top: 0.1427, right: 0.1238, bottom: 0.1427, left: 0.1259 } },
  Uebergangsobjekte: { file: 'frame-uebergangsobjekte-red-v1.webp', inner: { top: 0.3547, right: 0.3505, bottom: 0.4176, left: 0.3526 }, outer: { top: 0.1364, right: 0.1322, bottom: 0.2015, left: 0.1343 } },
  Stottern: { file: 'frame-stottern-red-v1.webp', inner: { top: 0.3085, right: 0.3043, bottom: 0.3085, left: 0.3064 }, outer: { top: 0.1511, right: 0.1427, bottom: 0.1532, left: 0.1448 } },
  Portfolio: { file: 'frame-portfolio-red-v1.webp', inner: { top: 0.4155, right: 0.405, bottom: 0.4197, left: 0.4071 }, outer: { top: 0.1847, right: 0.1679, bottom: 0.1889, left: 0.17 } },
  Reefresh: { file: 'frame-reefresh-red-v1.webp', inner: { top: 0.426, right: 0.4008, bottom: 0.4302, left: 0.4029 }, outer: { top: 0.2854, right: 0.256, bottom: 0.2875, left: 0.2581 } },
  Moi: { file: 'frame-moi-red-v1.webp', inner: { top: 0.34, right: 0.34, bottom: 0.3526, left: 0.3421 }, outer: { top: 0.1511, right: 0.1385, bottom: 0.1679, left: 0.1385 } },
  Kilma: { file: 'frame-kilma-red-v1.webp', inner: { top: 0.3568, right: 0.3505, bottom: 0.3714, left: 0.3526 }, outer: { top: 0.1889, right: 0.1784, bottom: 0.2015, left: 0.1784 } },
  Uebersee: { file: 'frame-uebersee-red-v1.webp', inner: { top: 0.3295, right: 0.3127, bottom: 0.3316, left: 0.3148 }, outer: { top: 0.1595, right: 0.1469, bottom: 0.1616, left: 0.1469 } },
  LightbyNight: { file: 'frame-lightbynight-red-v1.webp', inner: { top: 0.4113, right: 0.3693, bottom: 0.4386, left: 0.3693 }, outer: { top: 0.2644, right: 0.2182, bottom: 0.2917, left: 0.2182 } },
}

export function projectFrameFor(slug: string): ProjectFrameProfile {
  return profiles[slug] ?? profiles.Klanggestalten
}

export function frameDepthFor(viewportWidth: number): number {
  const depth = viewportWidth < 768
    ? Math.max(48, Math.min(80, viewportWidth * 0.18))
    : Math.max(80, Math.min(136, viewportWidth * 0.1))
  return Math.round(depth)
}
