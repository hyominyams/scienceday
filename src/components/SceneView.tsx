import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import { Suspense, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { FlightPhase } from '../simulation'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

type Point3 = [number, number, number]

type SceneViewProps = {
  path: Point3[]
  position: Point3
  velocity: Point3
  launchAngleDeg: number
  phase: FlightPhase
  cameraMode: 'follow' | 'fixed'
  lastFlightDistance: number
}

const VIEW_SCALE = 0.12 // 화면 축소 렌더링
const DISPLAY_GAIN = 1.8 // 시원하게 보이도록 화면상 확대 계수
const LAUNCH_PAD_OFFSET_Y = 0.25 // 초기 발사 시 지면에서 약간 띄워 보이게

export function SceneView({
  path,
  position,
  velocity,
  launchAngleDeg,
  phase,
  cameraMode,
  lastFlightDistance,
}: SceneViewProps) {
  const displayPath = useMemo<Point3[]>(
    () => path.map((p) => [p[0] * VIEW_SCALE * DISPLAY_GAIN, p[1] * VIEW_SCALE * DISPLAY_GAIN, p[2]]),
    [path],
  )
  const displayPosition = useMemo<Point3>(
    () => [position[0] * VIEW_SCALE * DISPLAY_GAIN, position[1] * VIEW_SCALE * DISPLAY_GAIN, position[2]],
    [position],
  )
  const displayVelocity = useMemo<Point3>(
    () => [velocity[0] * VIEW_SCALE * DISPLAY_GAIN, velocity[1] * VIEW_SCALE * DISPLAY_GAIN, velocity[2]],
    [velocity],
  )
  const visualPosition = useMemo<Point3>(
    () => [displayPosition[0], displayPosition[1] + (phase === 'landed' ? 0 : LAUNCH_PAD_OFFSET_Y), displayPosition[2]],
    [displayPosition, phase],
  )
  const shakeIntensity = useMemo(() => {
    if (phase === 'failed' || phase === 'fail-bounce') return 1
    if (phase === 'powered') return 0.35
    return 0
  }, [phase])

  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    <div className="scene-card">
      <Canvas shadows camera={{ position: [7, 4.8, 14], fov: 65 }} gl={{ alpha: true }}>
        <SkyBackdrop />
        <fog attach="fog" args={['#0b1a2e', 60, 180]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[7, 10, 5]} intensity={1.1} castShadow />

        <Suspense fallback={null}>
          <Ground />
          <LaunchPad />
          <RocketModel
            position={visualPosition}
            velocity={displayVelocity}
            launchAngleDeg={launchAngleDeg}
            phase={phase}
            lastFlightDistance={lastFlightDistance}
          />
          {displayPath.length > 1 && <Line points={displayPath} color="#4de2ff" lineWidth={2} dashed={false} />}
        </Suspense>

        <FollowCamera target={visualPosition} mode={cameraMode} controlsRef={controlsRef} shake={shakeIntensity} />
        <OrbitControls ref={controlsRef} enablePan={false} minDistance={6} maxDistance={40} />
      </Canvas>
      <div className="scene-label">
        <span>3D 시뮬레이션</span>
        <span className="tag">
          {phase === 'powered' ? '추력 중' : phase === 'coasting' ? '활공' : phase === 'landed' ? '착지' : ''}
        </span>
      </div>
    </div>
  )
}

type RocketModelProps = {
  position: Point3
  velocity: Point3
  launchAngleDeg: number
  phase: FlightPhase
  lastFlightDistance: number
}

