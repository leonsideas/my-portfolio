// Himmel mit echtem Sonnenstand: berechneter Himmelsverlauf, Sonne, Wolken, Sterne und Mond in einem Shader.
// Die Sonne steht so wie gerade an der nordfriesischen Nordseeküste. Der Deich liegt dort nord-südlich,
// die Kamera schaut von der Landseite nach Westen aufs Meer: abends geht die Sonne über dem Wasser unter.
import * as THREE from 'three'

const ORT = { breite: 54.37, laenge: 8.64 } // Westerhever, Nordfriesland
const RAD = Math.PI / 180

// Sonnenhöhe und Azimut (von Norden im Uhrzeigersinn) in Radiant, vereinfachte NOAA-Formeln (genau auf ~0,5°)
export function sonnenstand (datum, ort = ORT) {
  const d = datum.getTime() / 86400000 - 10957.5 // Tage seit J2000.0
  const g = (357.529 + 0.98560028 * d) * RAD
  const q = 280.459 + 0.98564736 * d
  const l = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD
  const e = (23.439 - 0.00000036 * d) * RAD
  const ra = Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l))
  const dek = Math.asin(Math.sin(e) * Math.sin(l))
  const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24
  const h = (gmst * 15 + ort.laenge) * RAD - ra
  const phi = ort.breite * RAD
  const hoehe = Math.asin(Math.sin(phi) * Math.sin(dek) + Math.cos(phi) * Math.cos(dek) * Math.cos(h))
  const azimut = Math.atan2(-Math.sin(h), Math.tan(dek) * Math.cos(phi) - Math.sin(phi) * Math.cos(h))
  return { hoehe, azimut: (azimut + 2 * Math.PI) % (2 * Math.PI) }
}

// Himmelsrichtung -> Three-Vektor. Kamera schaut nach Westen (+Z), rechts im Bild ist Norden (-X), hinter ihr Osten (-Z).
export function richtung (azimut, hoehe) {
  const c = Math.cos(hoehe)
  return new THREE.Vector3(-c * Math.cos(azimut), Math.sin(hoehe), -c * Math.sin(azimut))
}

// Farben nach Sonnenhöhe (Grad): Zenit, Horizont, Sonnenlicht, Stärke des Dämmerungsleuchtens, Helligkeit der Wolken
const STUFEN = [
  [-18, '#02040b', '#060a16', '#000000', 0.0, 0.05],
  [-10, '#040918', '#141c32', '#2a2040', 0.15, 0.08],
  [-4, '#0d1c42', '#5a4458', '#ff6a3a', 0.75, 0.22],
  [0, '#24447a', '#e88452', '#ff7438', 1.0, 0.55],
  [6, '#3a68aa', '#eebd8e', '#ffb070', 0.5, 0.9],
  [15, '#3d78c8', '#9fc1e6', '#fff0d8', 0.12, 1.0],
  [40, '#2f6cc0', '#a8c8ea', '#fff8ee', 0.0, 1.05],
].map(([grad, zenit, horizont, sonne, daemmerung, wolken]) => ({
  grad, zenit: new THREE.Color(zenit), horizont: new THREE.Color(horizont), sonne: new THREE.Color(sonne), daemmerung, wolken
}))

function farbenFuer (grad) {
  const i = Math.max(0, STUFEN.findIndex(s => s.grad > grad) - 1)
  const a = STUFEN[Math.min(i, STUFEN.length - 1)], b = STUFEN[Math.min(i + 1, STUFEN.length - 1)]
  const k = b.grad === a.grad ? 0 : THREE.MathUtils.clamp((grad - a.grad) / (b.grad - a.grad), 0, 1)
  return {
    zenit: a.zenit.clone().lerp(b.zenit, k),
    horizont: a.horizont.clone().lerp(b.horizont, k),
    sonne: a.sonne.clone().lerp(b.sonne, k),
    daemmerung: THREE.MathUtils.lerp(a.daemmerung, b.daemmerung, k),
    wolken: THREE.MathUtils.lerp(a.wolken, b.wolken, k)
  }
}

