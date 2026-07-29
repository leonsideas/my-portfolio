import { onBeforeUnmount } from 'vue'

/**
 * Schwarzweiß-Filter für das Hintergrundmotiv, in zwei Ausprägungen:
 *
 *   'dither' – reines 1-Bit-Schwarzweiß mit Bayer-Raster (Zeitungsdruck,
 *              alter Mac). Nur zwei Töne, Zwischenwerte entstehen durch das
 *              Punktmuster.
 *   'gameboy' – vier abgestufte Displayfarben mit feinem Bayer-Raster.
 *   'ascii'  – jede Zelle wird durch ein Schriftzeichen ersetzt, dessen
 *              Dichte der Helligkeit entspricht.
 *
 * Beiden gemeinsam ist die Tonwertspreizung: Ohne sie nutzt ein flaues Video
 * nur die Mitte des Umfangs und das Motiv verschwindet im Raster.
 */

export const BACKGROUND_FILTER = {
  /**
   * Welcher Look.
   *   'halftone'  – Punktraster wie im Siebdruck: große, ruhige Punkte auf
   *                 Schwarz. Für Text der freundlichste, weil das Raster
   *                 grobkörnig ist und nicht gegen die Buchstaben arbeitet.
   *   'threshold' – harte Schwelle: geschlossene schwarze und weiße Flächen,
   *                 ganz ohne Korn.
   *   'dither'    – 1-Bit-Schwarzweiß mit Bayer-Raster.
   *   'gameboy'   – vierfarbiger Handheld-Look mit feinem Pixelraster.
   *   'ascii'     – Zeichen statt Pixel.
   *   'none'      – kein Filter, das Medium wird unveraendert gezeigt.
   */
  mode: 'none' as 'none' | 'motion' | 'subject' | 'halftone' | 'threshold' | 'dither' | 'gameboy' | 'ascii',

  /**
   * Nur 'motion': Sichtbar wird nur, was sich bewegt. Der Filter vergleicht
   * aufeinanderfolgende Bilder; stehende Bildteile bleiben schwarz.
   * Standbilder (Cover ohne Video) haetten damit gar nichts zu zeigen –
   * dafuer gibt es den Rueckfall weiter unten.
   */
  motionCell: 4,
  /** Verstaerkung des Unterschieds zwischen zwei Bildern. */
  motionGain: 14,
  /** Unterschiede darunter gelten als Rauschen und werden verworfen. */
  motionNoise: 0.02,
  /**
   * Nachleuchten: Wie viel der vorigen Bewegung stehen bleibt (0…1).
   * Ohne das flackert nur ein duenner Umriss, mit ziehen die Motive Spuren.
   */
  motionDecay: 0.86,

  /**
   * Nur 'subject': Das Video bleibt unangetastet, nur die hellen Motivteile
   * – die Schafe – werden grob verpixelt. Die Trennung laeuft ueber die
   * Helligkeit, es gibt keine echte Freistellung: Was heller als
   * subjectThreshold ist, bekommt Bloecke, der Rest bleibt durchsichtig.
   */
  subjectCell: 7,
  /** Ab welcher Helligkeit (0…1) ein Bereich als Motiv gilt. */
  subjectThreshold: 0.58,
  /** Weiche Kante der Maske, damit die Bloecke nicht hart abreissen. */
  subjectFeather: 0.16,
  /**
   * Bloecke entsaettigen: 0 = Originalfarbe des Videos, 1 = reines
   * Schwarzweiss. Dazwischen wird gemischt.
   */
  subjectMono: 1,
  /** Kontrast innerhalb der Bloecke – hoeher trennt hell/dunkel schaerfer. */
  subjectContrast: 1.6,


  /** Nur 'halftone': Abstand der Punktmittelpunkte in Bildschirmpixeln. */
  dotSpacing: 4,
  /** Nur 'threshold': Schwelle (0…1), ab der eine Fläche hell wird. */
  threshold: 0.62,

  /** Nur 'dither': Kantenlänge eines Pixels. Kleiner = feineres Raster. */
  pixelSize: 2,

  /** Nur 'ascii': Kantenlänge einer Zeichenzelle. Kleiner = mehr Detail. */
  cellSize: 3,
  /**
   * Nur 'ascii': Alles unterhalb dieser Helligkeit (0…1) bleibt leer, der
   * Rest wird ueber die ganze Zeichenrampe gespreizt. Das ergibt denselben
   * Aufbau wie der Threshold-Modus – klare helle Silhouetten auf leerem
   * Schwarz – nur aus Zeichen statt aus Flaechen. 0 schaltet es ab.
   */
  asciiFloor: 0.08,

  /**
   * Nur 'ascii': Bei ueberwiegend hellen Motiven (Tagbilder mit grossem
   * Himmel) die Helligkeit umdrehen, bevor geschnitten wird.
   * Ohne das kippt der Filter je nach Tageszeit: Nachts ist der Hintergrund
   * dunkel und das Motiv hell, tagsueber genau andersherum – dann fuellt
   * sich der Himmel mit Zeichen und die Schafe werden zu Loechern.
   */
  asciiAutoInvert: true,

  /** Nur 'ascii': Zeichen von dunkel nach hell. */
  ramp: ' .,:;irsXA253hMHGS#9B&@',

  /** Bilder pro Sekunde der Ausgabe. Bewusst niedriger als die Bildrate des
   *  Videos – der Look lebt vom groben Raster und es spart Rechenzeit. */
  fps: 20,

  /** Tonwertspreizung je Bild an/aus. */
  autoContrast: true,
  /** Wie viel Prozent oben und unten dabei abgeschnitten werden. */
  clipPercent: 0.5,
  /** Kontrast nach der Spreizung. 1 = unverändert. */
  contrast: 1.15,
  /**
   * Helligkeit nach der Spreizung.
   * Achtung, das ist modusabhängig: 'dither' braucht rund 0.55, damit die
   * rote Schrift nicht im hellen Raster zerfällt (Rot und mittleres Grau sind
   * fast gleich hell, nur 3,7:1). 'threshold' regelt das über seinen eigenen
   * Schwellenwert und will hier 1, sonst bleibt vom Motiv nichts übrig.
   */
  brightness: 0.95,

  /**
   * Vordergrund und Hintergrund des Filters: schwarzes Punktraster auf
   * hellem Grund. Bewusst nicht im Rot der Schrift – Rot auf Rot traegt nur
   * 1,5:1, gegen Schwarz sind es 5,6:1 und gegen Creme 3,2:1. Bild und Text
   * bleiben dadurch ueberall trennbar.
   */
  // Fast schwarzes Graphit gibt dem leuchtenden Rot deutlich mehr Kontrast
  // als das vorherige Tiefblau, ohne so hart wie reines Schwarz zu wirken.
  color: '#111715',
  background: '#f2efe9',

  /**
   * Vier Game-Boy-inspirierte Displaytöne. Der hellste Ton entspricht exakt
   * dem Seitengrund; das tiefe Blau hält Abstand zu den roten Titeln.
   */
  gameBoyPalette: ['#17324d', '#526b59', '#a4ad7f', '#f2efe9'] as const,
}

