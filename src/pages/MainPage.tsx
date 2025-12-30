type MainPageProps = {
  onSelectWaterRocket: () => void
  onSelectHangGlider: () => void
  onSelectFutureDesign: () => void
}

type ExperienceCard = {
  id: 'water' | 'hang' | 'future'
  title: string
  subtitle: string
  description: string
  image: string
  badge: string
  status: 'active' | 'coming'
  action: string
  onSelect: () => void
}

export function MainPage({ onSelectWaterRocket, onSelectHangGlider, onSelectFutureDesign }: MainPageProps) {
  const experiences: ExperienceCard[] = [
    {
      id: 'water',
      title: 'Water Rocket Lab',
      subtitle: 'Pressure · Water Ratio · Angle 튜닝',
      description: '실시간 3D 시뮬레이션으로 고도·추력·속도를 바로 확인하는 Science Day 대표 체험.',
      image: '/assets/home/water-unsplash.jpg',
      badge: 'LIVE NOW',
      status: 'active',
      action: '시뮬레이터 시작',
      onSelect: onSelectWaterRocket,
    },
    {
      id: 'hang',
      title: 'Ridge Glider Preview',
      subtitle: '바람·각도에 따른 비행 궤적 카드 프리뷰',
      description: '산등성이 상승기류를 스캔하는 Hang Glider 티저. 각도·풍향에 따라 바뀌는 라인을 살펴보세요.',
      image: '/assets/home/hang-unsplash.jpg',
      badge: 'COMING SOON',
      status: 'coming',
      action: '프리뷰 보기',
      onSelect: onSelectHangGlider,
    },
    {
      id: 'future',
      title: 'Future City Walkthrough',
      subtitle: '과학의 날 콘셉트로 꾸미는 가상 전시장',
      description: '미래 구조물과 전시 동선을 엿보는 창작 존. Science Day 톤앤매너로 무드보드부터 탐색합니다.',
      image: '/assets/home/future-unsplash.jpg',
      badge: 'STAGING',
      status: 'coming',
      action: '콘셉트 보기',
      onSelect: onSelectFutureDesign,
    },
  ]

  return (
    <div className="main-page">
      <div className="bg-grid-pattern" aria-hidden />
      <div className="bg-gradient-glow" aria-hidden />

      <header className="science-hero">
        <div className="science-hero-inner">
          <div className="hero-topline">
            <span className="hero-kicker">Digital Simulation Lab</span>
            <div className="hero-line" />
            <span className="hero-tag">EST. 2026</span>
          </div>

          <div className="hero-grid">
            <div className="hero-copy">
              <h1 className="hero-title">
                Science Day
                <br />
                <span className="hero-title-accent">Immersive Lab</span>
              </h1>
              <p className="hero-subtitle">
                가상 환경에서 펼쳐지는 정밀한 물리 시뮬레이션. 데이터 기반의 인터랙티브 과학 플랫폼을 경험하세요.
              </p>

              <div className="hero-chips" role="list">
                <span className="hero-chip" role="listitem">
                  <PillIcon type="rocket" />
                  Water Rocket 3D
                </span>
                <span className="hero-chip" role="listitem">
                  <PillIcon type="chart" />
                  Live Telemetry
                </span>
                <span className="hero-chip" role="listitem">
                  <PillIcon type="spark" />
                  Future City
                </span>
              </div>

              <div className="hero-cta-row">
                <button className="btn primary pulse" onClick={onSelectWaterRocket}>
                  물로켓 시뮬레이터
                </button>
                <div className="btn-group-secondary">
                  <button className="btn outline" onClick={onSelectHangGlider}>
                    행글라이더 시뮬레이터
                  </button>
                  <button className="btn outline" onClick={onSelectFutureDesign}>
                    미래도시 설계
                  </button>
                </div>
              </div>
            </div>

            <div className="hero-visual" aria-hidden>
              <div className="hero-frame">
                <div className="frame-border top-left" />
                <div className="frame-border bottom-right" />
                <div className="hero-grid-panel">
                  <div className="hero-grid-overlay" />
                  <div className="hero-scanlines" />
                  <div className="hero-scanner-line" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="home-content">
        <section className="tool-select" id="experiences">
          <div className="section-head">
            <div className="section-title-area">
              <p className="section-kicker">Experimental Modules</p>
              <h2 className="section-title">체험 모듈 선택</h2>
            </div>
            <p className="section-note">시뮬레이션 데이터와 상호작용할 준비가 되셨나요?</p>
          </div>

          <div className="experience-grid">
            {experiences.map((exp, index) => (
              <article
                key={exp.id}
                className={`experience-card ${exp.status === 'coming' ? 'is-muted' : ''}`}
                onClick={exp.onSelect}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    exp.onSelect()
                  }
                }}
              >
                <div className="experience-media">
                  <img src={exp.image} alt={exp.title} />
                  <div className="media-overlay" />
                  <span className={`experience-badge status-${exp.status}`}>
                    <span className="dot" /> {exp.badge}
                  </span>
                </div>
                <div className="experience-body">
                  <span className="exp-id">0{index + 1}</span>
                  <p className="experience-subtitle">{exp.subtitle}</p>
                  <h3 className="experience-title">{exp.title}</h3>
                  <p className="experience-desc">{exp.description}</p>
                  <div className="experience-footer">
                    <span className="experience-action">{exp.action}</span>
                    <MiniIcon path="M5 12h14M12 5l7 7-7 7" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="outcome-panel">
          <div className="outcome-container">
            <div className="outcome-visual">
              <div className="video-placeholder">
                <img src="/assets/home/outcome-digital.jpg" alt="Science Day immersive scene" />
                <div className="data-overlay">
                  <div className="data-item">LAT: 37.5665° N</div>
                  <div className="data-item">LNG: 126.9780° E</div>
                </div>
              </div>
            </div>
            <div className="outcome-copy">
              <p className="panel-kicker">LEARNING OBJECTIVES</p>
              <h2 className="panel-title">Science Day Lab에서 탐구하는 핵심 가치</h2>
              <ul className="outcome-list">
                <li>
                  <strong>가설 검증 시뮬레이션</strong>
                  <span>물리 변수를 조정해 결과를 예측하고 실패 비용을 줄입니다.</span>
                </li>
                <li>
                  <strong>실시간 데이터 텔레메트리</strong>
                  <span>고도·속도·추력 등 복잡한 수치를 시각화하며 분석 역량을 키웁니다.</span>
                </li>
                <li>
                  <strong>융합적 사고 확장</strong>
                  <span>항공 역학부터 도시 설계까지, 과학 원리가 적용된 분야를 탐색합니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <p className="footer-title">
              SCIENCE DAY <span>IMMERSIVE LAB</span>
            </p>
            <div className="footer-line" />
          </div>
          <div className="footer-info">
            <p className="footer-meta">© {new Date().getFullYear()} junhyo park</p>
            <p className="footer-contact">jhjhpark0800@gmail.com</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PillIcon({ type }: { type: 'rocket' | 'chart' | 'spark' }) {
  if (type === 'rocket') return <MiniIcon path="M12 2c2.7 1.6 4.6 4.2 5.2 7.3.3 1.8.3 3.7 0 5.5l2 2-3.5 1.1-1.1 3.5-2-2c-1.8.3-3.7.3-5.5 0C4.2 21.3 1.6 19.4 0 16.7c2.2.8 4.7.6 6.7-.6l3.1-1.9 1.9-3.1c1.2-2 1.4-4.5.6-6.7Z" />
  if (type === 'chart') return <MiniIcon path="M3 19h18v2H1V3h2v16Zm4-2V9h3v8H7Zm5 0V5h3v12h-3Zm5 0v-6h3v6h-3Z" />
  return <MiniIcon path="M12 2l1.5 6L20 10l-5 3.6L16.5 20 12 16.8 7.5 20 9 13.6 4 10l6.5-2L12 2Z" />
}

function MiniIcon({ path }: { path: string }) {
  return (
    <svg className="mini-icon" viewBox="0 0 24 24" aria-hidden>
      <path d={path} />
    </svg>
  )
}
