import type { SimConfig } from '../simulation'
import { useMemo } from 'react'

export function RocketPreview({ config }: { config: SimConfig }) {
  const waterLevel = Math.min(Math.max(config.waterRatio, 0), 1)
  const angle = config.launchAngleDeg
  const pressureNorm = Math.min(Math.max(config.pressureBar / 10, 0), 1)

  const angleLabel = useMemo(() => `${angle.toFixed(0)}°`, [angle])
  const pressureLabel = useMemo(() => `${config.pressureBar.toFixed(1)} bar`, [config.pressureBar])
  const waterLabel = useMemo(() => `${Math.round(waterLevel * 100)}%`, [waterLevel])

  return (
    <div className="preview-card">
      <div className="preview-head">
        <p className="eyebrow">Simulation Preview</p>
        <span className="status-chip">Wireframe</span>
      </div>
      <div className="preview-body">
        <div className="rocket-stage" style={{ transform: `rotate(${angle - 90}deg)` }}>
          <div className="rocket-body">
            <div className="rocket-water" style={{ transform: `scaleY(${waterLevel})` }} />
            <div className="rocket-grid" />
            <div className="rocket-bubbles">
              {[...Array(6)].map((_, i) => {
                const delay = i * 0.6
                const speed = 2.6 - pressureNorm * 1.4
                const left = 15 + (i % 3) * 20
                return <span key={i} style={{ left: `${left}%`, animationDuration: `${speed}s`, animationDelay: `${delay}s` }} />
              })}
            </div>
          </div>
          <div className="rocket-fin left" />
          <div className="rocket-fin right" />
          <div className="rocket-nose" />
        </div>
        <div className="preview-readouts">
          <Readout label="Angle" value={angleLabel} />
          <Readout label="Water" value={waterLabel} />
          <Readout label="Pressure" value={pressureLabel} />
        </div>
        <div className="system-log">
          <p>System Ready...</p>
          <p>Adjust sliders to update wireframe orientation and fill level.</p>
        </div>
      </div>
    </div>
  )
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="readout">
      <span className="readout-label">{label}</span>
      <span className="readout-value">{value}</span>
    </div>
  )
}