const SKY_VERTEX = 'varying vec3 vDir; void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }'
const SKY_FRAGMENT = `
  varying vec3 vDir;
  uniform vec3 uSonne, uMond, uZenit, uHorizont, uSonnenFarbe;
  uniform float uZeit, uNacht, uDaemmerung, uWolkenLicht, uSonneSichtbar, uSterne;
  float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float rauschen(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * rauschen(p); p = p * 2.03 + 17.1; a *= 0.5; }
    return v;
  }
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = mix(uHorizont, uZenit, pow(clamp(h, 0.0, 1.0), 0.35));
    float zurSonne = dot(d, uSonne);
    // Dämmerungsleuchten: warmes Band am Horizont auf der Seite der Sonne
    vec2 dFlach = normalize(d.xz + 1e-5), sFlach = normalize(uSonne.xz + 1e-5);
    float seite = max(dot(dFlach, sFlach), 0.0);
    col += uSonnenFarbe * uDaemmerung * exp(-max(h, 0.0) * 5.0) * (0.25 + 0.75 * pow(seite, 3.0)) * 0.6;
    // Sonnenhof und Sonnenscheibe
    col += uSonnenFarbe * uSonneSichtbar * (pow(max(zurSonne, 0.0), 30.0) * 0.45 + pow(max(zurSonne, 0.0), 600.0) * 1.5);
    col += uSonnenFarbe * uSonneSichtbar * 20.0 * smoothstep(0.99990, 0.99995, zurSonne);
    // Sterne (funkeln leicht) und Mond
    if (uSterne > 0.5 && uNacht > 0.01 && h > 0.02) {
      vec3 p = d * 320.0, c = floor(p);
      float r = hash3(c);
      if (r > 0.9975) {
        float s = smoothstep(0.35, 0.0, length(fract(p) - 0.5));
        col += vec3(0.85, 0.9, 1.0) * s * (0.55 + 0.45 * sin(uZeit * (1.5 + r * 3.0) + r * 60.0)) * smoothstep(0.02, 0.2, h) * uNacht;
      }
    }
    float m = dot(d, uMond);
    col += (vec3(0.95, 0.96, 1.0) * smoothstep(0.99955, 0.99975, m) + vec3(0.22, 0.27, 0.42) * pow(max(m, 0.0), 300.0)) * uNacht;
    // Wolken: Rauschen auf einer gedachten Wolkendecke, oben vom Licht getroffen, unten dunkler
    if (h > 0.0) {
      vec2 q = d.xz / (h + 0.08) * 0.9 + vec2(uZeit * 0.004, uZeit * 0.0015);
      float n = fbm(q);
      float bedeckt = smoothstep(0.5, 0.78, n);
      float dichte = smoothstep(0.45, 0.95, fbm(q * 1.7 + 3.1));
      vec3 hell = mix(vec3(1.0), uSonnenFarbe, 0.5) * uWolkenLicht;
      vec3 dunkel = mix(uHorizont, uZenit, 0.5) * mix(0.7, 0.45, uNacht);
      vec3 wolke = mix(hell, dunkel, dichte * 0.75);
      wolke += uSonnenFarbe * uSonneSichtbar * pow(max(zurSonne, 0.0), 8.0) * 0.8 * (1.0 - dichte); // Silberrand nah an der Sonne
      col = mix(col, wolke, bedeckt * smoothstep(0.0, 0.12, h) * 0.92);
    }
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`

