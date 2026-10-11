// Startseite: die Projekt-Herde auf dem Deich, wie in der Blender-Szene (blender/build_scene.py).
// Koordinaten: Blender (x, y, z) -> Three (x, z, -y). Meer liegt bei Blender -Y, also Three +Z.
// starteDeich(root, ui) hängt die Szene in ein Element der Seite; stop() gibt beim Seitenwechsel alles wieder frei.
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import { createHerd } from './herde.js'
import { dateien, qualitaet } from './dateien.js'

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

// root: Element, das die Szene ausfüllt (Canvas und Titel kommen davor)
// ui: { panel, pfeifen, assets, logos, basis, gedreht, zuLokal, zuBildschirm } – Bedienelemente, Pfade, 90°-Drehung am Handy
export function starteDeich (root, ui) {
  const ab = new AbortController(), signal = ab.signal // entfernt beim Stoppen alle Event-Listener
  const breite = () => root.clientWidth, hoehe = () => root.clientHeight
  let aus = false, rafId = 0, uhr = 0

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

  const labels = new CSS2DRenderer()
  labels.setSize(breite(), hoehe())
  Object.assign(labels.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' })
  renderer.domElement.after(labels.domElement)

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

  // Kein Umschauen/Zoomen: nur ein Blickziel, das die Kamerafahrten (Fokus, Pfeifen) verschieben
  const controls = {
    target: camTarget.clone(),
    update () { camera.lookAt(this.target) }
  }
  controls.update()

  // ---------------------------------------------------------------------------
  // Himmel (HDRI) – Sonne hinter die Kamera drehen, Sonnenlicht für Schatten
  // ---------------------------------------------------------------------------
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.4)
  sun.castShadow = true
  sun.shadow.mapSize.set(QUALITAET.schatten, QUALITAET.schatten)
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 10, bottom: -6, near: 1, far: 80 })
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.02
  scene.add(sun, sun.target)

  async function loadSky () {
    const tex = await new EXRLoader().setDataType(THREE.FloatType).loadAsync(ui.assets + D.himmel)
    const { width: w, height: h, data } = tex.image
    // hellstes Pixel = Sonne
    let best = 0, bx = 0, by = 0
    for (let y = 0; y < h / 2; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, l = data[i] + data[i + 1] + data[i + 2]
      if (l > best) { best = l; bx = x; by = y }
    }
    // Panorama um die Hochachse verschieben, sodass die Sonne bei Blender-Azimut 58° steht (hinter der Kamera, links)
    const uTarget = 0.5 - 58 / 360
    const shift = Math.round((uTarget - (bx + 0.5) / w) * w)
    const rolled = new Float32Array(data.length)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 4, dst = (y * w + ((x + shift) % w + w) % w) * 4
      rolled.set(data.subarray(src, src + 4), dst)
    }
    tex.image.data = rolled
    tex.mapping = THREE.EquirectangularReflectionMapping
    tex.needsUpdate = true
    scene.background = tex
    scene.environment = tex
    scene.environmentIntensity = 0.75
    // Sonnenrichtung (flipY: Zeile 0 = oben)
    const el = (0.5 - (by + 0.5) / h) * Math.PI
    const phi = (uTarget - 0.5) * 2 * Math.PI
    const dir = new THREE.Vector3(Math.cos(phi) * Math.cos(el), Math.sin(el), Math.sin(phi) * Math.cos(el))
    sun.position.copy(camTarget).addScaledVector(dir, 40)
    sun.target.position.copy(camTarget)
  }


  // ---------------------------------------------------------------------------
  // Nacht (20–6 Uhr wie die Nachtversion der Seite, oder ?zeit=nacht|tag): Sternenhimmel mit Mond,
  // Mondlicht, leichter Dunst. Die Tiere legen sich schlafen (herde.setNacht).
  // ---------------------------------------------------------------------------
  const moonDir = (() => { // Blender-Azimut 58°, Höhe 34° -> hinter der Kamera, links oben
    const az = THREE.MathUtils.degToRad(-58), el = THREE.MathUtils.degToRad(34)
    return new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el))
  })()
  const skyTime = { value: 0 }
  const SKY_GLSL = `
    varying vec3 vDir;
    uniform float uTime; uniform vec3 uMoon; uniform float uStars;
    float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
    void main() {
      vec3 d = normalize(vDir);
      float h = d.y;
      vec3 col = mix(vec3(0.03, 0.05, 0.11), vec3(0.004, 0.008, 0.03), smoothstep(-0.05, 0.6, h));
      col += vec3(0.05, 0.07, 0.12) * exp(-abs(h) * 14.0);                       // heller Horizontstreifen
      if (uStars > 0.5 && h > 0.03) {
        vec3 p = d * 320.0, c = floor(p);
        float r = hash(c);
        if (r > 0.9975) {
          float s = smoothstep(0.35, 0.0, length(fract(p) - 0.5));
          col += vec3(0.85, 0.9, 1.0) * s * (0.55 + 0.45 * sin(uTime * (1.5 + r * 3.0) + r * 60.0)) * smoothstep(0.03, 0.2, h);
        }
      }
      float m = dot(d, normalize(uMoon));
      col += vec3(0.95, 0.96, 1.0) * smoothstep(0.99955, 0.99975, m);             // Mondscheibe
      col += vec3(0.22, 0.27, 0.42) * pow(max(m, 0.0), 300.0) + vec3(0.05, 0.07, 0.12) * pow(max(m, 0.0), 12.0);
      gl_FragColor = vec4(col, 1.0);
    }`
  function skyMaterial (stars) {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: skyTime, uMoon: { value: moonDir }, uStars: { value: stars ? 1 : 0 } },
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
      fragmentShader: SKY_GLSL
    })
  }
  const nightSky = new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), skyMaterial(true))
  nightSky.frustumCulled = false
  nightSky.renderOrder = -1
  nightSky.visible = false
  scene.add(nightSky)
  // Umgebungslicht für die Nacht aus dem Himmelsverlauf (ohne Sterne)
  const nightEnv = (() => {
    const envScene = new THREE.Scene()
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMaterial(false)))
    const pmrem = new THREE.PMREMGenerator(renderer)
    const rt = pmrem.fromScene(envScene, 0.02)
    pmrem.dispose()
    return rt.texture
  })()
  const nightFog = new THREE.FogExp2(0x0a1122, 0.011)
  const day = {}
  const zeitParam = new URLSearchParams(location.search).get('zeit')
  const istNachtUhrzeit = () => { const h = new Date().getHours(); return h >= 20 || h < 6 }

  function setNacht (on) {
    if (world.nacht === on) return
    if (day.background === undefined) Object.assign(day, { background: scene.background, environment: scene.environment, envI: scene.environmentIntensity, color: sun.color.clone(), intensity: sun.intensity, pos: sun.position.clone() })
    world.nacht = on
    scene.background = on ? null : day.background
    scene.environment = on ? nightEnv : day.environment
    scene.environmentIntensity = on ? 1.5 : day.envI
    nightSky.visible = on
    scene.fog = on ? nightFog : null
    sun.color.set(on ? 0xaec4ff : day.color)
    sun.intensity = on ? 1.0 : day.intensity
    sun.position.copy(on ? camTarget.clone().addScaledVector(moonDir, 40) : day.pos)
    herd?.setNacht(on)
  }

  // ---------------------------------------------------------------------------
  // Deich und Wasser
  // ---------------------------------------------------------------------------
  const texLoader = new THREE.TextureLoader()
  function rasen () {
    // Poly Haven „aerial_grass_rock“, auf 1K WebP verkleinert (0,5 MB statt 7,9 MB); die Halme decken sie größtenteils ab
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
  // Gras: instanzierte Halme mit Wind im Vertex-Shader
  // ---------------------------------------------------------------------------
  const wind = { value: 0 }
  function buildGrass () {
    const H = 0.13 // Halmhöhe in m
    const blade = new THREE.PlaneGeometry(0.02, H, 1, 2) // 4 Dreiecke pro Halm
    blade.translate(0, H / 2, 0)
    const p = blade.attributes.position
    for (let i = 0; i < p.count; i++) { // zur Spitze hin schmal
      const t = p.getY(i) / H
      p.setX(i, p.getX(i) * (1 - t * 0.9))
    }
    const mat = new THREE.MeshStandardMaterial({ color: 0x5f8f2e, roughness: 0.6, side: THREE.DoubleSide })
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = wind
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying float vH;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vH = position.y / 0.13;
          vec4 ip = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float sway = sin(uTime * 1.6 + ip.x * 0.35 + ip.z * 0.25) * 0.5 + sin(uTime * 3.1 + ip.x * 1.7) * 0.2;
          transformed.x += sway * 0.035 * vH * vH;
          transformed.z += sway * 0.02 * vH * vH;`)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vH;')
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= mix(0.55, 1.1, vH);')
    }
    const count = QUALITAET.gras
    const grass = new THREE.InstancedMesh(blade, mat, count)
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), e = new THREE.Euler()
    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      // 80 % auf der Böschung (dünner zur Krone), 20 % im flachen Vordergrund bis zum unteren Bildrand; die Seeseite sieht man von vorn nicht
      const vorn = Math.random() < 0.2
      const y = vorn ? SLOPE_END + 0.3 + Math.random() * 4.7 : SLOPE_END + 0.3 - Math.pow(Math.random(), 0.7) * (SLOPE_END + 2.8)
      const x = (Math.random() - 0.5) * (14 + (SLOPE_END - y) * 1.6)
      e.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.5)
      q.setFromEuler(e)
      const k = 0.55 + Math.random() * 0.9
      s.set(k, k, k)
      m.compose(b2t(x, y, profile(y) - 0.02), q, s)
      grass.setMatrixAt(i, m)
      const dry = Math.random() < 0.12
      grass.setColorAt(i, color.setHSL(dry ? 0.16 + Math.random() * 0.03 : 0.23 + Math.random() * 0.06, dry ? 0.45 : 0.5, dry ? 0.42 : 0.3 + Math.random() * 0.14))
    }
    grass.receiveShadow = true
    scene.add(grass)
  }

  // ---------------------------------------------------------------------------
  const clock = new THREE.Clock()
  function animate () {
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime
    wind.value = t
    herd?.update(t, dt)
    skyTime.value = t
    nightSky.position.copy(camera.position)
    controls.update()
    renderer.render(scene, camera)
    labels.render(scene, camera)
    herd?.declutter()
    rafId = requestAnimationFrame(animate)
  }

  addEventListener('resize', () => {
    camera.aspect = breite() / hoehe()
    setFov()
    renderer.setSize(breite(), hoehe())
    labels.setSize(breite(), hoehe())
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
  buildGrass()
  const bereit = (async () => {
    // Ladefortschritt für den Ladebildschirm (zählt Dateien aller Three-Loader)
    THREE.DefaultLoadingManager.onProgress = (url, fertig, gesamt) => { if (!aus) ui.fortschritt?.(fertig / gesamt) }
    // Himmel und Herde gleichzeitig laden
    const [, h] = await Promise.all([loadSky(), createHerd(world)])
    THREE.DefaultLoadingManager.onProgress = undefined
    if (aus) return
    herd = h
    world.nacht = false
    setNacht(zeitParam ? zeitParam === 'nacht' : istNachtUhrzeit())
    uhr = setInterval(() => { if (!zeitParam) setNacht(istNachtUhrzeit()) }, 60000) // Tag/Nacht nur nach Uhrzeit, ohne Schalter
    // ?debug: Testzugriff; simulate(s) rechnet das Verhalten im Zeitraffer ohne Darstellung
    if (new URLSearchParams(location.search).has('debug')) {
      window.__debug = {
        herd, renderer, scene, camera,
        render () { controls.update(); renderer.render(scene, camera); labels.render(scene, camera); herd.declutter() },
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
      clearInterval(uhr)
      renderer.dispose()
      renderer.forceContextLoss() // GPU-Speicher sofort freigeben, nicht erst bei der Garbage Collection
      renderer.domElement.remove()
      labels.domElement.remove()
      if (window.__debug?.renderer === renderer) delete window.__debug
    }
  }
}
