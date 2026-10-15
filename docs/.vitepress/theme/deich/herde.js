// Die Herde: Ein geriggtes Grundschaf aus Blender dient allen lebenden Schafen; jedes Projekt bekommt
// darauf seinen eigenen Look (Material/Shader) und sein eigenes Verhalten. Ein Tier bzw. Objekt pro Projekt.
// Koordinaten wie in szene.js: Blender (x, y, z) -> Three (x, z, -y).
// Hang (Blender-y): Figuren bei 2,6 (oben), frei laufende Tiere zwischen 3,3 und 10 (bis über den Böschungsfuß bei 7,5 nach vorn).
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js'

export const ROT = '#ff2d16' // Akzentrot der Seite (Projektlogos)

// x/y: Startplatz (Blender), rot: Grad (0 = Blick nach Blender +X, null = zur Kamera). label: Titel im Projekt-Panel (Logo oder Schrift).
// Feste Figuren stehen oben am Hang (y = 2,6) und wechseln sich mit den Lauftieren ab.
// schlaf: Schlafpose (Standard 'sleep' = Kopf an der Flanke, 'sleep_b' = Kinn im Gras), damit nicht alle gleich schlafen.
export const STATIONEN = [
  { slug: 'LightbyNight', titel: 'Light At Night', jahr: 2023, x: 7.2, y: 2.6, rot: 70, look: 'foto', verhalten: 'liegt', feuer: true, schlaf: 'sleep_b',
    label: { text: 'Light At Night', font: 'Light' }, text: 'Ein gemeinsames Tileset-Game, in dem Licht nicht nur Stimmung, sondern ein Teil der Spielmechanik ist.' },
  { slug: 'Reefresh', titel: 'REEFRESH – Maybe Next Time', jahr: 2026, x: 4.9, y: 3.9, rot: 20, look: 'foto', modell: 'taucher', verhalten: 'laeuft', schlaf: 'sleep_b',
    label: { logo: 'corals-logo.svg', h: 38 }, text: 'Aus vielen Zeichnungen entstehen spekulative Zukunftskorallen und ein interaktives Archiv ihrer möglichen Anpassungen.' },
  { slug: 'Moi', titel: 'MOI', jahr: 2025, x: 4.1, y: 2.6, rot: 200, look: 'modell', modell: 'steinschaf', verhalten: 'statisch',
    label: { text: 'MOI', font: 'MOI' }, text: 'Eine Videoperformance, in der Tanz, bewegte Steine, KI-generierte Bilder und Klang aufeinandertreffen.' },
  { slug: 'Klanggestalten', titel: 'Klanggestalten', jahr: 2025, x: 2.0, y: 5.6, rot: 165, look: 'foto', verhalten: 'laeuft', voegel: true,
    label: { logo: 'klanggestalten-logo.svg', h: 52 }, text: 'Aus dem Gesang von Vögeln wird ein persönlicher Naturmoment für zu Hause – als Klang, Licht und Vibration.' },
  { slug: 'Uebergangsobjekte', titel: 'Übergangsobjekte', jahr: 2026, x: 1.2, y: 2.6, rot: null, look: 'plastik', verhalten: 'statisch', pose: ['idle', 0], blister: true,
    label: { text: 'Übergangsobjekte', font: 'Uebergangsobjekte' }, text: 'Vier Spielzeuge mit eigenen Geschichten über den Konflikt zwischen Smartphone und klassischem Übergangsobjekt.' },
  { slug: 'Uebersee', titel: 'Mit KI läufts bei uns!', jahr: 2024, x: -0.2, y: 4.7, rot: 10, look: 'bison', verhalten: 'laeuft',
    label: { text: 'Mit KI läufts bei uns!', font: 'Montserrat' }, text: 'Mein erster intensiver Kontakt mit KI: eine Kampagnenidee für neue Formen der Wissensvermittlung im Museum.' },
  { slug: 'Kilma', titel: 'Kilma', jahr: 2024, x: -2.0, y: 5.9, rot: null, look: 'sprite', verhalten: 'sprite', sprite: 'kilma',
    label: { text: 'KILMA', font: 'Kilma' }, text: 'Vier Minispiele über eine Welt in der Klimakrise und unseren oft absurden Umgang damit.' },
  { slug: 'Migration', titel: 'Migration', jahr: 2025, x: -3.3, y: 2.6, rot: null, look: 'gips', verhalten: 'statisch', pose: ['idle', 1.0], motorik: true,
    label: { text: 'Migration', font: 'Migration' }, text: 'Ein bewusst kindlich gebauter Tisch, der Erwachsene mit Fluchtrouten und der Verantwortung hinter politischen Entscheidungen konfrontiert.' },
  { slug: 'Stottern', titel: 'Stottern', jahr: 2024, x: -4.0, y: 4.1, rot: 25, look: 'hologramm', verhalten: 'stottert',
    label: { text: 'Stottern', font: 'Futurist', spacing: '0.18em' }, text: 'Aus meiner eigenen Erfahrung mit dem Stottern entstand ein Film über Perfektionsdruck und das Nicht-perfekt-Sein.' },
  { slug: 'Portfolio', titel: 'Portfolio 2026', jahr: 2026, x: -6.0, y: 4.6, rot: null, look: 'sprite', verhalten: 'sprite', sprite: 'portfolio',
    label: { text: 'Portfolio 2026', font: 'Georgia, serif' }, text: 'Eine Website über meine Arbeit und gleichzeitig ein Lernprozess im Vibe Coding mit KI.' },
]

// Flache Figuren: Höhe in m am Tag und liegend (null = gleicher Maßstab wie das Tagesbild)
const SPRITES = { portfolio: { tag: 1.15, nacht: 0.62 }, kilma: { tag: 1.0, nacht: null } }
const GAIT = { schaf: { walk: 0.32, trot: 0.78 }, bison: { walk: 0.5, trot: 1.2 } } // m/s ohne Hufrutschen
const HANG = [3.3, 10.0]
const OBEN_Y = 2.6 // oben am Hang stehen die Figuren; höher läuft kein Tier
const UP = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0)
const shaderTime = { value: 0 }

