// Startseite: die Projekt-Herde auf dem Deich, wie in der Blender-Szene (blender/build_scene.py).
// Koordinaten: Blender (x, y, z) -> Three (x, z, -y). Meer liegt bei Blender -Y, also Three +Z.
// starteDeich(root, ui) hängt die Szene in ein Element der Seite; stop() gibt beim Seitenwechsel alles wieder frei.
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createHerd } from './herde.js'
import { dateien, qualitaet } from './dateien.js'
import { erzeugeHimmel } from './himmel.js'

const QUALITAET = qualitaet() // Leistungsstufe (dateien.js)
const D = dateien(QUALITAET)
const b2t = (x, y, z) => new THREE.Vector3(x, z, -y)

// ---------------------------------------------------------------------------
// Deichprofil (gleiche Werte wie blender/build_scene.py)
// ---------------------------------------------------------------------------
const CROWN_Z = 3.2, CROWN_HALF = 2.5, SLOPE_END = 7.5, BERM_END = 9.3, EDGE_END = 10.8, BERM_Z = 1.0, WATER_Z = 0.4
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

function profile (v) {
  const d = Math.abs(v)
  if (d <= CROWN_HALF) return CROWN_Z - 0.08 * (d / CROWN_HALF) ** 2
  if (d <= SLOPE_END) {
    const t = (d - CROWN_HALF) / (SLOPE_END - CROWN_HALF)
    return (CROWN_Z - 0.08) + (BERM_Z - CROWN_Z + 0.08) * t + 0.1 * Math.sin(Math.PI * t) * (0.5 - t)
  }
  if (v < 0) { // Seeseite: Asphaltweg, Steinschüttung, Watt
    if (d <= BERM_END) return BERM_Z - 0.02 * (d - SLOPE_END)
    if (d <= EDGE_END) return BERM_Z - 0.04 - 0.7 * (d - BERM_END) / (EDGE_END - BERM_END)
    return 0.26 - 0.06 * smooth(EDGE_END, EDGE_END + 6, d)
  }
  if (d <= 12) return BERM_Z - 0.04 * (d - SLOPE_END) / 4.5 // Landseite: Deichweg, Berme
  if (d <= 14.5) return 0.96 - 0.75 * Math.sin(Math.PI * (d - 12) / 2.5) // Graben
  return 0.9
}
const zone = (v) => {
  const d = Math.abs(v)
  if (d <= SLOPE_END) return 'gras'
  if (v < 0) return d <= BERM_END ? 'asphalt' : d <= EDGE_END ? 'steine' : 'watt'
  return 'gras'
}