// Bayer 4×4, normalisiert auf 0…1
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map(row => row.map(v => (v + 0.5) / 16))

type Source = HTMLVideoElement | HTMLImageElement

function sourceSize(src: Source): [number, number] {
  if (src instanceof HTMLVideoElement) return [src.videoWidth, src.videoHeight]
  return [src.naturalWidth, src.naturalHeight]
}

function isReady(src: Source): boolean {
  if (src instanceof HTMLVideoElement) return src.readyState >= 2
  return src.complete && src.naturalWidth > 0
}

function fontFor(cell: number) {
  return `${Math.round(cell * 1.15)}px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`
}

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '')
  const n = parseInt(v.length === 3 ? v.split('').map(c => c + c).join('') : v, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function useBackgroundFilter() {
  const sources = new Map<number, Source | null>()
  const canvases = new Map<number, HTMLCanvasElement | null>()

  // kleines Canvas zum Abtasten (ein Pixel je Zelle)
  let sampler: HTMLCanvasElement | null = null

  // Bewegungserkennung: je Ebene das vorige Bild und die nachleuchtende Spur
  type MotionState = { prev: Float32Array; acc: Float32Array; total: number; src: string; warm: boolean }
  const motionState = new Map<number, MotionState>()

  let frame: number | null = null
  let lastDraw = 0

  // Zeichenbreite der Monospace-Schrift, einmal gemessen
  let advance = 0
  let advanceKey = ''

  function samplerCtx() {
    if (!sampler) sampler = document.createElement('canvas')
    return sampler.getContext('2d', { willReadFrequently: true })
  }

  function getAdvance(ctx: CanvasRenderingContext2D, cell: number): number {
    const key = String(cell)
    if (advanceKey !== key || !advance) {
      advance = ctx.measureText('M').width || cell * 0.6
      advanceKey = key
    }
    return advance
  }

  /** Quelle formatfüllend (wie object-fit: cover) ins Raster zeichnen */
  function sampleInto(src: Source, cols: number, rows: number): Uint8ClampedArray | null {
    const sctx = samplerCtx()
    if (!sctx) return null

    const [sw, sh] = sourceSize(src)
    if (!sw || !sh) return null

    if (sampler!.width !== cols || sampler!.height !== rows) {
      sampler!.width = cols
      sampler!.height = rows
    }

    const scale = Math.max(cols / sw, rows / sh)
    const cropW = cols / scale
    const cropH = rows / scale
    sctx.drawImage(src, (sw - cropW) / 2, (sh - cropH) / 2, cropW, cropH, 0, 0, cols, rows)

    return sctx.getImageData(0, 0, cols, rows).data
  }

  /** Luminanz berechnen und auf den vollen Umfang spreizen */
  function luminance(data: Uint8ClampedArray, total: number): Float32Array {
    const lums = new Float32Array(total)
    for (let p = 0; p < total; p++) {
      const i = p * 4
      lums[p] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
    }

    let lo = 0
    let hi = 1

    if (BACKGROUND_FILTER.autoContrast) {
      const BINS = 64
      const hist = new Uint32Array(BINS)
      for (let p = 0; p < total; p++) hist[Math.min(BINS - 1, (lums[p] * BINS) | 0)]++

      const clip = Math.max(1, Math.floor((total * BACKGROUND_FILTER.clipPercent) / 100))

      let acc = 0
      for (let b = 0; b < BINS; b++) { acc += hist[b]; if (acc > clip) { lo = b / BINS; break } }
      acc = 0
      for (let b = BINS - 1; b >= 0; b--) { acc += hist[b]; if (acc > clip) { hi = (b + 1) / BINS; break } }

      // zu enger Umfang würde nur Rauschen aufblasen
      if (hi - lo < 0.08) { lo = 0; hi = 1 }
    }

    const span = hi - lo || 1
    const { contrast, brightness } = BACKGROUND_FILTER

    for (let p = 0; p < total; p++) {
      let v = (lums[p] - lo) / span
      v = (v - 0.5) * contrast + 0.5
      v *= brightness
      lums[p] = v < 0 ? 0 : v > 1 ? 1 : v
    }

    return lums
  }

  /**
   * Bewegungserkennung: Differenz zum vorherigen Bild, mit Nachleuchten.
   *
   * Der Zustand liegt je Ebene getrennt (die beiden Crossfade-Ebenen zeigen
   * unterschiedliche Motive). Wechselt das Motiv, wird der Speicher verworfen –
   * sonst wuerde der Wechsel selbst als eine einzige riesige Bewegung gelten
   * und das Bild fuer einen Moment komplett weiss aufblitzen.
   */
  function renderMotion(src: Source, canvas: HTMLCanvasElement, w: number, h: number, key: number) {
    const { motionCell, motionGain, motionNoise, motionDecay, color, background } = BACKGROUND_FILTER

    // Standbilder haben keine Bewegung – dort die Silhouetten zeigen
    if (!(src instanceof HTMLVideoElement)) {
      renderThreshold(src, canvas, w, h)
      return
    }

    const cols = Math.max(1, Math.ceil(w / motionCell))
    const rows = Math.max(1, Math.ceil(h / motionCell))

    const data = sampleInto(src, cols, rows)
    if (!data) return

    const total = cols * rows

    // Bewusst OHNE die Tonwertspreizung aus luminance(): die arbeitet pro Bild
    // und verschiebt den Gesamttonwert staendig ein wenig – jede solche
    // Verschiebung wuerde hier als flaechendeckende Bewegung erscheinen.
    const lums = new Float32Array(total)
    for (let p = 0; p < total; p++) {
      const i = p * 4
      lums[p] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
    }

    let state = motionState.get(key)
    if (!state || state.total !== total || state.src !== src.currentSrc) {
      state = { prev: new Float32Array(total), acc: new Float32Array(total), total, src: src.currentSrc, warm: false }
      motionState.set(key, state)
      state.prev.set(lums)
      // erstes Bild: noch kein Vergleich moeglich
      if (canvas.width !== cols || canvas.height !== rows) { canvas.width = cols; canvas.height = rows }
      const c0 = canvas.getContext('2d')!
      c0.fillStyle = background
      c0.fillRect(0, 0, cols, rows)
      return
    }

    const [fr, fg, fb] = hexToRgb(color)
    const [br, bg, bb] = hexToRgb(background)

    for (let p = 0; p < total; p++) {
      let diff = Math.abs(lums[p] - state.prev[p]) * motionGain
      if (diff < motionNoise) diff = 0
      if (diff > 1) diff = 1

      const decayed = state.acc[p] * motionDecay
      const v = diff > decayed ? diff : decayed
      state.acc[p] = v
      state.prev[p] = lums[p]

      const i = p * 4
      data[i] = br + (fr - br) * v
      data[i + 1] = bg + (fg - bg) * v
      data[i + 2] = bb + (fb - bb) * v
      data[i + 3] = 255
    }

    if (canvas.width !== cols || canvas.height !== rows) {
      canvas.width = cols
      canvas.height = rows
    }
    canvas.getContext('2d')!.putImageData(new ImageData(data, cols, rows), 0, 0)
  }

  /**
   * Das Canvas bleibt hier bewusst in Rasterauflösung (ein Canvas-Pixel je
   * Rasterpunkt) und wird per CSS hochskaliert – `image-rendering: pixelated`
   * hält die Kanten hart. Der frühere Weg, das Ergebnis per putImageData zu
   * schreiben und dann vergrößert weiterzuzeichnen, kostete rund 1 Sekunde
   * pro Bild, weil er die Grafikpipeline bei jedem Bild synchronisiert.
   */
  function renderDither(src: Source, canvas: HTMLCanvasElement, w: number, h: number) {
    const { pixelSize, color, background } = BACKGROUND_FILTER
    const cols = Math.max(1, Math.ceil(w / pixelSize))
    const rows = Math.max(1, Math.ceil(h / pixelSize))

    const data = sampleInto(src, cols, rows)
    if (!data) return

    const lums = luminance(data, cols * rows)
    const [fr, fg, fb] = hexToRgb(color)
    const [br, bg, bb] = hexToRgb(background)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const p = y * cols + x
        const on = lums[p] > BAYER[y & 3][x & 3]
        const i = p * 4
        data[i] = on ? fr : br
        data[i + 1] = on ? fg : bg
        data[i + 2] = on ? fb : bb
        data[i + 3] = 255
      }
    }

    if (canvas.width !== cols || canvas.height !== rows) {
      canvas.width = cols
      canvas.height = rows
    }

    canvas.getContext('2d')!.putImageData(new ImageData(data, cols, rows), 0, 0)
  }

  /**
   * Vierfarbiger Handheld-Look. Zwischen benachbarten Palettenfarben sorgt
   * das Bayer-Muster für zusätzliche Abstufungen, ohne die Pixel weichzuzeichnen.
   * Die Helligkeit ist wie beim bisherigen Nokia-Look invertiert, damit helle
   * Motive als klare dunkle Formen auf dem hellen Seitengrund erscheinen.
   */
  function renderGameBoy(src: Source, canvas: HTMLCanvasElement, w: number, h: number) {
    const { pixelSize, gameBoyPalette } = BACKGROUND_FILTER
    const cols = Math.max(1, Math.ceil(w / pixelSize))
    const rows = Math.max(1, Math.ceil(h / pixelSize))

    const data = sampleInto(src, cols, rows)
    if (!data) return

    const lums = luminance(data, cols * rows)
    const palette = gameBoyPalette.map(hexToRgb)
    const lastTone = palette.length - 1

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const p = y * cols + x
        const mapped = (1 - lums[p]) * lastTone
        const lower = Math.floor(mapped)
        const upper = Math.min(lastTone, lower + 1)
        const blend = mapped - lower
        const tone = blend > BAYER[y & 3][x & 3] ? upper : lower
        const [r, g, b] = palette[tone]
        const i = p * 4

        data[i] = r
        data[i + 1] = g
        data[i + 2] = b
        data[i + 3] = 255
      }
    }

    if (canvas.width !== cols || canvas.height !== rows) {
      canvas.width = cols
      canvas.height = rows
    }

    canvas.getContext('2d')!.putImageData(new ImageData(data, cols, rows), 0, 0)
  }

  /**
   * Halbton: je Zelle ein Punkt, dessen Fläche der Helligkeit entspricht.
   *
   * Gerechnet wird in einem kleinen Puffer (ein Pufferpixel = SUB Bildschirm-
   * pixel), der per CSS hochskaliert wird. Echte Kreise mit arc() wären hier
   * tausende Zeichenbefehle pro Bild – so ist es eine einzige Bildübertragung.
   */
  function renderHalftone(src: Source, canvas: HTMLCanvasElement, w: number, h: number) {
    const { dotSpacing, color, background } = BACKGROUND_FILTER

    // Auflösung des Puffers. Bei grobem Raster reicht die halbe Auflösung,
    // bei feinem Raster braucht es die volle – sonst liesse sich der Punkt
    // gar nicht mehr aufloesen (die Zelle waere nur noch 2 Pufferpixel breit
    // und jeder Punkt ein Quadrat).
    const SUB = dotSpacing >= 8 ? 2 : 1
    const bw = Math.max(4, Math.ceil(w / SUB))
    const bh = Math.max(4, Math.ceil(h / SUB))
    const cell = Math.max(2, Math.round(dotSpacing / SUB))

    const cols = Math.ceil(bw / cell)
    const rows = Math.ceil(bh / cell)

    const data = sampleInto(src, cols, rows)
    if (!data) return

    const lums = luminance(data, cols * rows)
    const [fr, fg, fb] = hexToRgb(color)
    const [br, bg, bb] = hexToRgb(background)

    const out = new Uint8ClampedArray(bw * bh * 4)
    const maxR = cell * 0.72 // etwas über die Zelle hinaus, damit Weiß schließt

    for (let y = 0; y < bh; y++) {
      const cy = (y / cell) | 0
      const dy = y - (cy * cell + cell / 2)

      for (let x = 0; x < bw; x++) {
        const cx = (x / cell) | 0
        const dx = x - (cx * cell + cell / 2)

        const lum = lums[cy * cols + cx] ?? 0
        const radius = Math.sqrt(lum) * maxR
        const on = dx * dx + dy * dy <= radius * radius

        const i = (y * bw + x) * 4
        out[i] = on ? fr : br
        out[i + 1] = on ? fg : bg
        out[i + 2] = on ? fb : bb
        out[i + 3] = 255
      }
    }

    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw
      canvas.height = bh
    }
    canvas.getContext('2d')!.putImageData(new ImageData(out, bw, bh), 0, 0)
  }

  /**
   * Verpixelt nur helle, wenig gesaettigte Motivteile und laesst den Rest
   * durchsichtig. Dadurch bleiben vor allem die weissen Schafe als technische
   * Raster-Silhouetten auf dem hellen Seitengrund stehen.
   */
  function renderSubject(src: Source, canvas: HTMLCanvasElement, w: number, h: number) {
    const { subjectCell, subjectThreshold, subjectFeather } = BACKGROUND_FILTER
    const cols = Math.max(1, Math.ceil(w / subjectCell))
    const rows = Math.max(1, Math.ceil(h / subjectCell))

    const data = sampleInto(src, cols, rows)
    if (!data) return

    // Farben aus der Abtastung merken, bevor luminance() sie ueberschreibt
    const rgb = Uint8ClampedArray.from(data)
    const lums = luminance(data, cols * rows)

    const out = new Uint8ClampedArray(cols * rows * 4)
    const feather = Math.max(0.001, subjectFeather)
    const [fr, fg, fb] = hexToRgb(BACKGROUND_FILTER.color)

    for (let p = 0; p < cols * rows; p++) {
      const i = p * 4
      const max = Math.max(rgb[i], rgb[i + 1], rgb[i + 2]) / 255
      const min = Math.min(rgb[i], rgb[i + 1], rgb[i + 2]) / 255
      const saturation = max > 0 ? (max - min) / max : 0
      const neutralWeight = 1 - Math.min(1, saturation * 1.8)
      const subjectScore = lums[p] * (0.62 + neutralWeight * 0.38)
      const mask = Math.min(1, Math.max(0, (subjectScore - subjectThreshold) / feather))

      out[i] = fr
      out[i + 1] = fg
      out[i + 2] = fb
      out[i + 3] = Math.round(mask * 255)
    }

    if (canvas.width !== cols || canvas.height !== rows) {
      canvas.width = cols
      canvas.height = rows
    }
    canvas.getContext('2d')!.putImageData(new ImageData(out, cols, rows), 0, 0)
  }

  /** Harte Schwelle: geschlossene Flächen, kein Raster, kein Korn. */
  function renderThreshold(src: Source, canvas: HTMLCanvasElement, w: number, h: number) {
    const { pixelSize, threshold, color, background } = BACKGROUND_FILTER
    const cols = Math.max(1, Math.ceil(w / pixelSize))
    const rows = Math.max(1, Math.ceil(h / pixelSize))

    const data = sampleInto(src, cols, rows)
    if (!data) return

    const lums = luminance(data, cols * rows)
    const [fr, fg, fb] = hexToRgb(color)
    const [br, bg, bb] = hexToRgb(background)

    for (let p = 0; p < cols * rows; p++) {
      const on = lums[p] > threshold
      const i = p * 4
      data[i] = on ? fr : br
      data[i + 1] = on ? fg : bg
      data[i + 2] = on ? fb : bb
      data[i + 3] = 255
    }

    if (canvas.width !== cols || canvas.height !== rows) {
      canvas.width = cols
      canvas.height = rows
    }
    canvas.getContext('2d')!.putImageData(new ImageData(data, cols, rows), 0, 0)
  }

  function renderAscii(src: Source, canvas: HTMLCanvasElement, w: number, h: number) {
    const { cellSize, ramp, color, background } = BACKGROUND_FILTER

    const ctx = canvas.getContext('2d')!
    ctx.font = fontFor(cellSize)
    ctx.textBaseline = 'top'

    const cellW = getAdvance(ctx, cellSize)
    const cols = Math.max(1, Math.ceil(w / cellW))
    const rows = Math.max(1, Math.ceil(h / cellSize))

    const data = sampleInto(src, cols, rows)
    if (!data) return

    const lums = luminance(data, cols * rows)
    const count = ramp.length

    // Bei hellen Motiven umdrehen, damit immer das Motiv die Zeichen bekommt
    // und die grosse ruhige Flaeche leer bleibt
    if (BACKGROUND_FILTER.asciiAutoInvert) {
      let sum = 0
      for (let p = 0; p < lums.length; p++) sum += lums[p]
      if (sum / lums.length > 0.5) {
        for (let p = 0; p < lums.length; p++) lums[p] = 1 - lums[p]
      }
    }

    // Dunkle Toene wegschneiden und den Rest neu spreizen
    const floor = BACKGROUND_FILTER.asciiFloor
    if (floor > 0) {
      const range = 1 - floor || 1
      for (let p = 0; p < lums.length; p++) {
        lums[p] = lums[p] <= floor ? 0 : (lums[p] - floor) / range
      }
    }

    ctx.fillStyle = background
    ctx.fillRect(0, 0, w, h)

    // Zeilenweise ausgeben: ein fillText je Zeile statt eines je Zeichen –
    // bei ~130 Zeilen sind das gut 200-mal weniger Zeichenbefehle pro Bild.
    ctx.fillStyle = color
    const line = new Array<string>(cols)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const index = Math.round(lums[y * cols + x] * (count - 1))
        line[x] = ramp[index < 0 ? 0 : index > count - 1 ? count - 1 : index]
      }
      ctx.fillText(line.join(''), 0, y * cellSize)
    }
  }

  function renderFrame(src: Source, canvas: HTMLCanvasElement, key: number) {
    if (BACKGROUND_FILTER.mode === 'none') return

    if (!isReady(src)) return

    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const w = Math.round(rect.width)
    const h = Math.round(rect.height)

    if (BACKGROUND_FILTER.mode === 'motion') {
      renderMotion(src, canvas, w, h, key)
    } else if (BACKGROUND_FILTER.mode === 'ascii') {
      // ASCII braucht volle Auflösung, sonst werden die Glyphen matschig
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      renderAscii(src, canvas, w, h)
    } else if (BACKGROUND_FILTER.mode === 'subject') {
      renderSubject(src, canvas, w, h)
    } else if (BACKGROUND_FILTER.mode === 'halftone') {
      renderHalftone(src, canvas, w, h)
    } else if (BACKGROUND_FILTER.mode === 'threshold') {
      renderThreshold(src, canvas, w, h)
    } else if (BACKGROUND_FILTER.mode === 'gameboy') {
      renderGameBoy(src, canvas, w, h)
    } else {
      renderDither(src, canvas, w, h)
    }
  }

  function tick(now: number) {
    frame = requestAnimationFrame(tick)

    const interval = 1000 / BACKGROUND_FILTER.fps
    if (now - lastDraw < interval) return
    lastDraw = now

    for (const [key, src] of sources) {
      const canvas = canvases.get(key)
      if (src && canvas) renderFrame(src, canvas, key)
    }
  }

  function start() {
    if (frame === null) frame = requestAnimationFrame(tick)
  }

  function stop() {
    if (frame !== null) {
      cancelAnimationFrame(frame)
      frame = null
    }
  }

  function setSource(key: number, el: unknown) {
    sources.set(key, el instanceof HTMLVideoElement || el instanceof HTMLImageElement ? el : null)
  }

  function setCanvas(key: number, el: unknown) {
    canvases.set(key, el instanceof HTMLCanvasElement ? el : null)
  }

  onBeforeUnmount(stop)

  return { setSource, setCanvas, start, stop }
}
