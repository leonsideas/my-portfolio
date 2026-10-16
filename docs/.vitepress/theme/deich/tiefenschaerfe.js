import * as THREE from 'three'
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js'

// Beim Heranzoomen wandert die Schärfe mit dem gewählten Projekt mit.
export function schaerfeGrenze (abstand) {
  return THREE.MathUtils.clamp(abstand * 0.4, 1.25, 6)
}

export function erzeugeTiefenschaerfe (renderer, scene, camera, qualitaet) {
  const leicht = qualitaet.texturen === '1k'
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    depthBuffer: true,
    samples: leicht ? 0 : 2
  })
  // Die tatsächliche Szenentiefe erhält freigestellte Konturen und ignoriert
  // die unsichtbaren Klickflächen, die nicht in den Tiefenpuffer schreiben.
  target.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType)
  const uniforms = {
    tColor: { value: target.texture },
    tDepth: { value: target.depthTexture },
    texel: { value: new THREE.Vector2() },
    nearClip: { value: camera.near },
    farClip: { value: camera.far },
    sharpDistance: { value: 6 },
    blurPixels: { value: leicht ? 9 : 15 }
  }
  const material = new THREE.ShaderMaterial({
    name: 'DeichVordergrundUnschärfe',
    uniforms,
    defines: { LENS_SAMPLES: leicht ? 12 : 20 },
    depthTest: false,
    depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      void main () {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      #include <packing>
      varying vec2 vUv;
      uniform sampler2D tColor, tDepth;
      uniform vec2 texel;
      uniform float nearClip, farClip, sharpDistance, blurPixels;

      float blurAmount (vec2 uv) {
        float depth = texture2D(tDepth, uv).x;
        float distance = -perspectiveDepthToViewZ(depth, nearClip, farClip);
        return 1.0 - smoothstep(sharpDistance * 0.3, sharpDistance, distance);
      }

      void main () {
        float centerBlur = blurAmount(vUv);
        vec3 color = texture2D(tColor, vUv).rgb;
        float weightSum = 1.0;
        for (int i = 0; i < LENS_SAMPLES; i++) {
          float radius = sqrt((float(i) + 0.5) / float(LENS_SAMPLES));
          float angle = float(i) * 2.39996323;
          vec2 uv = clamp(vUv + vec2(cos(angle), sin(angle)) * radius * blurPixels * texel, vec2(0.0), vec2(1.0));
          float amount = max(centerBlur, blurAmount(uv));
          float weight = smoothstep(radius - 0.12, radius + 0.08, amount) * (1.0 - radius * 0.35);
          color += texture2D(tColor, uv).rgb * weight;
          weightSum += weight;
        }
        gl_FragColor = vec4(color / weightSum, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  })
  const quad = new FullScreenQuad(material)

  return {
    setSize (width, height) {
      const ratio = Math.min(renderer.getPixelRatio(), leicht ? 1.2 : 1.5)
      const w = Math.max(1, Math.round(width * ratio))
      const h = Math.max(1, Math.round(height * ratio))
      target.setSize(w, h)
      uniforms.texel.value.set(1 / w, 1 / h)
      uniforms.blurPixels.value = (leicht ? 9 : 15) * ratio
    },
    render (focusDistance) {
      uniforms.sharpDistance.value = schaerfeGrenze(focusDistance)
      renderer.setRenderTarget(target)
      renderer.render(scene, camera)
      renderer.setRenderTarget(null)
      quad.render(renderer)
    },
    dispose () {
      target.dispose()
      material.dispose()
      quad.dispose()
    }
  }
}
