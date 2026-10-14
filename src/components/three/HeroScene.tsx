'use client'

import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Burger, type Progress } from './Burger'
import { EmberField } from './EmberField'

function CameraRig({ progress }: { progress: Progress }) {
  const tilt = useRef({ x: 0, y: 0 })
  const look = useRef(new THREE.Vector3(0, 0.1, 0))

  useEffect(() => {
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      tilt.current.x = THREE.MathUtils.clamp(e.gamma / 30, -1, 1)
      tilt.current.y = THREE.MathUtils.clamp((e.beta - 45) / 30, -1, 1)
    }
    window.addEventListener('deviceorientation', onTilt)
    return () => window.removeEventListener('deviceorientation', onTilt)
  }, [])

  useFrame((state, delta) => {
    const { camera, pointer } = state
    const px = pointer.x + tilt.current.x
    const py = pointer.y - tilt.current.y
    const dolly = 9.5 - Math.max(0, progress.current - 0.85) * 3
    camera.position.x = THREE.MathUtils.damp(camera.position.x, px * 0.7, 2.5, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 1.1 + py * 0.45, 2.5, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, dolly, 2.5, delta)
    camera.lookAt(look.current)
  })
  return null
}

function Intro({ intro }: { intro: Progress }) {
  useFrame((_, delta) => { intro.current = Math.min(1, intro.current + delta / 1.4) })
  return null
}

export default function HeroScene({
  progress,
  active,
  mobile,
  onReady,
}: {
  progress: Progress
  active: boolean
  mobile: boolean
  onReady: () => void
}) {
  const intro = useRef(0)
  const maxDpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75)
  const [dpr, setDpr] = useState(maxDpr)

  return (
    <Canvas
      className="hero-canvas"
      frameloop={active ? 'always' : 'never'}
      dpr={dpr}
      camera={{ fov: 32, position: [0, 1.3, 9.5], near: 0.1, far: 60 }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        requestAnimationFrame(onReady)
      }}
      aria-hidden="true"
    >
      <color attach="background" args={['#171613']} />
      <fog attach="fog" args={['#171613', 9, 22]} />

      <ambientLight intensity={0.18} color="#ffd9a8" />
      <directionalLight position={[3, 6, 5]} intensity={1.6} color="#fff1dc" />
      <pointLight position={[0, -2.2, 1.5]} intensity={40} distance={9} color="#ff6a1f" />
      <pointLight position={[-4, 2, -3]} intensity={30} distance={12} color="#ffc061" />
      <spotLight position={[4, 3, -4]} angle={0.5} penumbra={1} intensity={60} color="#ff8a3d" />

      <Environment resolution={mobile ? 64 : 256} frames={1}>
        <Lightformer form="rect" intensity={2} color="#ffe2b8" position={[0, 5, 4]} scale={[8, 3, 1]} />
        <Lightformer form="ring" intensity={3} color="#ff7a2e" position={[0, -4, 2]} scale={4} />
        <Lightformer form="rect" intensity={1.2} color="#ffb34c" position={[-6, 1, -2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
      </Environment>

      <PerformanceMonitor
        bounds={() => [45, 58]}
        flipflops={3}
        onDecline={() => setDpr((d) => Math.max(1, +(d - 0.25).toFixed(2)))}
        onIncline={() => setDpr((d) => Math.min(maxDpr, +(d + 0.25).toFixed(2)))}
        onFallback={() => setDpr(1)}
      />
      <Intro intro={intro} />
      <CameraRig progress={progress} />
      <Burger progress={progress} intro={intro} />
      <EmberField count={mobile ? 600 : 1800} progress={progress} />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={mobile ? 0.6 : 1.05} radius={0.75} />
        <Vignette offset={0.3} darkness={0.65} />
      </EffectComposer>
    </Canvas>
  )
}