// root: Element, das die Szene ausfüllt (das Canvas kommt davor)
// ui: { panel, assets, logos, basis, gedreht, zuLokal, zuBildschirm, fortschritt } – Bedienelemente, Pfade, 90°-Drehung am Handy
export function starteDeich (root, ui) {
  const ab = new AbortController(), signal = ab.signal // entfernt beim Stoppen alle Event-Listener
  const breite = () => root.clientWidth, hoehe = () => root.clientHeight
  let aus = false, rafId = 0

  // ---------------------------------------------------------------------------
  // Renderer, Kamera, Steuerung
  // ---------------------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, QUALITAET.pixelRatio))
  renderer.setSize(breite(), hoehe())
  renderer.toneMapping = THREE.AgXToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  root.prepend(renderer.domElement)


  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, breite() / hoehe(), 0.1, 20000)
  // Feste Kamera, die man nicht bewegen kann: Blickrichtung wie CAM_1_Frontblick aus Blender
  // ((0, 11.5, 3.2) -> Ziel (0, 0, 2.55)), auf 16 m zurückgesetzt, damit die ganze Herde ins Bild passt.
  // Das Bild ist immer quer: Im Hochformat zeigt die Seite es als 16:9-Streifen (DeichHerde.vue).
  // ?blick=nah: Nahansicht auf das Schaf zum Vergleich mit dem Blender-Render
  const nah = new URLSearchParams(location.search).get('blick') === 'nah'
  const startKamera = () => nah
    ? { pos: b2t(1.4, 9.0, 3.05), target: b2t(2.0, 5.6, 2.75) }
    : { pos: b2t(0, 16, 3.45), target: b2t(0, 0, 2.55) }
  const camTarget = startKamera().target // Bezugspunkt für Sonne und Mond
  camera.position.copy(startKamera().pos)
  // Blender-Brennweite (36-mm-Sensor, Auto-Fit) -> vertikaler Three-FOV
  const setFov = () => {
    const aspect = breite() / hoehe()
    const half = aspect >= 1 ? 18 / (24 * aspect) : 18 / 24 // 24 mm (CAM_1); quer passt die Bildbreite, hoch die Bildhöhe
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(half))
    camera.updateProjectionMatrix()
  }
  setFov()

  // Kein Umschauen/Zoomen: nur ein Blickziel, das die Kamerafahrt zum Fokus verschiebt
  const controls = {
    target: camTarget.clone(),
    update () { camera.lookAt(this.target) }
  }
  controls.update()

  // ---------------------------------------------------------------------------
  // Himmel und Licht nach echtem Sonnenstand (himmel.js). Nachts (Sonne tiefer als 6° unter dem Horizont)
  // legen sich die Tiere schlafen. Zum Testen: ?zeit=tag|nacht|HH:MM, ?zeitraffer=60 (60-fache Geschwindigkeit).
  // ---------------------------------------------------------------------------
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.4)
  sun.castShadow = true
  sun.shadow.mapSize.set(QUALITAET.schatten, QUALITAET.schatten)
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 90 }) // Sonne kommt aus allen Richtungen
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.02
  scene.add(sun, sun.target)
  const himmel = erzeugeHimmel(renderer, scene, sun, camTarget)

  const params = new URLSearchParams(location.search)
  const zeitParam = params.get('zeit')
  const zeitraffer = Number(params.get('zeitraffer')) || 1
  const startZeit = (() => {
    const d = new Date()
    if (zeitParam === 'tag') d.setHours(13, 0, 0, 0)
    else if (zeitParam === 'nacht') d.setHours(1, 0, 0, 0)
    else if (/^\d{1,2}:\d{2}$/.test(zeitParam ?? '')) d.setHours(...zeitParam.split(':').map(Number), 0, 0)
    return d.getTime()
  })()
  const startUhr = performance.now()
  const jetzt = () => new Date(startZeit + (performance.now() - startUhr) * zeitraffer)
  const istNacht = (zustand) => zustand.hoehe < -6

  // ---------------------------------------------------------------------------
  // Deich und Wasser
  // ---------------------------------------------------------------------------
  const texLoader = new THREE.TextureLoader()
  function rasen () {
    // Poly Haven „aerial_grass_rock“, auf 1K WebP verkleinert (0,5 MB statt 7,9 MB)
    const load = (kind, srgb) => {
      const t = texLoader.load(ui.assets + (kind === 'diff' ? D.grasFarbe : D.grasNormal))
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.anisotropy = 8
      if (srgb) t.colorSpace = THREE.SRGBColorSpace
      return t
    }
    return new THREE.MeshStandardMaterial({ map: load('diff', true), normalMap: load('nor_gl'), roughness: 0.95, color: 0x6f9a3a })
  }

  function buildDike () {
    const mats = {
      gras: rasen(),
      // Seeseite liegt hinter der Deichkrone und ist von vorn nicht zu sehen: schlichte Materialien ohne Texturen
      asphalt: new THREE.MeshStandardMaterial({ color: 0x4a4a48, roughness: 0.9 }),
      steine: new THREE.MeshStandardMaterial({ color: 0x5b5852, roughness: 0.85 }),
      watt: new THREE.MeshStandardMaterial({ color: 0x2b2620, roughness: 0.35 })
    }
    const names = Object.keys(mats)
    // Gitter in Blender-Koordinaten, Material pro Dreieck nach Zone
    const xs = [], ys = []
    for (let x = -60; x <= 60; x += x < -30 || x >= 30 ? 2 : 0.25) xs.push(x)
    for (let y = -40; y <= 20; y += y < -16 ? 1 : 0.15) ys.push(y)
    const pos = [], uv = []
    const groups = Object.fromEntries(names.map(n => [n, []]))
    ys.forEach((y) => xs.forEach((x) => {
      const p = b2t(x, y, profile(y))
      pos.push(p.x, p.y, p.z)
      uv.push(x / 4, y / 4) // 1 Kachel = 4 m
    }))
    const nx = xs.length
    for (let j = 0; j < ys.length - 1; j++) {
      const z = zone((ys[j] + ys[j + 1]) / 2)
      for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i
        groups[z].push(a, a + 1, a + nx, a + 1, a + nx + 1, a + nx)
      }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    const index = new Uint32Array(names.reduce((sum, n) => sum + groups[n].length, 0))
    let offset = 0
    names.forEach((n, k) => { geo.addGroup(offset, groups[n].length, k); index.set(groups[n], offset); offset += groups[n].length })
    geo.setIndex(new THREE.BufferAttribute(index, 1))
    geo.computeVertexNormals()
    const mesh = new THREE.Mesh(geo, names.map(n => mats[n]))
    mesh.receiveShadow = true
    scene.add(mesh)

    // Meer und Hinterland
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000),
      new THREE.MeshPhysicalMaterial({ color: 0x0d2a30, roughness: 0.12, metalness: 0, clearcoat: 0.3 }))
    sea.rotation.x = -Math.PI / 2
    sea.position.y = WATER_Z
    scene.add(sea)
  }

  // ---------------------------------------------------------------------------
  const clock = new THREE.Clock()
  function animate () {
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime
    const zustand = himmel.update(jetzt(), t, camera)
    world.tageslicht = zustand.tageslicht
    if (herd && istNacht(zustand) !== world.nacht) { world.nacht = istNacht(zustand); herd.setNacht(world.nacht) }
    herd?.update(t, dt)
    controls.update()
    renderer.render(scene, camera)
    rafId = requestAnimationFrame(animate)
  }

  addEventListener('resize', () => {
    camera.aspect = breite() / hoehe()
    setFov()
    renderer.setSize(breite(), hoehe())
  }, { signal })

  // Gemeinsame Welt für die Herde
  const world = {
    scene, camera, controls, clock, profile, b2t, qualitaet: QUALITAET, dateien: D, root, ui, signal, startKamera,
    panelUnten: () => innerWidth <= 700 && !ui.gedreht(), // gleiche Grenze wie im CSS von DeichHerde.vue
    // Liegt ein Tier an (x, y) im Bild der Startkamera? (Rand lässt Platz für den Titel darüber)
    imBild: (() => {
      const pruef = new THREE.PerspectiveCamera()
      const p = new THREE.Vector3()
      return (x, y) => {
        const s = startKamera()
        pruef.copy(camera)
        pruef.position.copy(s.pos)
        pruef.lookAt(s.target)
        pruef.updateMatrixWorld()
        p.copy(b2t(x, y, profile(y) + 0.9)).project(pruef)
        return Math.abs(p.x) < 0.8 && p.y > -0.8 && p.y < 0.75
      }
    })(),
    // Yaw (Blender-Winkel = Three-Drehung um +Y), bei dem die Vorderseite (+Z lokal) zur Startkamera zeigt
    faceCamera: (x, y) => Math.atan2(camera.position.x - x, camera.position.z + y)
  }
  let herd = null
  buildDike()
  world.nacht = istNacht(himmel.update(jetzt(), 0, camera))
  const bereit = (async () => {
    // Ladefortschritt für den Ladebildschirm (zählt Dateien aller Three-Loader)
    THREE.DefaultLoadingManager.onProgress = (url, fertig, gesamt) => { if (!aus) ui.fortschritt?.(fertig / gesamt) }
    const h = await createHerd(world)
    THREE.DefaultLoadingManager.onProgress = undefined
    if (aus) return
    herd = h
    if (world.nacht) herd.setNacht(true, true)
    // ?debug: Testzugriff; simulate(s) rechnet das Verhalten im Zeitraffer ohne Darstellung
    if (new URLSearchParams(location.search).has('debug')) {
      window.__debug = {
        herd, renderer, scene, camera,
        render () { controls.update(); renderer.render(scene, camera) },
        simulate (seconds, step = 1 / 60) {
          let t = clock.elapsedTime
          for (let i = 0; i < seconds / step; i++) { t += step; herd.update(t, step) }
          clock.elapsedTime = t
          return herd.tiere.map(s => `${s.cfg.slug}: ${s.mode} (${s.pos.x.toFixed(1)}, ${s.pos.y.toFixed(1)})`)
        }
      }
    }
    animate()
  })()

  return {
    bereit,
    get herd () { return herd },
    stop () {
      aus = true
      ab.abort()
      cancelAnimationFrame(rafId)
      himmel.dispose()
      renderer.dispose()
      renderer.forceContextLoss() // GPU-Speicher sofort freigeben, nicht erst bei der Garbage Collection
      renderer.domElement.remove()
      if (window.__debug?.renderer === renderer) delete window.__debug
    }
  }
}
