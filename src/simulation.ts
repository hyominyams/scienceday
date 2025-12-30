import { useCallback, useEffect, useRef, useState } from 'react'

export type SimConfig = {
  waterRatio: number
  pressureBar: number
  nozzleDiameterMm: number
  launchAngleDeg: number
  dryMassG: number
}

export type FlightPhase = 'idle' | 'powered' | 'coasting' | 'landed' | 'failed' | 'fail-bounce'

export type Telemetry = {
  altitude: number
  distance: number
  flightDistance: number
  speed: number
  pressureKpa: number
  thrust: number
  remainingWaterG: number
  time: number
  phase: FlightPhase
  paused: boolean
}

type Point3 = [number, number, number]

type SimInternal = {
  config: SimConfig
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  lastFlightDistance: number
  waterMassKg: number
  gasPressureAbs: number
  initialPressureAbs: number
  initialGasVolume: number
  nozzleArea: number
  angleRad: number
  dryMassKg: number
  thrust: number
  phase: FlightPhase
  isPaused: boolean
  failReason: string | null
  failShowAlert: boolean
  time: number
  lastTick: number | null
  path: Point3[]
  failBounceCount: number
}

const ATM_PRESSURE = 101325
const RHO_WATER = 1000
const RHO_AIR = 1.2
const GRAVITY = 9.81
const BOTTLE_VOLUME_M3 = 0.002 // 2 L bottle
// tuned for a realistic flight envelope (default ~60-80 m apogee)
const REF_AREA = 0.0075 // ~100 mm body reference area
const DISCHARGE_COEFF = 0.65 // throttles thrust a bit
const DRAG_COEFF = 0.75 // more drag to keep ranges realistic
const GAMMA = 1.4
const MAX_DT = 0.05
const MAX_PATH_POINTS = 1400

export const defaultConfig: SimConfig = {
  waterRatio: 0.35,
  pressureBar: 6,
  nozzleDiameterMm: 9,
  launchAngleDeg: 60,
  dryMassG: 140,
}

function buildState(config: SimConfig): SimInternal {
  const waterVolume = BOTTLE_VOLUME_M3 * config.waterRatio
  const gasVolume = Math.max(BOTTLE_VOLUME_M3 - waterVolume, 1e-6)
  const initialPressureAbs = (config.pressureBar + 1) * ATM_PRESSURE

  return {
    config,
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    lastFlightDistance: 0,
    waterMassKg: waterVolume * RHO_WATER,
    gasPressureAbs: initialPressureAbs,
    initialPressureAbs,
    initialGasVolume: gasVolume,
    nozzleArea: Math.PI * Math.pow(config.nozzleDiameterMm / 1000 / 2, 2),
    angleRad: (config.launchAngleDeg * Math.PI) / 180,
    dryMassKg: config.dryMassG / 1000,
    thrust: 0,
    phase: 'idle',
    isPaused: false,
    failReason: null,
    time: 0,
    lastTick: null,
    path: [[0, 0, 0]],
    failBounceCount: 0,
    // during failure bounce, show alert only when phase transitions to 'failed'
    failShowAlert: false,
  }
}

