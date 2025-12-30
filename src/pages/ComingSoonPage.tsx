type ComingSoonPageProps = {
  feature: 'hang' | 'future'
  onBack: () => void
  onGoWaterRocket: () => void
}

export function ComingSoonPage({ feature, onBack, onGoWaterRocket }: ComingSoonPageProps) {
  const title = feature === 'hang' ? '행글라이더' : '미래사회 디자인'
  return (
    <div className="page-shell">
      <div className="page-topbar">
        <button className="nav-btn" onClick={onBack}>
          ← 메인으로
        </button>
        <p className="nav-title">SCIENCE DAY</p>
      </div>

      <div className="page-content">
        <div className="card">
          <p className="eyebrow">업데이트 진행중</p>
          <h1>{title}</h1>
          <p className="hero-sub">
            지금은 준비 중이에요. 대신 물로켓 시뮬레이터로 과학을 먼저 체험해볼까요?
          </p>
          <div className="button-row">
            <button className="btn primary" onClick={onGoWaterRocket}>
              물로켓 하러가기
            </button>
            <button className="btn ghost" onClick={onBack}>
              메인으로
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