// renderer, scene, licht (DirectionalLight mit Schatten), bezug (Punkt, auf den das Licht zielt)
export function erzeugeHimmel (renderer, scene, licht, bezug) {
  const mond = richtung(235 * RAD, 26 * RAD) // Mondscheibe links über dem Meer (fest)
  const mondLicht = richtung(110 * RAD, 34 * RAD) // Mondlicht schräg von hinten links, damit die Tiere nicht im Gegenlicht stehen
  const uniforms = {
    uSonne: { value: new THREE.Vector3(0, 1, 0) },
    uMond: { value: mond },
    uZenit: { value: new THREE.Color() },
    uHorizont: { value: new THREE.Color() },
    uSonnenFarbe: { value: new THREE.Color() },
    uZeit: { value: 0 },
    uNacht: { value: 0 },
    uDaemmerung: { value: 0 },
    uWolkenLicht: { value: 1 },
    uSonneSichtbar: { value: 1 },
    uSterne: { value: 1 }
  }
  const material = (sterne) => new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uSterne: { value: sterne ? 1 : 0 } },
    vertexShader: SKY_VERTEX, fragmentShader: SKY_FRAGMENT, side: THREE.BackSide, depthWrite: false, fog: false
  })
  const kuppel = new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), material(true))
  kuppel.frustumCulled = false
  kuppel.renderOrder = -1
  scene.add(kuppel)

  // Umgebungslicht aus demselben Himmel (ohne Sterne), neu berechnet, wenn sich die Sonne merklich bewegt
  const envScene = new THREE.Scene()
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), material(false)))
  const pmrem = new THREE.PMREMGenerator(renderer)
  let env = null, envHoehe = null, envZeit = -1
  const nebel = new THREE.FogExp2(0x000000, 0)
  scene.fog = nebel

  const zustand = { hoehe: 0, nacht: 0, tageslicht: 1 }
  function update (datum, t, kamera) {
    kuppel.position.copy(kamera.position) // Kuppel wandert mit, wirkt unendlich weit
    const { hoehe, azimut } = sonnenstand(datum)
    const grad = hoehe / RAD
    const f = farbenFuer(grad)
    const sonne = richtung(azimut, hoehe)
    uniforms.uSonne.value.copy(sonne)
    uniforms.uZenit.value.copy(f.zenit)
    uniforms.uHorizont.value.copy(f.horizont)
    uniforms.uSonnenFarbe.value.copy(f.sonne)
    uniforms.uZeit.value = t
    uniforms.uNacht.value = 1 - THREE.MathUtils.smoothstep(grad, -12, -4)
    uniforms.uDaemmerung.value = f.daemmerung
    uniforms.uWolkenLicht.value = f.wolken
    uniforms.uSonneSichtbar.value = THREE.MathUtils.smoothstep(grad, -1.5, 0.5)
    zustand.hoehe = grad
    zustand.nacht = uniforms.uNacht.value
    zustand.tageslicht = THREE.MathUtils.smoothstep(grad, -6, 10) // 0 nachts, 1 ab 10° Sonnenhöhe

    // Licht: Sonne über dem Horizont, sonst Mond (beim Wechsel sind beide fast dunkel)
    const sonnenStaerke = 2.6 * THREE.MathUtils.smoothstep(grad, -1, 14)
    const mondStaerke = 0.9 * (1 - THREE.MathUtils.smoothstep(grad, -8, -2))
    const tags = grad > -2
    licht.intensity = sonnenStaerke + mondStaerke
    licht.color.copy(tags ? f.sonne.clone().lerp(new THREE.Color(1, 1, 1), 0.15) : new THREE.Color(0xaec4ff))
    licht.position.copy(bezug).addScaledVector(tags ? sonne : mondLicht, 40)
    licht.target.position.copy(bezug)

    scene.environmentIntensity = THREE.MathUtils.lerp(1.0, 1.6, zustand.nacht)
    nebel.color.copy(f.horizont).multiplyScalar(0.6)
    nebel.density = 0.011 * zustand.nacht + 0.003 * f.daemmerung

    // Umgebungslicht neu berechnen: bei 0,3° Sonnenbewegung, höchstens zweimal pro Sekunde
    if (envHoehe === null || (Math.abs(grad - envHoehe) > 0.3 && t - envZeit > 0.5)) {
      const neu = pmrem.fromScene(envScene, 0.02)
      env?.dispose()
      env = neu
      scene.environment = env.texture
      envHoehe = grad
      envZeit = t
    }
    return zustand
  }

  return {
    update,
    dispose () { env?.dispose(); pmrem.dispose() }
  }
}
