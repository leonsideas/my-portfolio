// Leistungsstufe und Dateien der Deichszene. Ohne Three.js, damit die Startseite die Dateien schon anfordern kann,
// während Three.js selbst noch lädt (vorladen). Pfade relativ zu docs/public/deich/.

// Handy/Tablet bekommen kleinere Schatten, geringere Pixeldichte und 1K-Texturen
export function qualitaet () {
  const leicht = matchMedia('(max-width: 900px), (pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4
  return leicht
    ? { pixelRatio: 1.5, schatten: 1024, texturen: '1k' }
    : { pixelRatio: 2, schatten: 2048, texturen: '2k' }
}

export function dateien (q) {
  const k1 = q.texturen === '1k' ? '_1k' : ''
  return {
    grasFarbe: 'boden/gras_diff_1k.webp',
    grasNormal: 'boden/gras_nor_gl_1k.webp',
    schaf: `schaf_klanggestalten_rig${k1}.glb`,
    bison: `bison_rig${k1}.glb`,
    steinschaf: `steinschaf${k1}.glb`,
    blaumeiseSitzend: 'vogel_blaumeise_sitzend.glb',
    blaumeiseFlug: 'vogel_blaumeise_flug.glb',
    rotkehlchenSitzend: 'vogel_rotkehlchen_sitzend.glb',
    rotkehlchenFlug: 'vogel_rotkehlchen_flug.glb',
    taucher: `schaf_taucher_rig${k1}.glb`, // Reefresh: Schaf mit Neoprenanzug und Taucherflasche
    sprite: 'portfolio_strichschaf.png',
    spriteLiegend: 'portfolio_strichschaf_liegend-freigestellt.png',
    kilma: 'kilma_schaf.png',
    kilmaLiegend: 'kilma_schaf_liegend.png',
    blisterKarte: 'blister_karte.webp',
    feuer: 'feuer_flipbook.webp',
    dracoWrapper: 'draco/draco_wasm_wrapper.js',
    dracoWasm: 'draco/draco_decoder.wasm',
  }
}

// Alle Dateien gleichzeitig anfordern; die Loader bekommen sie danach aus dem Browser-Cache
export function vorladen (basis) {
  for (const datei of Object.values(dateien(qualitaet()))) {
    fetch(basis + datei).catch(() => { /* die Szene lädt selbst noch einmal und meldet Fehler dort */ })
  }
}
