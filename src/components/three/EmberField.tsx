'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'

const emberVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uHeight;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uHeat;
  varying float vLife;
  varying float vSeed;

  void main() {
    vec3 p = position;
    float speed = 0.35 + aSeed * 0.75 + uHeat * 0.4;
    float life = fract(aSeed * 7.13 + uTime * speed / uHeight);
    p.y = -uHeight * 0.45 + life * uHeight;
    p.x += sin(uTime * 0.8 + aSeed * 31.0) * 0.45 * life;
    p.z += cos(uTime * 0.6 + aSeed * 19.0) * 0.3;

    vec2 d = p.xy - uMouse;
    float dist = length(d) + 0.0001;
    p.xy += (d / dist) * smoothstep(1.8, 0.0, dist) * 1.1;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.35 + aSeed) * uPixelRatio / -mv.z;
    vLife = life;
    vSeed = aSeed;
  }
`

const emberFragment = /* glsl */ `
  uniform float uHeat;
  varying float vLife;
  varying float vSeed;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float fade = smoothstep(0.0, 0.08, vLife) * (1.0 - smoothstep(0.55, 1.0, vLife));
    vec3 hot = vec3(1.0, 0.86, 0.5);
    vec3 warm = vec3(0.95, 0.38, 0.1);
    vec3 col = mix(hot, warm, vSeed) * (1.6 + uHeat);
    gl_FragColor = vec4(col, core * core * fade);
  }
`

export function EmberField({ count, progress }: { count: number; progress: { current: number } }) {
  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18
      pos[i * 3 + 1] = 0
      pos[i * 3 + 2] = -6 + Math.random() * 8
      seeds[i] = Math.random()
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20)

    const m = new THREE.ShaderMaterial({
      vertexShader: emberVertex,
      fragmentShader: emberFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uHeight: { value: 12 },
        uSize: { value: 48 },
        uPixelRatio: { value: 1 },
        uMouse: { value: new THREE.Vector2(99, 99) },
        uHeat: { value: 0 },
      },
    })
    return { geometry: g, material: m }
  }, [count])

  useFrame((state) => {
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uPixelRatio.value = state.gl.getPixelRatio()
    u.uMouse.value.set(state.pointer.x * state.viewport.width * 0.5, state.pointer.y * state.viewport.height * 0.5)
    const p = progress.current
    u.uHeat.value = THREE.MathUtils.lerp(u.uHeat.value, p > 0.2 && p < 0.35 ? 0.9 : p > 0.9 ? 0.6 : 0.15, 0.05)
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const glowFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float flicker = 0.85 + 0.15 * sin(uTime * 3.1) * sin(uTime * 1.7 + 1.3);
    float a = pow(smoothstep(1.0, 0.0, d), 2.2) * flicker;
    vec3 col = mix(vec3(0.9, 0.25, 0.06), vec3(1.0, 0.7, 0.3), smoothstep(0.6, 0.0, d)) * 1.4;
    gl_FragColor = vec4(col, a);
  }
`

/** Leito de brasa embaixo do lanche: um disco aditivo que pulsa. */
export function EmberGlow(props: { position?: [number, number, number]; scale?: number }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
  }), [])

  useFrame((state) => { material.uniforms.uTime.value = state.clock.elapsedTime })

  return (
    <mesh {...props} rotation-x={-Math.PI / 2} material={material}>
      <planeGeometry args={[6, 6]} />
    </mesh>
  )
}
