import { useEffect, useRef } from 'react'
import type { SimConfig } from '../simulation'
import type { useWaterRocketSim } from '../simulation'
import { defaultConfig } from '../simulation'
import { SceneView } from '../components/SceneView'
import { TelemetryPanel } from '../components/TelemetryPanel'

type WaterRocketSimPageProps = {
  config: SimConfig
  sim: ReturnType<typeof useWaterRocketSim>
  cameraMode: 'follow' | 'fixed'
  onToggleCamera: () => void
  onBackHome: () => void
  onBackToSetup: () => void
  onApplyConfig: (config: SimConfig) => void
  onForceCameraFollow: () => void
}

export function WaterRocketSimPage({
  sim,
  cameraMode,
  onToggleCamera,
  onBackHome,
  onBackToSetup,
  onApplyConfig,
  onForceCameraFollow,
}: WaterRocketSimPageProps) {
  const startAudioRef = useRef<HTMLAudioElement | null>(null)
  const endAudioRef = useRef<HTMLAudioElement | null>(null)
  const startStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPhaseRef = useRef(sim.phase)

  useEffect(() => {
    startAudioRef.current = new Audio('/sound/rocket_start.mp3')
    startAudioRef.current.preload = 'auto'

    endAudioRef.current = new Audio('/sound/rocket_end.wav')
    endAudioRef.current.preload = 'auto'
    endAudioRef.current.loop = true

    return () => {
      if (startStopTimer.current) clearTimeout(startStopTimer.current)
      startAudioRef.current?.pause()
      endAudioRef.current?.pause()
    }
  }, [])

  const playStartSnippet = () => {
    const audio = startAudioRef.current
    if (!audio) return
    try {
      audio.currentTime = Math.min(2, audio.duration || 2)
      audio.play().catch(() => {})
      if (startStopTimer.current) clearTimeout(startStopTimer.current)
      startStopTimer.current = setTimeout(() => {
        audio.pause()
        audio.currentTime = 0
      }, 1000)
    } catch {
      /* ignore playback errors */
    }
  }

  const startEndLoop = () => {
    const audio = endAudioRef.current
    if (!audio) return
    try {
      audio.currentTime = Math.min(7, audio.duration || 7)
      audio.loop = true
      audio.play().catch(() => {})
    } catch {
      /* ignore playback errors */
    }
  }

  const stopEndLoop = () => {
    const audio = endAudioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
  }

  const handleGoSetup = () => {
    sim.reset()
    onBackToSetup()
  }

  useEffect(() => {
    if (sim.phase === 'failed' && cameraMode === 'fixed') {
      onForceCameraFollow()
    }
  }, [sim.phase, cameraMode, onForceCameraFollow])

  useEffect(() => {
    const prevPhase = prevPhaseRef.current
    const phase = sim.phase

    // Launch start sound
    if (phase === 'powered' && prevPhase !== 'powered') {
      playStartSnippet()
      startEndLoop()
    }

    // keep end sound during powered/coasting/fail-bounce
    if (phase === 'coasting' || phase === 'fail-bounce') {
      if (endAudioRef.current?.paused) startEndLoop()
    }

    // stop end sound on landing or final failure
    if (phase === 'landed' || phase === 'failed') {
      stopEndLoop()
    }

    // store prev
    prevPhaseRef.current = phase
  }, [sim.phase])

  const failureMessage = sim.failReason ?? '압력과 물 비율을 조정해주세요.'

  return (
    <div className="page-shell">
      <div className="page-topbar">
        <button className="nav-btn" onClick={onBackHome}>
          메인으로
        </button>
        <button className="nav-btn ghost" onClick={onBackToSetup}>
          세팅으로
        </button>
        <p className="nav-title">WATER ROCKET</p>
      </div>

      <div className="app-shell">
        <div className="sidebar">
          <ActionPanel
            onLaunch={sim.start}
            onPauseToggle={sim.togglePause}
            onGoSetup={handleGoSetup}
            paused={sim.paused}
            phase={sim.phase}
            cameraMode={cameraMode}
            onToggleCamera={onToggleCamera}
          />
          <TelemetryPanel telemetry={sim.telemetry} lastFlightDistance={sim.lastFlightDistance} />
        </div>

        <div className="scene-column">
          {sim.phase === 'failed' && sim.failShowAlert && (
            <div className="fail-overlay">
              <div className="fail-card">
                <p className="panel-kicker">SAFETY ALERT</p>
                <h2 className="panel-title">설정 불안정</h2>
                <p className="fail-reason">{failureMessage}</p>
                <div className="fail-actions">
                  <button className="btn primary" onClick={sim.reset}>
                    재시도
                  </button>
                </div>
              </div>
            </div>
          )}
          <SceneView
            path={sim.path}
            position={sim.position}
            velocity={sim.velocity}
            launchAngleDeg={sim.config.launchAngleDeg}
            phase={sim.phase}
            cameraMode={cameraMode}
            lastFlightDistance={sim.lastFlightDistance}
          />
        </div>
      </div>
    </div>
  )
}

function ActionPanel({
  onLaunch,
  onPauseToggle,
  onGoSetup,
  paused,
  phase,
  cameraMode,
  onToggleCamera,
}: {
  onLaunch: () => void
  onPauseToggle: () => void
  onGoSetup: () => void
  paused: boolean
  phase: string
  cameraMode: 'follow' | 'fixed'
  onToggleCamera: () => void
}) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">조작</p>
          <h1>시뮬레이션</h1>
        </div>
        <span className={`status-chip status-${phase}`}>{friendlyPhase(phase, paused)}</span>
      </div>
      <div className="button-row">
        <button className="btn primary" onClick={onLaunch}>
          발사하기
        </button>
        <button className="btn ghost" onClick={onPauseToggle} disabled={phase === 'idle' || phase === 'landed'}>
          {paused ? '다시 시작' : '잠깐 멈춤'}
        </button>
        <button className="btn subtle" onClick={onGoSetup}>
          세팅으로
        </button>
        <button className="btn subtle" onClick={onToggleCamera}>
          카메라 {cameraMode === 'follow' ? '추적' : '고정'}
        </button>
      </div>
    </div>
  )
}

function friendlyPhase(phase: string, paused: boolean) {
  if (paused && phase !== 'idle' && phase !== 'landed') return '일시정지'
  switch (phase) {
    case 'idle':
      return '대기'
    case 'powered':
      return '추력 중'
    case 'coasting':
      return '활공'
    case 'fail-bounce':
      return '비상 비행'
    case 'failed':
      return '실패'
    case 'landed':
      return '착지'
    default:
      return phase
  }
}
