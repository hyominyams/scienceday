import type { SimConfig } from '../simulation'

type SetupPanelProps = {
  config: SimConfig
  onChange: (partial: Partial<SimConfig>) => void
  onGoSim: () => void
}

type SliderSpec = {
  key: keyof SimConfig
  label: string
  min: number
  max: number
  step: number
  display: (value: number) => string
}

const sliders: SliderSpec[] = [
  {
    key: 'waterRatio',
    label: '물의 양',
    min: 5,
    max: 80,
    step: 1,
    display: (v) => `${Math.round(v * 100)}%`,
  },
  {
    key: 'pressureBar',
    label: '공기 압력',
    min: 1,
    max: 10,
    step: 0.1,
    display: (v) => `${v.toFixed(1)} bar`,
  },
  {
    key: 'launchAngleDeg',
    label: '발사 각도',
    min: 15,
    max: 85,
    step: 1,
    display: (v) => `${v.toFixed(0)}°`,
  },
]

export function SetupPanel({ config, onChange, onGoSim }: SetupPanelProps) {
  return (
    <div className="card setup-card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Water Rocket Lab</p>
          <h1>세팅 & 데이터</h1>
        </div>
        <span className="status-chip status-idle">대기</span>
      </div>

      <div className="slider-grid">
        {sliders.map((slider) => {
          const value = config[slider.key]
          const numericValue = slider.key === 'waterRatio' ? value * 100 : value

          return (
            <label key={slider.key} className="slider">
              <div className="slider-top">
                <span>{slider.label}</span>
                <span className="slider-value mono">{slider.display(value)}</span>
              </div>
              <div className="slider-track">
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={numericValue}
                  onChange={(e) => {
                    const raw = parseFloat(e.target.value)
                    const normalized = slider.key === 'waterRatio' ? raw / 100 : raw
                    onChange({ [slider.key]: normalized } as Partial<SimConfig>)
                  }}
                />
                <div className="slider-ticks" />
              </div>
              <div className="range-labels">
                <span>{slider.min}</span>
                <span>{slider.max}</span>
              </div>
            </label>
          )
        })}
      </div>

      <div className="button-row">
        <button className="btn primary pulse" onClick={onGoSim}>
          시뮬레이션 시작
        </button>
      </div>
    </div>
  )
}
