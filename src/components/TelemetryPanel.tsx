import type { Telemetry } from '../simulation'

type TelemetryPanelProps = {
  telemetry: Telemetry
  lastFlightDistance: number
}

const fmt = (value: number, digits = 1) => value.toFixed(digits)

export function TelemetryPanel({ telemetry, lastFlightDistance }: TelemetryPanelProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">실시간 데이터</p>
          <h2>지금 상태</h2>
        </div>
        <span className="status-chip muted">{telemetry.paused ? '일시정지' : '업데이트 중'}</span>
      </div>

      <div className="telemetry-grid">
        <Metric label="높이" value={`${fmt(telemetry.altitude, 2)} m`} />
        <Metric label="앞으로 간 거리" value={`${fmt(telemetry.distance, 2)} m`} />
        <Metric label="달리는 속도" value={`${fmt(telemetry.speed, 2)} m/s`} />
        <Metric label="로켓 안 압력" value={`${fmt(telemetry.pressureKpa, 1)} kPa`} />
        <Metric label="미는 힘" value={`${fmt(telemetry.thrust, 1)} N`} />
        <Metric label="남은 물" value={`${fmt(telemetry.remainingWaterG, 0)} g`} />
        <Metric label="지난 시간" value={`${fmt(telemetry.time, 2)} s`} />
        <Metric label="이번 비행 거리" value={`${fmt(lastFlightDistance || telemetry.flightDistance, 2)} m`} />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
    </div>
  )
}