// ---------------------------------------------------------------------------
// Looks
// ---------------------------------------------------------------------------
function hologramMaterial (color) {
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = shaderTime
    const vary = 'varying float vHoloY;\nvarying vec3 vHoloN;\nvarying vec3 vHoloV;'
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\n${vary}`)
      .replace('#include <skinning_vertex>', `#include <skinning_vertex>
        vec4 hw = modelMatrix * vec4(transformed, 1.0);
        vHoloY = hw.y;
        vHoloN = normalize(mat3(modelMatrix) * objectNormal);
        vHoloV = normalize(cameraPosition - hw.xyz);`)
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;\n${vary}`)
      .replace('#include <opaque_fragment>', `
        float fres = pow(1.0 - abs(dot(normalize(vHoloN), normalize(vHoloV))), 2.0);
        float scan = 0.4 + 0.6 * step(0.42, fract(vHoloY * 48.0 - uTime * 1.2));
        float band = 0.65 + 0.35 * smoothstep(0.0, 0.1, abs(fract(vHoloY * 0.7 - uTime * 0.4) - 0.5));
        outgoingLight *= scan * band * (0.3 + 1.5 * fres);
        diffuseColor.a = scan * (0.18 + 0.8 * fres) * opacity;
        #include <opaque_fragment>`)
  }
  return mat
}

function skinnedCopy (mesh, material) {
  const copy = new THREE.SkinnedMesh(mesh.geometry, material)
  copy.bind(mesh.skeleton, mesh.bindMatrix)
  copy.frustumCulled = false
  mesh.parent.add(copy)
  return copy
}

function applyLook (root, look) {
  const extras = { ghosts: [] }
  const meshes = []
  root.traverse((o) => { if (o.isSkinnedMesh) meshes.push(o) })
  for (const m of meshes) {
    const orig = m.material
    if (look === 'gips') {
      m.material = new THREE.MeshStandardMaterial({ color: 0xece9e2, roughness: 0.9, normalMap: orig.normalMap, normalScale: new THREE.Vector2(1.3, 1.3) })
    } else if (look === 'plastik') {
      // glänzendes Spielzeug-Plastik wie auf dem Übergangsobjekte-Cover
      m.material = new THREE.MeshPhysicalMaterial({ color: 0xe8364f, roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.12, normalMap: orig.normalMap, normalScale: new THREE.Vector2(0.35, 0.35) })
    } else if (look === 'hologramm') {
      m.material = hologramMaterial(0x45d4ff)
      m.renderOrder = 2
      m.castShadow = false
      for (const c of [0xff3355, 0x33ffee]) { // Farbversatz wie auf dem Stottern-Cover
        const g = skinnedCopy(m, hologramMaterial(c))
        g.renderOrder = 1
        extras.ghosts.push(g)
      }
    } else {
      m.material = orig.clone() // eigenes Material je Tier, damit es sich einzeln ausblenden lässt
    }
  }
  return extras
}

