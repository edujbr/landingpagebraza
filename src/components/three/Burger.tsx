'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { chord, sizzle, thud } from '@/lib/sound'
import { EmberGlow } from './EmberField'

export type Progress = { current: number }

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** Janelas de progresso (0–1 da rolagem) em que cada camada cai no lugar. */
const STAGES = {
  patty: [0.14, 0.3],
  cheese: [0.34, 0.46],
  melt: [0.42, 0.62],
  bacon: [0.54, 0.66],
  onion: [0.6, 0.7],
  top: [0.74, 0.88],
  spin: [0.88, 1],
} as const

/** Momento em que a camada encosta (80% da janela, quando começa o achatamento). */
const landing = ([a, b]: readonly [number, number]) => a + (b - a) * 0.8

/** Sons tocados quando a rolagem passa para a frente por cada ponto. */
const CUES = [
  { at: landing(STAGES.patty), play: () => { thud(0.9); sizzle(1.8) } },
  { at: landing(STAGES.cheese), play: () => thud(0.2) },
  { at: landing(STAGES.bacon), play: () => { thud(0.35); sizzle(1, 0.07) } },
  { at: landing(STAGES.onion), play: () => thud(0.25) },
  { at: landing(STAGES.top), play: () => thud(0.7) },
  { at: 0.97, play: chord },
]

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function bunBottomGeometry() {
  const pts = [
    [0, 0], [1.2, 0], [1.42, 0.05], [1.56, 0.17], [1.6, 0.3], [1.56, 0.42], [1.46, 0.5],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(pts, 72)
}

function bunTopGeometry() {
  const pts: THREE.Vector2[] = [new THREE.Vector2(1.46, 0), new THREE.Vector2(1.6, 0.05)]
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * (Math.PI / 2)
    pts.push(new THREE.Vector2(Math.max(0.0001, 1.64 * Math.cos(a)), 0.12 + 0.98 * Math.sin(a)))
  }
  return new THREE.LatheGeometry(pts, 72)
}

function pattyGeometry() {
  const geo = new THREE.CylinderGeometry(1.64, 1.6, 0.46, 96, 8)
  const pos = geo.attributes.position
  const rand = seeded(7)
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const r = Math.hypot(v.x, v.z)
    const n = Math.sin(v.x * 7.1 + v.z * 3.3) * Math.sin(v.z * 6.7 - v.x * 2.1) * 0.035 + (rand() - 0.5) * 0.03
    if (r > 1.55) {
      const k = 1 + n * 0.9
      v.x *= k
      v.z *= k
      v.y += (rand() - 0.5) * 0.02
    } else {
      v.y += n * 0.5 * Math.sign(v.y)
    }
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  return geo
}

function baconGeometry(phase: number) {
  const geo = new THREE.PlaneGeometry(3.3, 0.46, 96, 6)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const meat = new THREE.Color('#8f2a19')
  const fat = new THREE.Color('#f0c3a5')
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    pos.setY(i, Math.sin(x * 4.6 + phase) * 0.08 + Math.sin(x * 11 + phase * 2) * 0.02)
    const stripe = Math.pow(Math.abs(Math.sin(z * 15 + Math.sin(x * 3) * 0.6)), 6)
    c.copy(meat).lerp(fat, stripe * 0.85)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

function useSesame(count: number) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const rand = seeded(42)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const twist = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    const p = new THREE.Vector3()
    const n = new THREE.Vector3()
    const s = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      const a = THREE.MathUtils.degToRad(18 + rand() * 62)
      const t = rand() * Math.PI * 2
      const r = 1.64 * Math.cos(a)
      p.set(r * Math.cos(t), 0.12 + 0.98 * Math.sin(a), r * Math.sin(t))
      n.set(p.x / 1.64 ** 2, (p.y - 0.12) / 0.98 ** 2, p.z / 1.64 ** 2).normalize()
      p.addScaledVector(n, 0.012)
      q.setFromUnitVectors(up, n)
      twist.setFromAxisAngle(up, rand() * Math.PI)
      q.multiply(twist)
      s.set(1, 1, 1).multiplyScalar(0.85 + rand() * 0.3)
      m.compose(p, q, s)
      mesh.setMatrixAt(i, m)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [count])
  return ref
}

