'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

const GOLD = '#C8FF00'

export interface CoverflowPhoto {
  src: string
  title: string
  description: string
}

// Shortest signed distance from `index` to `activeIndex` around a ring of
// `count` cards, so the carousel always spins the short way when wrapping
// from the last card back to the first.
function ringOffset(index: number, activeIndex: number, count: number) {
  let offset = index - activeIndex
  if (offset > count / 2) offset -= count
  if (offset < -count / 2) offset += count
  return offset
}

interface CardProps {
  texture: THREE.Texture
  index: number
  activeIndex: number
  count: number
  onSelect: (index: number) => void
}

function CoverCard({ texture, index, activeIndex, count, onSelect }: CardProps) {
  const mesh = useRef<THREE.Mesh>(null)
  const frame = useRef<THREE.Mesh>(null)
  const material = useRef<THREE.MeshBasicMaterial>(null)
  const frameMaterial = useRef<THREE.MeshBasicMaterial>(null)

  useFrame((_, delta) => {
    if (!mesh.current || !material.current || !frame.current || !frameMaterial.current) return

    const offset = ringOffset(index, activeIndex, count)
    const abs = Math.abs(offset)
    const isActive = offset === 0

    const targetX = offset * 2.15
    const targetZ = -abs * 1.35
    const targetRotY = THREE.MathUtils.clamp(-offset * 0.5, -1.35, 1.35)
    const targetScale = THREE.MathUtils.clamp(1.15 - abs * 0.16, 0.5, 1.15)
    const targetOpacity = THREE.MathUtils.clamp(1 - abs * 0.24, 0.3, 1)

    const lerp = 1 - Math.pow(0.0015, delta)

    for (const obj of [mesh.current, frame.current]) {
      obj.position.x = THREE.MathUtils.lerp(obj.position.x, targetX, lerp)
      obj.position.z = THREE.MathUtils.lerp(obj.position.z, targetZ, lerp)
      obj.rotation.y = THREE.MathUtils.lerp(obj.rotation.y, targetRotY, lerp)
      const nextScale = THREE.MathUtils.lerp(obj.scale.x || targetScale, targetScale, lerp)
      obj.scale.setScalar(nextScale)
    }

    material.current.opacity = THREE.MathUtils.lerp(material.current.opacity, targetOpacity, lerp)
    frameMaterial.current.opacity = THREE.MathUtils.lerp(
      frameMaterial.current.opacity,
      isActive ? 0.9 : targetOpacity * 0.35,
      lerp
    )
  })

  return (
    <group>
      <mesh ref={frame} position={[0, 0, -0.02]}>
        <planeGeometry args={[1.82, 2.22]} />
        <meshBasicMaterial ref={frameMaterial} color={GOLD} transparent opacity={0.3} toneMapped={false} />
      </mesh>
      <mesh
        ref={mesh}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(index)
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <planeGeometry args={[1.7, 2.1]} />
        <meshBasicMaterial ref={material} map={texture} transparent opacity={1} toneMapped={false} />
      </mesh>
    </group>
  )
}

function CoverflowRig({
  photos,
  activeIndex,
  onSelect,
}: {
  photos: readonly CoverflowPhoto[]
  activeIndex: number
  onSelect: (index: number) => void
}) {
  const textures = useTexture(photos.map((p) => p.src))

  return (
    <>
      {textures.map((texture, i) => (
        <CoverCard
          key={photos[i].src}
          texture={texture}
          index={i}
          activeIndex={activeIndex}
          count={photos.length}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}

export interface ServicesCoverflowSceneProps {
  photos: readonly CoverflowPhoto[]
  activeIndex: number
  onSelect: (index: number) => void
}

export default function ServicesCoverflowScene({ photos, activeIndex, onSelect }: ServicesCoverflowSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.4], fov: 38 }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      className="!absolute !inset-0"
    >
      <ambientLight intensity={1} />
      <Suspense fallback={null}>
        <CoverflowRig photos={photos} activeIndex={activeIndex} onSelect={onSelect} />
      </Suspense>
    </Canvas>
  )
}