// ---------------------------------------------------------------------------
// Requisiten
// ---------------------------------------------------------------------------
// Lagerfeuer: echtes simuliertes Feuer (Blender/Mantaflow) als Flipbook auf kamerazugewandten Ebenen,
// dazu Funken, Glutschein, glühende Scheite, Steinring und flackerndes Licht.
function fire (flipbook) {
  const g = new THREE.Group()
  const COLS = 8, ROWS = 4, FRAMES = 32, FPS = 24
  const flameMat = new THREE.ShaderMaterial({
    uniforms: { uTime: shaderTime, uMap: { value: flipbook }, uOffset: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D uMap; uniform float uTime; uniform float uOffset; varying vec2 vUv;
      vec3 frame(float f) {
        float i = mod(f, ${FRAMES}.0);
        vec2 cell = vec2(mod(i, ${COLS}.0), ${ROWS - 1}.0 - floor(i / ${COLS}.0));
        return texture2D(uMap, (cell + vUv) / vec2(${COLS}.0, ${ROWS}.0)).rgb;
      }
      void main() {
        float f = uTime * ${FPS}.0 + uOffset;
        vec3 c = mix(frame(floor(f)), frame(floor(f) + 1.0), fract(f)); // weich überblenden
        float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) * smoothstep(1.0, 0.9, vUv.y);
        gl_FragColor = vec4(c * 1.6 * edge, 1.0);
      }`
  })
  const flames = []
  for (let k = 0; k < 3; k++) {
    const m = flameMat.clone()
    m.uniforms.uTime = shaderTime
    m.uniforms.uOffset.value = k * 11.0 // jede Ebene in einer anderen Phase -> kein sichtbares Muster
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.22), m)
    f.position.y = 0.55
    flames.push(f)
    g.add(f)
  }
  const logMat = new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 0.95, emissive: 0xff3a00, emissiveIntensity: 0.25 })
  for (let k = 0; k < 5; k++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.6, 8), logMat)
    const a = k * Math.PI * 2 / 5
    log.position.set(Math.cos(a) * 0.13, 0.17, Math.sin(a) * 0.13)
    log.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6)
    log.castShadow = true
    g.add(log)
  }
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6d675e, roughness: 0.9 })
  for (let k = 0; k < 11; k++) {
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08 + (k % 3) * 0.015, 0), stoneMat)
    const a = k * Math.PI * 2 / 11
    s.position.set(Math.cos(a) * 0.42, 0.04, Math.sin(a) * 0.42)
    s.scale.y = 0.6
    s.rotation.set(k * 1.7, k * 2.3, 0)
    g.add(s)
  }
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 vUv; void main() { float d = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(vec3(1.0, 0.4, 0.1) * 0.45, pow(1.0 - clamp(d, 0.0, 1.0), 2.5)); }'
  }))
  glow.rotation.x = -Math.PI / 2
  glow.position.y = 0.02
  g.add(glow)
  const N = 36
  const sparkPos = new Float32Array(N * 3)
  const sparkLife = Array.from({ length: N }, (_, i) => i / N)
  const sparks = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(sparkPos, 3)),
    new THREE.PointsMaterial({ color: 0xffa040, size: 0.03, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
  g.add(sparks)
  const light = new THREE.PointLight(0xff7a2a, 6, 8, 1.6)
  light.position.y = 0.55
  g.add(light)
  g.userData.tick = (t, dt, camera, nacht) => {
    const ang = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z)
    flames.forEach((f, k) => { f.rotation.y = ang + (k - 1) * 0.5 })
    for (let i = 0; i < N; i++) {
      sparkLife[i] += dt * (0.45 + (i % 5) * 0.12)
      if (sparkLife[i] > 1) sparkLife[i] = 0
      const l = sparkLife[i]
      sparkPos.set([Math.sin(i * 12.9 + t * 2) * 0.12 * l + Math.sin(i) * 0.08, 0.35 + l * 1.7, Math.cos(i * 7.3 + t * 1.7) * 0.12 * l], i * 3)
    }
    sparks.geometry.attributes.position.needsUpdate = true
    const base = nacht ? 11 : 5
    light.intensity = base + 1.6 * Math.sin(t * 11) + 1.1 * Math.sin(t * 27 + 1) + 0.6 * Math.sin(t * 43)
    logMat.emissiveIntensity = 0.22 + 0.08 * Math.sin(t * 7)
  }
  return g
}

// Blister genau wie auf dem Cover: freigestellter Kartendruck (pinke Pappe, Lochung, roter Rand,
// Schaf-Zeichnung, Stern) auf der Karte, davor eine Klarsichtblase mit dem roten Plastikschaf.
function blisterPack (sheepModel, cardTex) {
  const g = new THREE.Group()
  const W = 1.5, H = W * 1147 / 1536
  const card = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: cardTex, roughness: 0.78, alphaTest: 0.5, side: THREE.DoubleSide }))
  card.position.set(0, H / 2 + 0.02, 0)
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: cardTex, color: 0xd9d9d9, roughness: 0.85, alphaTest: 0.5 }))
  back.position.set(0, H / 2 + 0.02, -0.006)
  back.rotation.y = Math.PI
  // Blase: tiefgezogene Folie mit weicher Kante, unten in der Kartenmitte (wie auf dem Cover)
  const bubble = new THREE.Mesh(new RoundedBoxGeometry(1.18, 0.72, 0.4, 6, 0.13), new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide
  }))
  bubble.position.set(0.02, 0.46, 0.21)
  bubble.renderOrder = 3
  const rim = new THREE.Mesh(new RoundedBoxGeometry(1.28, 0.82, 0.012, 4, 0.006), new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false
  }))
  rim.position.set(0.02, 0.46, 0.006)
  sheepModel.scale.setScalar(0.6)
  sheepModel.position.set(0.02, 0.13, 0.21)
  g.add(back, card, rim, sheepModel, bubble)
  g.rotation.x = -0.07
  g.traverse((o) => { if (o.isMesh && o !== bubble && o !== rim) o.castShadow = true })
  return g
}

function beadMaze (sheepModel) {
  const g = new THREE.Group()
  const wood = new THREE.MeshStandardMaterial({ color: 0xb98a55, roughness: 0.7 })
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 0.9), wood)
  board.position.y = 0.05
  g.add(board)
  const colors = [0xc0241a, 0x1b46b3, 0xe6a817]
  const beadColors = [0xd32a1e, 0x1e5bd6, 0xf2b81c, 0x2b9a3e]
  ;[[-0.28, 0.85, 1.35], [0, 0.9, 1.5], [0.28, 0.8, 1.25]].forEach(([z, rx, rz], w) => {
    const pts = []
    for (let i = 0; i <= 24; i++) { const a = Math.PI * i / 24; pts.push(new THREE.Vector3(-rx * Math.cos(a), 0.1 + rz * Math.sin(a), z)) }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.016, 8), new THREE.MeshStandardMaterial({ color: colors[w], roughness: 0.3, metalness: 0.3 })))
    for (let k = 0; k < 4; k++) {
      const a = 0.3 + (k + w * 0.37) * 0.62
      const bead = new THREE.Mesh(k % 2 ? new THREE.SphereGeometry(0.06, 16, 12) : new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: beadColors[(k + w) % 4], roughness: 0.35 }))
      bead.position.set(-rx * Math.cos(a), 0.1 + rz * Math.sin(a), z)
      bead.rotation.z = a
      g.add(bead)
    }
  })
  sheepModel.scale.setScalar(0.85)
  sheepModel.position.y = 0.1
  g.add(sheepModel)
  g.traverse((o) => { if (o.isMesh) o.castShadow = true })
  return g
}

function hitBox (w, h, d) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }))
  m.position.y = h / 2
  return m
}

// ---------------------------------------------------------------------------
// Ein Tier (bzw. eine Figur) pro Projekt
// ---------------------------------------------------------------------------
class Tier {
  constructor (cfg, assets, world) {
    this.cfg = cfg
    this.world = world
    this.home = new THREE.Vector2(cfg.x, cfg.y)
    this.pos = this.home.clone()
    this.heading = cfg.rot === null ? world.faceCamera(this.home.x, this.home.y) : THREE.MathUtils.degToRad(cfg.rot)
    this.group = new THREE.Group()  // steht auf dem Hang (Position, Neigung)
    world.scene.add(this.group)
    this.mode = 'idle'
    this.until = 1 + Math.random() * 3
    this.target = new THREE.Vector2()
    this.pickables = []
    this.radius = cfg.look === 'bison' ? 1.2 : cfg.blister || cfg.motorik ? 0.95 : 0.65
    this.gait = cfg.look === 'bison' ? GAIT.bison : GAIT.schaf
    this.opacity = 1
    this.opacityTarget = 1

    if (cfg.look === 'sprite') {
      this.buildSprite(assets)
    } else if (cfg.look === 'modell') {
      this.model = assets[cfg.modell].scene.clone()
      this.model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.material = o.material.clone() } })
      this.group.add(this.model)
      this.addHit(1.5, 1.1, 0.7)
      this.frozen = true
    } else {
      const src = cfg.look === 'bison' ? assets.bison : assets[cfg.modell ?? 'schaf'] // geriggte Schafe: Grundschaf oder eigenes Modell (Taucher)
      this.model = SkeletonUtils.clone(src.scene)
      this.model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false } })
      this.model.updateMatrixWorld(true)
      this.extras = applyLook(this.model, cfg.look)
      this.mixer = new THREE.AnimationMixer(this.model)
      this.actions = Object.fromEntries(src.animations.map(c => [c.name, this.mixer.clipAction(c)]))
      for (const n of ['lie_down', 'stand_up']) {
        if (!this.actions[n]) continue
        this.actions[n].setLoop(THREE.LoopOnce, 1)
        this.actions[n].clampWhenFinished = true
      }
      let holder = this.model
      if (cfg.blister) holder = blisterPack(this.model, assets.blisterKarte)
      if (cfg.motorik) holder = beadMaze(this.model)
      this.group.add(holder)
      if (cfg.blister || cfg.motorik) this.addHit(1.9, 1.5, 1.0)
      else if (cfg.look === 'bison') this.addHit(2.6, 1.7, 1.0)
      else this.addHit(1.5, 1.1, 0.7)
      if (cfg.verhalten === 'statisch') {
        // Figuren: in einer Pose erstarrt (Gips schaut sich um, Plastikfigur steht normal wie ein Spielzeug)
        const [clip, time] = cfg.pose
        this.actions[clip].play()
        this.mixer.setTime(time)
        this.frozen = true
      } else if (cfg.verhalten === 'liegt') {
        this.play('lie', 0) // Light At Night liegt am Feuer
      } else {
        this.play('graze', 0)
      }
    }
    if (cfg.feuer) {
      this.fire = fire(assets.feuer)
      world.scene.add(this.fire)
      this.placeFire()
    }
    this.place()
  }

  placeFire () {
    const w = this.world, y = this.home.y - 0.3
    this.fire.position.copy(w.b2t(this.home.x + 1.05, y, w.profile(y)))
  }

  addHit (w, h, d) {
    const hit = hitBox(w, h, d) // unsichtbare Trefferbox statt Pixel-Raycast auf das Skinned Mesh
    this.group.add(hit)
    this.pickables.push(hit)
  }

  buildSprite (assets) {
    this.spriteTex = assets.sprites[this.cfg.sprite]
    this.spriteMass = SPRITES[this.cfg.sprite]
    this.sprite = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.spriteTex.tag, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false })) // ohne Tone Mapping bleibt Weiß wie im Logo
    this.setSpriteImage('tag')
    this.group.add(this.sprite)
    this.pickables.push(this.sprite)
    this.spriteDir = 1
  }

  setSpriteImage (which) {
    const tex = this.spriteTex[which]
    const m = this.spriteMass
    const h = which === 'tag' ? m.tag : m.nacht ?? m.tag * tex.image.height / this.spriteTex.tag.image.height
    const w = h * tex.image.width / tex.image.height
    this.sprite.material.map = tex
    this.sprite.scale.set(w, h, 1)
    // Auch beim direkten Nachtstart wird updateSprite nicht aufgerufen.
    // Die neue Pose deshalb sofort mit ihrer Unterkante auf den Boden setzen.
    this.sprite.position.y = h / 2
    this.spriteH = h
  }

  play (name, fade = 0.45) {
    if (!this.actions || !this.actions[name] || this.current === name) return
    const next = this.actions[name]
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play()
    if (this.current) this.actions[this.current].crossFadeTo(next, fade, false)
    this.current = name
  }

  clipDur (name) { return this.actions?.[name]?.getClip().duration ?? 0 }

  get walker () { return ['laeuft', 'stottert', 'sprite'].includes(this.cfg.verhalten) }
  get busy () { return ['fokus', 'platz', 'schlaf', 'aufstehen'].includes(this.mode) }

  pickTarget (herd, radius = 3.8) {
    for (let k = 0; k < 12; k++) {
      const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * (radius - 0.3)
      const x = this.home.x + Math.cos(a) * r
      const y = THREE.MathUtils.clamp(this.home.y + Math.sin(a) * r, HANG[0], HANG[1])
      // im Bild der festen Kamera bleiben (mit Rand für den Titel)
      if (!this.world.imBild(x, y)) continue
      if (herd.every(o => o === this || o.pos.distanceTo(new THREE.Vector2(x, y)) > this.radius + o.radius + 0.4)) { this.target.set(x, y); return }
    }
    this.target.copy(this.pos) // kein freier Platz im Bild: stehen bleiben
  }

  decide (t, herd) {
    if (this.busy) return
    if (!this.walker) { this.mode = 'idle'; this.until = t + 1e9; return }
    const r = Math.random()
    if (this.cfg.verhalten === 'sprite') { // 2D-Figur: läuft hin und her, bleibt kurz stehen
      if (r < 0.6) { this.mode = 'walk'; this.pickTarget(herd, 3.0); this.until = t + 12 } else { this.mode = 'idle'; this.until = t + 1.5 + Math.random() * 2 }
      return
    }
    if (r < 0.45) { this.mode = 'graze'; this.until = t + 4 + Math.random() * 6; this.play('graze') }
    else if (r < 0.7) { this.mode = 'idle'; this.until = t + 2 + Math.random() * 3; this.play('idle') }
    else { this.mode = 'walk'; this.pickTarget(herd); this.until = t + 14; this.play('walk') }
  }

  // --- Nacht: hinlegen und schlafen; Tag: aufstehen ------------------------
  get schlafClip () { return this.actions?.[this.cfg.schlaf] ? this.cfg.schlaf : 'sleep' }

  sleep (t, sofort = false) {
    if (this.cfg.verhalten === 'statisch') return
    if (this.sprite) { this.mode = 'schlaf'; this.setSpriteImage('nacht'); return }
    this.mode = 'schlaf'
    if (sofort) {
      // Beim Nachtstart direkt die Schlafpose auswerten, bevor das erste Bild gerendert wird.
      this.mixer.stopAllAction()
      this.current = null
      this.play(this.schlafClip, 0)
      this.mixer.update(0)
      this.sleepAt = null
      return
    }
    if (['lie', 'sleep', 'sleep_b'].includes(this.current)) { this.play(this.schlafClip, 1.2); this.sleepAt = null; return }
    this.play('lie_down', 0.35)
    this.sleepAt = t + this.clipDur('lie_down')
  }

  wake (t) {
    if (this.mode !== 'schlaf') return false
    if (this.sprite) { this.setSpriteImage('tag'); this.mode = 'idle'; this.until = t + 1; return true }
    if (this.cfg.verhalten === 'liegt') { this.mode = 'idle'; this.play('lie', 1.2); return true }
    this.play('stand_up', 0.35)
    this.mode = 'aufstehen'
    this.until = t + this.clipDur('stand_up')
    return true
  }

  release (t, nacht) {
    if (!['fokus', 'platz'].includes(this.mode)) return
    this.mode = 'idle'
    this.until = t + 0.5 + Math.random() * 1.5
    if (this.walker) this.play('idle')
    if (nacht) this.sleep(t)
  }

  focus () {
    if (this.walker && this.mode !== 'schlaf') { this.mode = 'fokus'; this.play('idle', 0.3) }
  }

  // Platz machen: aus dem Bild des fokussierten Tiers seitlich weglaufen
  makeRoom (t, other) {
    if (!this.walker || this.mode === 'schlaf') return false
    const side = Math.sign(this.pos.x - other.pos.x) || 1
    this.mode = 'platz'
    this.target.set(other.pos.x + side * (4.6 + Math.random() * 1.5), THREE.MathUtils.clamp(this.pos.y + (Math.random() - 0.5), HANG[0], HANG[1]))
    this.arrived = false
    this.startAt = t
    return true
  }

  fade (to) { this.opacityTarget = to }

  stopAndLook (t) {
    if (!this.walker || this.busy) return
    this.mode = 'idle'
    this.until = t + 3
    this.play('idle', 0.3)
  }

  turnTo (angle, dt, rate = 1.5) {
    let d = angle - this.heading
    d = Math.atan2(Math.sin(d), Math.cos(d))
    this.heading += d * Math.min(1, dt * rate)
    return d
  }

  updateOpacity (dt) {
    if (Math.abs(this.opacity - this.opacityTarget) < 1e-3) return
    this.opacity += Math.sign(this.opacityTarget - this.opacity) * Math.min(Math.abs(this.opacityTarget - this.opacity), dt * 2.5)
    const o = this.opacity
    const apply = (obj) => obj?.traverse((m) => {
      if (!m.isMesh && !m.isPoints) return
      if (m.material === undefined || m === this.pickables[0]) return
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        if (mat.userData.baseOpacity === undefined) mat.userData.baseOpacity = mat.opacity
        mat.transparent = o < 1 || mat.userData.baseOpacity < 1 || mat.blending === THREE.AdditiveBlending
        mat.opacity = mat.userData.baseOpacity * o
        mat.depthWrite = o >= 1 && mat.userData.baseOpacity >= 1 && mat.blending !== THREE.AdditiveBlending
      }
      m.castShadow = o > 0.5 && m.userData.noShadow !== true
    })
    apply(this.group)
    apply(this.fire)
    this.group.visible = o > 0.01
    if (this.fire) this.fire.visible = o > 0.01
    this.voegel?.forEach(v => { v.perch.visible = o > 0.01 && v.mode === 'sitzt' })
  }

  update (t, dt, herd) {
    if (this.fire) this.fire.userData.tick(t, dt, this.world.camera, this.world.nacht)
    this.updateOpacity(dt)
    // flache Figuren sind unbeleuchtet: mit dem Tageslicht abdunkeln (Dämmerung, Nacht, auch im Schlaf)
    if (this.sprite) this.sprite.material.color.setScalar(0.3 + 0.7 * (this.world.tageslicht ?? 1))
    let speedScale = 1
    if (this.cfg.verhalten === 'stottert' && this.mode !== 'schlaf') speedScale = this.stutter(t)
    if (this.mixer && !this.frozen) this.mixer.update(dt * speedScale)
    if (this.mode === 'schlaf') {
      if (this.sleepAt && t > this.sleepAt) { this.play(this.schlafClip, 0.9); this.sleepAt = null }
      this.place()
      return
    }
    if (this.mode === 'aufstehen') {
      if (t > this.until) { this.mode = 'idle'; this.until = t + 1; this.play('idle', 0.5) }
      this.place()
      return
    }
    const travelling = this.mode === 'platz' && !this.arrived && t >= (this.startAt ?? 0)
    const moving = this.mode === 'walk' || this.mode === 'trot' || travelling
    if (moving && speedScale > 0) {
      const to = new THREE.Vector2().subVectors(this.target, this.pos)
      const push = new THREE.Vector2()
      let blocked = false
      for (const o of herd) {
        if (o === this || o.opacity < 0.5) continue
        const d = this.pos.distanceTo(o.pos)
        const min = this.radius + o.radius + 0.25
        if (d < min) {
          const away = new THREE.Vector2().subVectors(this.pos, o.pos).divideScalar(Math.max(d, 0.01))
          push.addScaledVector(away, (min - d) * (travelling ? 0.8 : 2.2))
          const ahead = new THREE.Vector2(Math.cos(this.heading), Math.sin(this.heading))
          if (d < min * 0.6 && ahead.dot(away) < -0.6) blocked = true
        }
      }
      if (blocked && this.mode === 'walk') { this.mode = 'idle'; this.until = t + 1 + Math.random() * 1.5; this.play('idle') }
      const dir = to.clone().normalize().add(push)
      const turn = this.turnTo(Math.atan2(dir.y, dir.x), dt, 2.2)
      const far = travelling && to.length() > 3
      const gaitName = (this.mode === 'trot' || far) && this.cfg.verhalten !== 'sprite' ? 'trot' : 'walk'
      if (this.actions) this.play(gaitName, 0.35)
      const speed = this.gait[gaitName] * (Math.abs(turn) > 1 ? 0.45 : 1) * (travelling ? Math.min(1, 0.3 + to.length()) : 1)
      if (this.actions) this.actions[gaitName].setEffectiveTimeScale(speed / this.gait[gaitName])
      this.pos.x += Math.cos(this.heading) * speed * dt * speedScale
      this.pos.y = THREE.MathUtils.clamp(this.pos.y + Math.sin(this.heading) * speed * dt * speedScale, OBEN_Y - 0.2, HANG[1] + 0.2)
      if (travelling && to.length() < 0.15) { this.arrived = true; this.play(this.mode === 'platz' ? 'graze' : 'idle', 0.5) }
      else if (!travelling && (to.length() < 0.25 || t > this.until)) this.decide(t, herd)
    } else if (this.mode === 'fokus') {
      // im Fokus: ruhig stehen, leicht schräg zur Kamera schauen (Profil bleibt sichtbar)
      this.turnTo(Math.PI / 2 + 0.65, dt, 1.2)
    } else if (!this.busy && t > this.until) this.decide(t, herd)
    if (this.sprite) this.updateSprite(t, moving)
    this.place()
  }

  // Stottern: Gang stockt in kurzen Abständen, beim Stocken springt das Hologramm und flackert
  stutter (t) {
    if (!this.nextStutter) this.nextStutter = t + 1
    if (t > this.nextStutter) { this.stutterEnd = t + 0.1 + Math.random() * 0.25; this.nextStutter = t + 0.5 + Math.random() * 1.6; this.glitch = (Math.random() - 0.5) * 0.08 }
    const stuck = t < this.stutterEnd
    this.extras?.ghosts.forEach((g, i) => {
      const o = (stuck ? 0.07 : 0.025) * (i ? 1 : -1)
      g.position.set(o + (stuck ? this.glitch : 0), 0, -o * 0.6)
      g.visible = !stuck || Math.random() < 0.6
    })
    if (this.model) this.model.position.x = stuck ? this.glitch : 0
    return stuck ? 0 : 1
  }

  // 2D-Figur: ruckelt mit 8 Bildern pro Sekunde wie ein altes GIF, dreht sich immer zur Kamera
  updateSprite (t, moving) {
    const hop = moving && Math.floor(t * 8) % 2 === 0 ? 0.03 : 0
    this.sprite.position.y = this.spriteH / 2 + hop
    const dirX = Math.cos(this.heading)
    if (moving && Math.abs(dirX) > 0.2) this.spriteDir = Math.sign(dirX)
    this.sprite.scale.x = Math.abs(this.sprite.scale.x) * -this.spriteDir // Bild schaut nach rechts; Blender +X ist im Frontblick links
  }

  place () {
    const w = this.world
    const y = this.pos.y
    this.group.position.copy(w.b2t(this.pos.x, y, w.profile(y)))
    if (this.sprite) {
      const c = w.camera.position
      this.group.rotation.set(0, Math.atan2(c.x - this.group.position.x, c.z - this.group.position.z), 0)
      return
    }
    const slope = Math.atan((w.profile(y - 0.2) - w.profile(y + 0.2)) / 0.4)
    const yaw = new THREE.Quaternion().setFromAxisAngle(UP, this.heading)
    const tilt = new THREE.Quaternion().setFromAxisAngle(X, -slope * (this.cfg.blister || this.cfg.motorik ? 0.3 : 0.6))
    this.group.quaternion.multiplyQuaternions(tilt, yaw)
  }
}

// ---------------------------------------------------------------------------
// Vögel des Klanggestalten-Schafs (sitzend am Anker, Flugversion für den Flug)
// ---------------------------------------------------------------------------
class Vogel {
  constructor (name, host, perchG, flyG, world) {
    this.name = name
    this.host = host
    this.anchor = host.model.getObjectByName(`Anker_${name}`)
    this.perch = SkeletonUtils.clone(perchG.scene)
    this.flyer = SkeletonUtils.clone(flyG.scene)
    for (const o of [this.perch, this.flyer]) o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.frustumCulled = false } })
    world.scene.add(this.perch, this.flyer) // nicht in den Schaf-Baum: gleiche Knochennamen würden kollidieren
    this.flyer.visible = false
    this.pm = new THREE.AnimationMixer(this.perch)
    this.fm = new THREE.AnimationMixer(this.flyer)
    this.pa = Object.fromEntries(perchG.animations.map(c => [c.name, this.pm.clipAction(c)]))
    this.fa = Object.fromEntries(flyG.animations.map(c => [c.name, this.fm.clipAction(c)]))
    this.pa.idle.play()
    this.pa.idle.time = Math.random() * 3
    this.pa.hop.setLoop(THREE.LoopOnce, 1)
    this.pa.peck.setLoop(THREE.LoopOnce, 1)
    this.fa.flap.play()
    this.fa.glide.play()
    this.fa.glide.setEffectiveWeight(0)
    this.mode = 'sitzt'
    this.nextPeck = 2 + Math.random() * 4
    this.pos = new THREE.Vector3()
    this.vel = new THREE.Vector3()
    this.heading = 0
    this.bank = 0
    this.waypoints = []
  }

  hop () { if (this.mode === 'sitzt' && !this.sleeping) this.pa.hop.reset().play() }

  setNacht (on, sofort = false) {
    this.sleeping = on
    if (sofort) {
      this.pm.stopAllAction()
      const action = on ? this.pa.sleep : this.pa.idle
      action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play()
      this.pm.update(0)
      return
    }
    if (on) { this.pa.sleep.reset().play(); this.pa.idle.crossFadeTo(this.pa.sleep, 1.0, false) }
    else { this.pa.idle.reset().play(); this.pa.sleep.crossFadeTo(this.pa.idle, 1.0, false) }
  }

  takeOff (t) {
    if (this.mode !== 'sitzt' || this.sleeping) return
    const q = this.perch.getWorldQuaternion(new THREE.Quaternion())
    const fwd = new THREE.Vector3(1, 0, 0).applyQuaternion(q).setY(0).normalize()
    this.mode = 'fliegt'
    this.perch.visible = false
    this.flyer.visible = true
    this.pos.copy(this.perch.position)
    this.vel.copy(fwd).multiplyScalar(0.8).add(new THREE.Vector3(0, 1.6, 0))
    this.heading = Math.atan2(-fwd.z, fwd.x)
    const c = this.host.group.position
    const side = Math.random() < 0.5 ? 1 : -1
    this.waypoints = [0, 1, 2, 3].map((k) => {
      const a = this.heading + side * (0.9 + k * 1.5) + (Math.random() - 0.5) * 0.4
      const r = 2.5 + Math.random() * 2.5
      return new THREE.Vector3(c.x + Math.cos(a) * r, c.y + 2.2 + Math.random() * 1.8, c.z - Math.sin(a) * r)
    })
    this.landAt = t + 6 + Math.random() * 3
    this.wpUntil = t + 3
  }

  update (t, dt) {
    this.pm.update(dt)
    this.fm.update(dt)
    if (this.mode === 'sitzt') {
      this.anchor.updateWorldMatrix(true, false)
      this.anchor.matrixWorld.decompose(this.perch.position, this.perch.quaternion, new THREE.Vector3())
      if (!this.sleeping && t > this.nextPeck) { this.pa.peck.reset().play(); this.nextPeck = t + 3 + Math.random() * 6 }
      return
    }
    const landing = this.waypoints.length === 0 && t > this.landAt && this.host.mode !== 'trot'
    let target
    if (this.waypoints.length) target = this.waypoints[0]
    else if (landing) target = this.anchor.getWorldPosition(new THREE.Vector3())
    else { // über dem Schaf kreisen, bis es zur Ruhe kommt
      const a = t * 0.9 + (this.name === 'Blaumeise' ? 0 : Math.PI)
      const c = this.host.group.position
      target = new THREE.Vector3(c.x + Math.cos(a) * 2.2, c.y + 2.6, c.z - Math.sin(a) * 2.2)
    }
    const to = target.clone().sub(this.pos)
    const dist = to.length()
    const speed = landing ? Math.min(2.4, 0.35 + dist * 1.3) : 2.4
    const steer = to.normalize().multiplyScalar(speed).sub(this.vel)
    const maxAcc = (landing ? 7 : 4.5) * dt
    if (steer.length() > maxAcc) steer.setLength(maxAcc)
    this.vel.add(steer)
    this.pos.addScaledVector(this.vel, dt)
    if (this.waypoints.length && (dist < 1.3 || t > this.wpUntil)) { this.waypoints.shift(); this.wpUntil = t + 3 }

    const h = Math.atan2(-this.vel.z, this.vel.x)
    let dh = h - this.heading
    dh = Math.atan2(Math.sin(dh), Math.cos(dh))
    this.heading = h
    const bankTarget = THREE.MathUtils.clamp(-dh / Math.max(dt, 1e-3) * 0.35, -0.9, 0.9)
    this.bank += (bankTarget - this.bank) * Math.min(1, dt * 5)
    const xa = this.vel.clone().normalize()
    const ya = UP.clone().addScaledVector(xa, -xa.y).normalize()
    const za = new THREE.Vector3().crossVectors(xa, ya)
    this.flyer.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xa, ya, za)).multiply(new THREE.Quaternion().setFromAxisAngle(X, this.bank))
    this.flyer.position.copy(this.pos)

    const glide = !landing && this.vel.y < -0.25 ? 1 : 0
    const gw = this.fa.glide.getEffectiveWeight() + (glide - this.fa.glide.getEffectiveWeight()) * Math.min(1, dt * 4)
    this.fa.glide.setEffectiveWeight(gw)
    this.fa.flap.setEffectiveWeight(1 - gw)
    this.fa.flap.setEffectiveTimeScale(landing && dist < 1 ? 1.8 : 1.3)
    if (landing && dist < 0.06) {
      this.mode = 'sitzt'
      this.flyer.visible = false
      this.perch.visible = true
      this.pa.hop.reset().play()
    }
  }
}

// ---------------------------------------------------------------------------
// Herde aufbauen, Fokus-Ansicht, Tag/Nacht
// ---------------------------------------------------------------------------
export async function createHerd (world) {
  // Modelle sind Draco-komprimiert (Geometrie) mit WebP-Texturen
  const A = world.ui.assets, D = world.dateien
  const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(`${A}draco/`))
  const texLoader = new THREE.TextureLoader()
  const tex = (url, nearest) => texLoader.loadAsync(url).then((t) => {
    t.colorSpace = THREE.SRGBColorSpace
    if (nearest) t.magFilter = THREE.NearestFilter // harte Pixelkanten wie im Cover
    return t
  })
  const [schaf, bPerch, bFly, rPerch, rFly, bison, steinschaf, taucher, sprite, spriteLiegend, kilma, kilmaLiegend, blisterKarte, feuer] = await Promise.all([
    loader.loadAsync(A + D.schaf),
    loader.loadAsync(A + D.blaumeiseSitzend),
    loader.loadAsync(A + D.blaumeiseFlug),
    loader.loadAsync(A + D.rotkehlchenSitzend),
    loader.loadAsync(A + D.rotkehlchenFlug),
    loader.loadAsync(A + D.bison),
    loader.loadAsync(A + D.steinschaf),
    loader.loadAsync(A + D.taucher),
    tex(A + D.sprite, true),
    tex(A + D.spriteLiegend, true),
    tex(A + D.kilma),
    tex(A + D.kilmaLiegend),
    tex(A + D.blisterKarte),
    tex(A + D.feuer)
  ])
  feuer.colorSpace = THREE.NoColorSpace
  const sprites = { portfolio: { tag: sprite, nacht: spriteLiegend }, kilma: { tag: kilma, nacht: kilmaLiegend } }
  const assets = { schaf, bison, steinschaf, taucher, sprites, blisterKarte, feuer }

  const tiere = []
  for (const cfg of STATIONEN) {
    const tier = new Tier(cfg, assets, world)
    if (cfg.voegel) tier.voegel = [new Vogel('Blaumeise', tier, bPerch, bFly, world), new Vogel('Rotkehlchen', tier, rPerch, rFly, world)]
    tiere.push(tier)
  }

  // --- Kamera-Fahrten -------------------------------------------------------
  const cam = world.camera, controls = world.controls
  const home = world.startKamera // feste Startansicht je nach Quer-/Hochformat
  let tween = null
  function flyTo (pos, target, dur = 1.4) {
    tween = { p0: cam.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: world.clock.elapsedTime, dur }
  }
  function updateTween (t) {
    if (!tween) return
    const k = Math.min(1, (t - tween.start) / tween.dur)
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2 // ease-in-out
    cam.position.lerpVectors(tween.p0, tween.p1, e)
    controls.target.lerpVectors(tween.t0, tween.t1, e)
    cam.lookAt(controls.target)
    if (k === 1) tween = null
  }

  // --- Fokus: Tier links im Bild, rechts Titel + Button; die anderen machen Platz ----
  const { root, signal } = world
  const panel = world.ui.panel
  let focused = null
  function focus (tier) {
    if (focused === tier) return
    const t = world.clock.elapsedTime
    if (focused) unfocusOthers(t)
    focused = tier
    tier.focus()
    tier.fade(1)
    // Platz schaffen: Lauftiere in der Nähe gehen seitlich weg, feste Figuren und Schlafende blenden aus
    for (const o of tiere) {
      if (o === tier) continue
      const d = o.pos.distanceTo(tier.pos)
      if (d > 6.5) continue
      if (world.nacht || !o.makeRoom(t, tier)) o.fade(0)
      o.voegel?.forEach(v => { if (v.mode === 'fliegt') v.landAt = t })
    }
    const p = tier.group.position
    const narrow = world.panelUnten() // Handy: Projekttext steht unter dem Bild, das Tier bleibt mittig
    const dist = tier.cfg.look === 'bison' ? 5.6 : tier.cfg.blister || tier.cfg.motorik ? 4.6 : 3.8
    const h = tier.cfg.look === 'bison' ? 1.0 : 0.6
    // Kamera schaut von der Landseite; Bildschirm-rechts ist dort Three -X -> Ziel nach rechts verschieben, Tier rückt nach links
    const shift = narrow ? 0 : dist * 0.26
    flyTo(new THREE.Vector3(p.x - shift, p.y + h + 0.5, p.z - dist), new THREE.Vector3(p.x - shift, p.y + h, p.z))
    const c = tier.cfg
    panel.querySelector('.panel-titel').innerHTML = c.label.logo
      ? `<img src="${world.ui.logos}${c.label.logo}" alt="${c.titel}">`
      : `<span style="font-family:${c.label.font};letter-spacing:${c.label.spacing ?? '0.01em'}">${c.titel}</span>`
    panel.querySelector('.panel-jahr').textContent = c.jahr
    panel.querySelector('.panel-text').textContent = c.text
    panel.querySelector('.panel-link').href = `${world.ui.basis}works/${c.slug}/`
    panel.classList.add('offen')
    root.classList.add('fokus')
  }
  function unfocusOthers (t) {
    for (const o of tiere) { o.fade(1); o.release(t, world.nacht) }
  }
  function unfocus () {
    if (!focused) return
    unfocusOthers(world.clock.elapsedTime)
    focused = null
    panel.classList.remove('offen')
    root.classList.remove('fokus')
    flyTo(home().pos, home().target)
  }
  panel.querySelector('.panel-zurueck').addEventListener('click', (e) => { e.stopPropagation(); unfocus() }, { signal })
  addEventListener('keydown', (e) => { if (e.key === 'Escape') unfocus() }, { signal })

  // --- Hover und Klick --------------------------------------------------------
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2()
  let hovered = null
  const pickAt = (ev) => {
    const p = world.ui.zuLokal(ev.clientX, ev.clientY) // Handy hochkant: Seite ist um 90° gedreht
    mouse.set(p.x / root.clientWidth * 2 - 1, -(p.y / root.clientHeight) * 2 + 1)
    ray.setFromCamera(mouse, cam)
    let hit = null, best = Infinity
    for (const s of tiere) {
      if (s.opacity < 0.5) continue
      for (const p of s.pickables) {
        const h = ray.intersectObject(p, false)[0]
        if (h && h.distance < best) { best = h.distance; hit = s }
      }
    }
    return hit
  }
  root.addEventListener('pointermove', (ev) => {
    if (ev.target.closest?.('.deich-ui')) return
    const hit = pickAt(ev)
    if (hit !== hovered) {
      if (hit && !focused) { hit.stopAndLook(world.clock.elapsedTime); hit.voegel?.forEach(v => v.hop()) }
      hovered = hit
    }
    root.style.cursor = hovered ? 'pointer' : ''
  }, { signal })
  // Klick auf ein Tier: Fokus. Klick ins Leere: zurück.
  let downAt = null
  root.addEventListener('pointerdown', (ev) => { downAt = [ev.clientX, ev.clientY] }, { signal })
  root.addEventListener('click', (ev) => {
    if (ev.target.closest?.('.deich-ui')) return
    if (downAt && Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 6) return // war ein Ziehen, kein Klick
    const hit = pickAt(ev)
    if (hit) { focus(hit); hit.voegel?.forEach((v, i) => setTimeout(() => v.takeOff(world.clock.elapsedTime), 300 + i * 260)) }
    else unfocus()
  }, { signal })

  return {
    tiere,
    fokus: (slug) => focus(tiere.find(t => t.cfg.slug === slug)), // für Tests und Direktlinks
    zurueck: () => unfocus(),
    // Fokussiertes Tier und sein Rahmen auf dem Bildschirm (Ausgangspunkt für den Übergang zur Projektseite)
    aktuell () {
      if (!focused) return null
      const box = new THREE.Box3().setFromObject(focused.group)
      const w = root.clientWidth, h = root.clientHeight
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (let i = 0; i < 8; i++) {
        const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(cam)
        // Ecke in Seiten- und dann in Bildschirmkoordinaten (die Seite kann um 90° gedreht sein)
        const s = world.ui.zuBildschirm(THREE.MathUtils.clamp((p.x + 1) / 2, 0, 1) * w, THREE.MathUtils.clamp((1 - p.y) / 2, 0, 1) * h)
        x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y)
      }
      return { slug: focused.cfg.slug, titel: focused.cfg.titel, box: { left: x0, top: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) } }
    },
    // Tag/Nacht: nachts legen sich alle Tiere schlafen (Figuren bleiben, wie sie sind)
    setNacht (on, sofort = false) {
      const t = world.clock.elapsedTime
      for (const s of tiere) {
        if (on) { if (s.mode !== 'fokus') s.sleep(t, sofort) } else s.wake(t)
        s.voegel?.forEach(v => v.setNacht(on, sofort))
      }
    },
    update (t, dt) {
      shaderTime.value = t
      updateTween(t)
      for (const s of tiere) s.update(t, dt, tiere)
      for (const s of tiere) s.voegel?.forEach(v => v.update(t, dt))
    }
  }
}