function RocketModel({ position, velocity, launchAngleDeg, phase, lastFlightDistance }: RocketModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const tiltLaunch = THREE.MathUtils.degToRad(-(90 - launchAngleDeg))
  const gltf = useGLTF('/assets/rocket/rocket.glb')

  const rocketScene = useMemo(() => {
    const clone = gltf.scene.clone(true)
    clone.traverse((obj) => {
      obj.castShadow = true
      obj.receiveShadow = true
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial
        ;(mat as any).colorSpace = THREE.SRGBColorSpace
        mat.metalness = mat.metalness ?? 0.2
        mat.roughness = mat.roughness ?? 0.35
      }
    })
    return clone
  }, [gltf.scene])

  const rotationZ = useMemo(() => {
    if (phase === 'idle') return 0 // 발사 전 직립
    if (phase === 'landed') return -Math.PI / 2 // 착지 후 눕힘
    const speed = Math.hypot(velocity[0], velocity[1])
    if (speed < 0.5) return tiltLaunch
    const angleFromY = Math.atan2(velocity[0], velocity[1]) // 속도 방향으로 기울이기
    return -angleFromY
  }, [phase, velocity, tiltLaunch])

  const speed = Math.hypot(velocity[0], velocity[1])
  const trailLength = Math.min(Math.max(speed * 0.08, 0.3), 3)
  const velDir = speed > 1e-3 ? [velocity[0] / speed, velocity[1] / speed, 0] : [0, 1, 0]
  const tailStart: Point3 = [0, 0, 0]
  const tailEnd: Point3 = [-velDir[0] * trailLength, -velDir[1] * trailLength, -velDir[2] * trailLength]

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const wobble =
      phase === 'powered' ? 0.035 : phase === 'failed' ? 0.06 : phase === 'coasting' && speed > 0.5 ? 0.015 : 0
    const t = clock.elapsedTime
    const ox = wobble ? Math.sin(t * 22.7) * wobble : 0
    const oy = wobble ? Math.sin(t * 18.5) * wobble : 0
    const oz = wobble ? Math.sin(t * 15.9) * wobble * 0.6 : 0
    groupRef.current.position.set(position[0] + ox, position[1] + oy, position[2] + oz)
  })

  return (
    <group ref={groupRef} position={position} rotation={[0, 0, rotationZ]} scale={[1, 1, 1]}>
      <primitive object={rocketScene} />
      {phase === 'powered' && (
        <>
          <mesh position={[0, -0.4, 0]}>
            <coneGeometry args={[0.08, 0.6, 12, 1, true]} />
            <meshStandardMaterial
              color="#ffdd66"
              emissive="#ff9800"
              emissiveIntensity={1.8}
              transparent
              opacity={0.8}
            />
          </mesh>
          <Line points={[tailStart, tailEnd]} color="#7ef1ff" lineWidth={2} transparent opacity={0.7} />
        </>
      )}
      {phase === 'coasting' && speed > 0.5 && (
        <Line points={[tailStart, tailEnd]} color="#4de2ff" lineWidth={1.5} transparent opacity={0.4} />
      )}
      {phase === 'landed' && lastFlightDistance > 0 && (
        <Html position={[0, 1.6, 0]} center distanceFactor={8}>
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              background: 'rgba(5,9,20,0.8)',
              color: '#e9eef7',
              border: '1px solid #1f2c45',
              boxShadow: '0 8px 18px rgba(0,0,0,0.35)',
              fontWeight: 800,
              fontSize: '18px',
            }}
          >
            {lastFlightDistance.toFixed(1)} m
          </div>
        </Html>
      )}
    </group>
  )
}

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, 0]} receiveShadow>
        <planeGeometry args={[260, 260]} />
        <meshStandardMaterial color="#050a14" roughness={1} metalness={0} />
      </mesh>
      <gridHelper args={[240, 80, '#123047', '#123047']} position={[0, -0.149, 0]} />
      <gridHelper args={[260, 26, '#1f6c8f', '#1f6c8f']} position={[0, -0.148, 0]} />
    </group>
  )
}

function SkyBackdrop() {
  const tex = useTexture('/assets/background/background.png')
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping

  return (
    <group>
      {/* back wall */}
      <mesh position={[0, 30, -140]}>
        <planeGeometry args={[360, 160]} />
        <meshBasicMaterial map={tex} transparent opacity={0.95} side={THREE.DoubleSide} />
      </mesh>
      {/* left side wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-180, 30, 0]}>
        <planeGeometry args={[260, 160]} />
        <meshBasicMaterial map={tex} transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      {/* right side wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[180, 30, 0]}>
        <planeGeometry args={[260, 160]} />
        <meshBasicMaterial map={tex} transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

useGLTF.preload('/assets/rocket/rocket.glb')

function LaunchPad() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, -0.16, 0]} receiveShadow>
        <boxGeometry args={[0.6, 0.04, 0.6]} />
        <meshStandardMaterial color="#1f2c45" />
      </mesh>
      <mesh position={[0, 0.63, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 16]} />
        <meshStandardMaterial color="#3bc4ff" metalness={0.3} roughness={0.35} />
      </mesh>
    </group>
  )
}

function FollowCamera({
  target,
  mode,
  controlsRef,
  shake,
}: {
  target: Point3
  mode: 'follow' | 'fixed'
  controlsRef: RefObject<OrbitControlsImpl | null>
  shake: number
}) {
  const { camera } = useThree()
  const desired = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3())
  const jitter = useRef(new THREE.Vector3())
  const shakeState = useRef(0)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    shakeState.current = THREE.MathUtils.lerp(shakeState.current, shake, 0.08)
    const s = shakeState.current
    if (s > 1e-3) {
      jitter.current.set(
        (Math.sin(t * 18.3) + Math.sin(t * 9.7)) * 0.06 * s,
        (Math.sin(t * 14.1) + Math.sin(t * 11.2)) * 0.05 * s,
        Math.sin(t * 17.7) * 0.05 * s,
      )
    } else {
      jitter.current.set(0, 0, 0)
    }

    if (mode === 'fixed') {
      if (controlsRef.current) {
        const fixedTarget = new THREE.Vector3(0, 1.2, 0).add(jitter.current)
        controlsRef.current.target.lerp(fixedTarget, 0.1)
        controlsRef.current.update()
      }
      return
    }

    const targetVec = new THREE.Vector3(target[0], target[1] + 0.5, target[2])
    const altitudeBoost = Math.min(Math.max(target[1] * 0.8, 0), 20)
    desired.current.set(target[0] + 6, target[1] + 4 + altitudeBoost, target[2] + 14).add(jitter.current)
    camera.position.lerp(desired.current, 0.08)
    look.current.set(targetVec.x, targetVec.y, targetVec.z)
    camera.lookAt(look.current.clone().add(jitter.current))
    if (controlsRef.current) {
      controlsRef.current.target.lerp(look.current.clone().add(jitter.current), 0.15)
      controlsRef.current.update()
    }
  })

  return null
}
