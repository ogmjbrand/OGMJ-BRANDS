'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { MotionValue } from 'framer-motion'
import * as THREE from 'three'

const GOLD = '#C8FF00'
const EMERALD = '#10B981'

interface NetworkFieldProps {
  pointerX: MotionValue<number>
  pointerY: MotionValue<number>
}

// Builds a sparse "constellation" of points inside a flattened sphere and
// connects nearby points with faint lines, evoking a business intelligence
// network without the cost of a textured globe or postprocessing bloom.
function useNetworkGeometry(count: number, radius: number, linkDistance: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3)
    const nodeColors = new Float32Array(count * 3)
    const goldColor = new THREE.Color(GOLD)
    const emeraldColor = new THREE.Color(EMERALD)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (0.55 + Math.random() * 0.45)
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.6
      const z = r * Math.cos(phi) * 0.7

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      const mixed = Math.random() > 0.72 ? emeraldColor : goldColor
      nodeColors[i * 3] = mixed.r
      nodeColors[i * 3 + 1] = mixed.g
      nodeColors[i * 3 + 2] = mixed.b
    }

    const linePositions: number[] = []
    for (let i = 0; i < count; i++) {
      const ix = positions[i * 3]
      const iy = positions[i * 3 + 1]
      const iz = positions[i * 3 + 2]
      for (let j = i + 1; j < count; j++) {
        const jx = positions[j * 3]
        const jy = positions[j * 3 + 1]
        const jz = positions[j * 3 + 2]
        const dist = Math.hypot(ix - jx, iy - jy, iz - jz)
        if (dist < linkDistance) {
          linePositions.push(ix, iy, iz, jx, jy, jz)
        }
      }
    }

    return {
      pointPositions: positions,
      nodeColors,
      linePositions: new Float32Array(linePositions),
    }
  }, [count, radius, linkDistance])
}

function NetworkField({ pointerX, pointerY }: NetworkFieldProps) {
  const group = useRef<THREE.Group>(null)
  const { pointPositions, nodeColors, linePositions } = useNetworkGeometry(90, 3.4, 1.1)

  useFrame((_, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * 0.045
    const targetX = pointerY.get() * 0.25
    const targetY = pointerX.get() * 0.35
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.04
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.01
  })

  return (
    <group ref={group}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={GOLD} transparent opacity={0.12} />
      </lineSegments>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pointPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[nodeColors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.055} vertexColors transparent opacity={0.9} sizeAttenuation />
      </points>
    </group>
  )
}

interface HeroNetworkSceneProps {
  pointerX: MotionValue<number>
  pointerY: MotionValue<number>
}

export default function HeroNetworkScene({ pointerX, pointerY }: HeroNetworkSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      className="!absolute !inset-0"
    >
      <NetworkField pointerX={pointerX} pointerY={pointerY} />
    </Canvas>
  )
}