function cheeseMaterial(uniforms: { uMelt: { value: number } }) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#ffb12b',
    emissive: '#ff7a00',
    emissiveIntensity: 0.28,
    roughness: 0.32,
    clearcoat: 0.7,
    clearcoatRoughness: 0.25,
    side: THREE.DoubleSide,
  })
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uMelt = uniforms.uMelt
    shader.vertexShader = 'uniform float uMelt;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      float r = length(transformed.xz);
      float ang = atan(transformed.z, transformed.x);
      float over = smoothstep(1.45, 2.2, r);
      float drip = 0.55 + 0.45 * sin(ang * 7.0 + r * 3.0) + 0.2 * sin(ang * 13.0);
      transformed.y -= over * (0.08 + uMelt * 0.7 * drip);
      transformed.xz *= 1.0 - over * 0.12 * uMelt;`,
    )
  }
  mat.customProgramCacheKey = () => 'braza-cheese'
  return mat
}

type Layer = THREE.Object3D | null

/** Faz a camada cair até `restY`, girando e achatando ao assentar. */
function dropIn(obj: Layer, t: number, restY: number, spin = 1.4) {
  if (!obj) return
  obj.visible = t > 0.001
  const e = easeOut(t)
  obj.position.y = restY + (1 - e) * 5.5
  obj.rotation.y = (1 - e) * spin
  const squash = Math.sin(Math.PI * range(t, 0.78, 1)) * 0.22
  obj.scale.set(1 + squash * 0.5, 1 - squash, 1 + squash * 0.5)
}

export function Burger({ progress, intro }: { progress: Progress; intro: Progress }) {
  const root = useRef<THREE.Group>(null)
  const stack = useRef<THREE.Group>(null)
  const bottom = useRef<THREE.Group>(null)
  const patty = useRef<THREE.Mesh>(null)
  const cheese = useRef<THREE.Mesh>(null)
  const bacon = useRef<THREE.Group>(null)
  const onion = useRef<THREE.Group>(null)
  const top = useRef<THREE.Group>(null)
  const smooth = useRef(0)

  const geo = useMemo(() => {
    const cheesePlane = new THREE.PlaneGeometry(3.05, 3.05, 56, 56)
    cheesePlane.rotateX(-Math.PI / 2)
    const seed = new THREE.SphereGeometry(0.05, 10, 6)
    seed.scale(0.85, 0.42, 1.55)
    return {
      bunBottom: bunBottomGeometry(),
      bunTop: bunTopGeometry(),
      cap: new THREE.CircleGeometry(1.47, 72),
      patty: pattyGeometry(),
      cheese: cheesePlane,
      bacon: [baconGeometry(0), baconGeometry(1.7)],
      onion: new THREE.TorusGeometry(0.42, 0.055, 12, 48),
      seed,
    }
  }, [])

  const cheeseUniforms = useMemo(() => ({ uMelt: { value: 0 } }), [])
  const mats = useMemo(() => ({
    bun: new THREE.MeshPhysicalMaterial({
      color: '#c8732c', roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color('#ffcf8a'), sheenRoughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4,
    }),
    crumb: new THREE.MeshStandardMaterial({ color: '#d7aa6c', roughness: 1, side: THREE.DoubleSide }),
    patty: new THREE.MeshPhysicalMaterial({
      color: '#4b2615', roughness: 0.82, clearcoat: 0.25, clearcoatRoughness: 0.6, emissive: '#ff3d0a', emissiveIntensity: 0.04,
    }),
    cheese: cheeseMaterial(cheeseUniforms),
    bacon: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.48, clearcoat: 0.45, side: THREE.DoubleSide }),
    onion: new THREE.MeshPhysicalMaterial({ color: '#e5c9e2', roughness: 0.3, clearcoat: 0.8, sheen: 0.5, sheenColor: new THREE.Color('#ffffff') }),
    seed: new THREE.MeshStandardMaterial({ color: '#f6e6bd', roughness: 0.6 }),
  }), [cheeseUniforms])

  const sesame = useSesame(96)

  useFrame((state, delta) => {
    const prev = smooth.current
    smooth.current = THREE.MathUtils.damp(smooth.current, progress.current, 5, delta)
    const p = smooth.current
    if (intro.current >= 1) for (const cue of CUES) if (prev < cue.at && p >= cue.at) cue.play()
    const t = state.clock.elapsedTime
    const { viewport, pointer } = state

    if (root.current) {
      const wide = viewport.aspect > 1.05
      const fit = wide ? Math.min(1.3, viewport.height / 5.2) : Math.min(0.95, viewport.width / 4.6)
      root.current.position.x = wide ? viewport.width * 0.21 : 0
      root.current.position.y = wide ? -0.15 : viewport.height * 0.16
      const s = fit * (0.92 + intro.current * 0.08) * (1 + range(p, 0.88, 1) * 0.08)
      root.current.scale.setScalar(s)
      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, 0.06 - pointer.y * 0.12, 3, delta)
      root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, -pointer.x * 0.08, 3, delta)
    }
    if (stack.current) {
      stack.current.rotation.y = t * 0.18 + easeOut(range(p, ...STAGES.spin)) * Math.PI * 2
      stack.current.position.y = Math.sin(t * 1.3) * 0.04
    }

    if (bottom.current) {
      const i = easeOut(intro.current)
      bottom.current.position.y = (1 - i) * -1.5
      bottom.current.scale.setScalar(0.6 + i * 0.4)
      bottom.current.visible = intro.current > 0.001
    }
    dropIn(patty.current, range(p, ...STAGES.patty), 0.73)
    dropIn(cheese.current, range(p, ...STAGES.cheese), 1.0, 0.6)
    dropIn(bacon.current, range(p, ...STAGES.bacon), 1.1, 2)
    dropIn(onion.current, range(p, ...STAGES.onion), 1.19, 2.4)
    dropIn(top.current, range(p, ...STAGES.top), 1.25, 0.9)

    cheeseUniforms.uMelt.value = easeOut(range(p, ...STAGES.melt)) + Math.sin(t * 2) * 0.015
    mats.patty.emissiveIntensity = 0.04 + (1 - range(p, 0.22, 0.4)) * range(p, 0.2, 0.26) * 0.9
  })

  return (
    <group ref={root}>
      <group ref={stack} position-y={0}>
        <group position-y={-1.1}>
          <EmberGlow position={[0, -0.06, 0]} />
          <group ref={bottom}>
            <mesh geometry={geo.bunBottom} material={mats.bun} />
            <mesh geometry={geo.cap} material={mats.crumb} rotation-x={-Math.PI / 2} position-y={0.5} />
          </group>

          <mesh ref={patty} geometry={geo.patty} material={mats.patty} visible={false} />

          <mesh ref={cheese} geometry={geo.cheese} material={mats.cheese} rotation-y={Math.PI / 4} visible={false} />

          <group ref={bacon} visible={false}>
            <mesh geometry={geo.bacon[0]} material={mats.bacon} rotation-y={0.5} position={[0, 0, -0.35]} />
            <mesh geometry={geo.bacon[1]} material={mats.bacon} rotation-y={-0.35} position={[0, 0.05, 0.4]} />
          </group>

          <group ref={onion} visible={false}>
            {[[-0.6, 0.2], [0.55, -0.4], [0.2, 0.75]].map(([x, z], i) => (
              <mesh key={i} geometry={geo.onion} material={mats.onion} position={[x, 0, z]} rotation-x={Math.PI / 2} scale={1 - i * 0.12} />
            ))}
          </group>

          <group ref={top} visible={false}>
            <mesh geometry={geo.bunTop} material={mats.bun} />
            <mesh geometry={geo.cap} material={mats.crumb} rotation-x={Math.PI / 2} position-y={0.001} />
            <instancedMesh ref={sesame} args={[geo.seed, mats.seed, 96]} />
          </group>
        </group>
      </group>
    </group>
  )
}