function buildTelemetry(sim: SimInternal): Telemetry {
  return {
    altitude: Math.max(sim.position.y, 0),
    distance: sim.position.x,
    flightDistance: sim.lastFlightDistance > 0 ? sim.lastFlightDistance : sim.position.x,
    speed: Math.hypot(sim.velocity.x, sim.velocity.y),
    pressureKpa: sim.gasPressureAbs / 1000,
    thrust: sim.thrust,
    remainingWaterG: Math.max(sim.waterMassKg * 1000, 0),
    time: sim.time,
    phase: sim.phase,
    paused: sim.isPaused,
  }
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function checkFailure(config: SimConfig): { failed: boolean; reason: string | null } {
  const waterPct = config.waterRatio * 100

  if (config.pressureBar > 8)
    return { failed: true, reason: '\uC124\uC815 \uBD88\uC548\uC815, \uC555\uB825\uC774 \uB108\uBB34 \uB192\uC544 \uBCD1\uC774 \uD30C\uC190\uB418\uC5C8\uC2B5\uB2C8\uB2E4.' }
  if (waterPct < 10) return { failed: true, reason: '\uBB3C\uC774 \uB108\uBB34 \uC801\uC5B4 \uCD94\uB825\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4.' }
  if (waterPct > 70) return { failed: true, reason: '\uBB3C\uC774 \uB108\uBB34 \uB9CE\uC544 \uACF5\uAE30 \uCFE0\uC2F1\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4.' }

  const risk =
    clamp01((config.pressureBar - 7.5) / 2) * 0.7 +
    clamp01((10 - waterPct) / 10) * 0.3 +
    clamp01((waterPct - 70) / 10) * 0.3

  if (risk > 0.6) return { failed: true, reason: '\uC555\uB825\u00b7\uBB3C \uBE44\uC728 \uBD88\uADE0\uD615\uC73C\uB85C \uBC1C\uC0AC\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.' }
  return { failed: false, reason: null }
}

function advanceSim(sim: SimInternal, dt: number) {
  if (sim.phase === 'landed' || sim.isPaused) return

  const dir = { x: Math.cos(sim.angleRad), y: Math.sin(sim.angleRad) }
  let thrust = 0
  let gasPressure = sim.gasPressureAbs

  if (sim.phase === 'powered') {
    const waterVolume = sim.waterMassKg / RHO_WATER
    const gasVolume = Math.max(BOTTLE_VOLUME_M3 - waterVolume, 1e-6)
    gasPressure = sim.initialPressureAbs * Math.pow(sim.initialGasVolume / gasVolume, GAMMA)
    const deltaP = Math.max(gasPressure - ATM_PRESSURE, 0)

    if (sim.waterMassKg > 0 && deltaP > 0) {
      const exhaustVel = Math.sqrt((2 * deltaP) / RHO_WATER)
      const massFlow = DISCHARGE_COEFF * sim.nozzleArea * RHO_WATER * exhaustVel
      const usedMass = Math.min(sim.waterMassKg, massFlow * dt)
      thrust = massFlow * exhaustVel + deltaP * sim.nozzleArea
      sim.waterMassKg -= usedMass
      sim.gasPressureAbs = gasPressure

      if (sim.waterMassKg <= 1e-5 || deltaP <= 200) {
        sim.phase = 'coasting'
      }
    } else {
      sim.phase = 'coasting'
      sim.gasPressureAbs = ATM_PRESSURE
    }
  } else {
    sim.gasPressureAbs = ATM_PRESSURE
  }

  const totalMass = Math.max(sim.dryMassKg + sim.waterMassKg, 1e-3)
  const speed = Math.hypot(sim.velocity.x, sim.velocity.y)
  const dragMag = 0.5 * RHO_AIR * DRAG_COEFF * REF_AREA * speed * speed
  const drag =
    speed > 1e-3
      ? { x: (-sim.velocity.x / speed) * dragMag, y: (-sim.velocity.y / speed) * dragMag }
      : { x: 0, y: 0 }

  const thrustVec = sim.phase === 'fail-bounce' ? { x: 0, y: 0 } : { x: dir.x * thrust, y: dir.y * thrust }
  const gravity = { x: 0, y: -totalMass * GRAVITY }

  sim.velocity.x += ((thrustVec.x + drag.x + gravity.x) / totalMass) * dt
  sim.velocity.y += ((thrustVec.y + drag.y + gravity.y) / totalMass) * dt

  sim.position.x += sim.velocity.x * dt
  sim.position.y += sim.velocity.y * dt

  sim.thrust = thrust
  sim.time += dt

  if (sim.position.y <= 0 && sim.time > 0.05 && sim.phase !== 'idle') {
    sim.position.y = 0

    if (sim.phase === 'fail-bounce') {
      const restitution = 0.3
      const horizDamp = 0.45
      const vy = -sim.velocity.y * restitution
      const vx = sim.velocity.x * horizDamp
      sim.failBounceCount += 1
      const small = Math.abs(vy) < 0.35 && Math.abs(vx) < 0.5
      const tooMany = sim.failBounceCount >= 4
      if (small || tooMany) {
        sim.phase = 'failed'
        sim.velocity.x = 0
        sim.velocity.y = 0
        sim.lastFlightDistance = sim.position.x
        sim.failShowAlert = true
      } else {
        sim.velocity.x = vx
        sim.velocity.y = vy
      }
      return
    }

    if (sim.phase === 'failed') {
      sim.velocity.x = 0
      sim.velocity.y = 0
      sim.lastFlightDistance = sim.position.x
      return
    }

    if (sim.velocity.y <= 0) {
      sim.phase = 'landed'
      sim.velocity.x = 0
      sim.velocity.y = 0
      sim.lastFlightDistance = sim.position.x
    }
  }
}

export function useWaterRocketSim(config: SimConfig) {
  const configRef = useRef(config)
  const simRef = useRef<SimInternal>(buildState(config))
  const [phase, setPhase] = useState<FlightPhase>('idle')
  const [paused, setPaused] = useState(false)
  const [path, setPath] = useState<Point3[]>(simRef.current.path)
  const [position, setPosition] = useState<Point3>([0, 0, 0])
  const [velocity, setVelocity] = useState<Point3>([0, 0, 0])
  const [telemetry, setTelemetry] = useState<Telemetry>(buildTelemetry(simRef.current))
  const [lastFlightDistance, setLastFlightDistance] = useState(0)
  const [failReason, setFailReason] = useState<string | null>(null)
  const [failShowAlert, setFailShowAlert] = useState(false)

  const resetState = useCallback(
    (nextPhase: FlightPhase = 'idle') => {
      const fresh = buildState(configRef.current)
      fresh.phase = nextPhase
      fresh.isPaused = false
      fresh.lastTick = null
      simRef.current = fresh
      setPhase(nextPhase)
      setPaused(false)
      setPosition([0, 0, 0])
      setVelocity([0, 0, 0])
      setPath(fresh.path)
      setTelemetry(buildTelemetry(fresh))
      setLastFlightDistance(0)
      setFailReason(null)
      setFailShowAlert(false)
    },
    [setTelemetry],
  )

  const start = useCallback(() => {
    const fail = checkFailure(configRef.current)
    if (fail.failed) {
      const failedState = buildState(configRef.current)
      failedState.phase = 'fail-bounce'
      failedState.isPaused = false
      failedState.failReason = fail.reason
      failedState.failShowAlert = false
      // give a stronger pop so the bottle flies briefly then slams down
      failedState.velocity = {
        x: (Math.random() * 1.8 + 2.4) * (Math.random() > 0.5 ? 1 : -1),
        y: Math.random() * 1.4 + 4.8,
      }
      simRef.current = failedState
      setPhase('fail-bounce')
      setPaused(false)
      setFailReason(fail.reason)
      setPath(failedState.path)
      setPosition([0, 0, 0])
      setVelocity([failedState.velocity.x, failedState.velocity.y, 0])
      setTelemetry(buildTelemetry(failedState))
      setLastFlightDistance(0)
      setFailShowAlert(false)
      return
    }
    resetState('powered')
  }, [resetState])

  const reset = useCallback(() => resetState('idle'), [resetState])

  const togglePause = useCallback(() => {
    const sim = simRef.current
    if (sim.phase === 'idle' || sim.phase === 'landed') return
    sim.isPaused = !sim.isPaused
    sim.lastTick = null
    setPaused(sim.isPaused)
    setTelemetry(buildTelemetry(sim))
  }, [])

  useEffect(() => {
    configRef.current = config
    if (simRef.current.phase === 'idle') {
      resetState(simRef.current.phase)
    }
  }, [config, resetState])

  useEffect(() => {
    let frame: number

    const loop = (now: number) => {
      const sim = simRef.current
      if (sim.lastTick === null) {
        sim.lastTick = now
      }
      const dtMs = now - sim.lastTick
      sim.lastTick = now
      const dt = Math.min(dtMs / 1000, MAX_DT)

      if (!sim.isPaused && (sim.phase === 'powered' || sim.phase === 'coasting' || sim.phase === 'fail-bounce')) {
        advanceSim(sim, dt)
        const point: Point3 = [sim.position.x, Math.max(sim.position.y, 0), 0]
        setPosition(point)
        setVelocity([sim.velocity.x, sim.velocity.y, 0])
        setPath((prev) => {
          const limited = prev.length >= MAX_PATH_POINTS ? prev.slice(prev.length - MAX_PATH_POINTS + 1) : prev
          return [...limited, point]
        })
        setPhase(sim.phase)
        setTelemetry(buildTelemetry(sim))
        if (sim.phase === 'failed' && sim.failShowAlert) {
          setFailShowAlert(true)
        }
        if (sim.phase === 'failed' && sim.failReason) {
          setFailReason(sim.failReason)
        }
      } else if (sim.phase === 'landed' || sim.isPaused) {
        setVelocity([sim.velocity.x, sim.velocity.y, 0])
        setTelemetry(buildTelemetry(sim))
        if (sim.phase === 'landed' && sim.lastFlightDistance > 0) {
          setLastFlightDistance(sim.lastFlightDistance)
        }
        if (sim.phase === 'failed') {
          setFailReason(sim.failReason)
          setFailShowAlert(sim.failShowAlert)
        }
      }

      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [])

  return {
    config: configRef.current,
    phase,
    paused,
    failReason,
    path,
    position,
    velocity,
    telemetry,
    lastFlightDistance,
    failShowAlert,
    start,
    reset,
    togglePause,
  }
}
