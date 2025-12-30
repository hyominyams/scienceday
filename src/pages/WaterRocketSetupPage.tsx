import type { SimConfig } from '../simulation'
import { SetupPanel } from '../components/SetupPanel'
import { RocketPreview } from '../components/RocketPreview'

type WaterRocketSetupPageProps = {
  config: SimConfig
  onChange: (partial: Partial<SimConfig>) => void
  onGoSim: () => void
  onBackHome: () => void
}

export function WaterRocketSetupPage({ config, onChange, onGoSim, onBackHome }: WaterRocketSetupPageProps) {
  return (
    <div className="page-shell">
      <div className="page-topbar">
        <button className="nav-btn" onClick={onBackHome}>
          메인으로
        </button>
        <p className="nav-title">WATER ROCKET</p>
      </div>

      <div className="setup-page">
        <div className="setup-layout">
          <div className="sidebar">
            <SetupPanel config={config} onChange={onChange} onGoSim={onGoSim} />
          </div>
          <RocketPreview config={config} />
        </div>
      </div>
    </div>
  )
}
