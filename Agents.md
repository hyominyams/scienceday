# Science Day Lab - Build Guide

## Product Intent
- Desktop-first, web-based 3D 체험관 for Science Day visitors (students, teachers, 가족 단위) to try 여러 체험 in one 화면 without coding.
- Typography and layout should feel like a Science Day 포스터: 대담한 타이틀, 명확한 연도/행사 정보, 카드형 체험 섹션.
- Favor clarity/playfulness over strict physics; adjust drag/coefficients if visuals feel wrong.

## Core Experiences (v1)
- Water Rocket: 실시간 3D 발사/궤적 + 텔레메트리.
- Ridge/Hang Glider: 바람·각도에 따른 비행 궤적을 보여주는 코스(초기 MVP는 소개/티저 카드만으로 충분).
- 미래도시/창작 존: 사용자가 과학의 날 콘셉트로 가상의 전시장, 구조물을 둘러보는 프리뷰(티저 카드).
- 홈 화면: 과학의 날 타이포 히어로, 체험 선택 카드 스택(다음/이전 탐색), 카드/버튼 클릭 시 해당 체험 페이지로 이동.

## Water Rocket Model (simplified)
- Point-mass 2D 비행, 발사 각도는 고정.
- 힘: 물 분사 추력, 중력, 이차항 항력(Cd 고정 가능). 스핀/자세 불안정 무시.
- 추력: 노즐 면적 A = pi*(d/2)^2, 방전 계수≈0.9, 공기 압력은 단열 팽창(gamma≈1.4). 배출 속도≈sqrt(2*ΔP/ρ_water); 추력≈mass_flow*ve + ΔP*A.
- 질량 변화: 건조 질량 + 물 질량(비율 * 병 부피 * ρ_water). 물이 소진되거나 압력이 대기압 이하이면 추력 0, 이후 활공.
- 항력: Fd = 0.5 * ρ_air * Cd * A_ref * v^2, Cd는 “그럴듯하게 보이는” 값으로 조정.
- 지면: y>=0 클램프, 착지 시 시뮬레이션 정지.

## Controls & Inputs
- 공통: 시작(Launch), 일시정지/재개, 리셋.
- Water Rocket 슬라이더(기본값/범위): 물 비율 35%(5–80%), 게이지 압력 6bar(1–10), 발사 각도 60°(15–85). v1에서는 나머지 상수 고정.

## Telemetry & Visuals
- 실시간 표시: 고도, 수평거리, 속도, 내부 압력(kPa, 절대), 추력(N), 남은 물(g).
- 궤적 라인, 발사대/그리드/카메라 궤도 포함. 데스크톱 기준 ~60FPS 목표.

## UX Principles
- One-screen: 체험 카드, 주요 버튼, 실시간 수치가 항상 보이도록.
- Immediate feedback: 슬라이더 변경 즉시 시뮬레이션과 숫자 반응.
- 실패도 학습: 낮게 뜨면 이유(압력/물 비율/각도)를 그대로 보여준다.
- 과학의 날 톤앤매너: 연도/행사 레이블, 짧은 카피, 대담한 타이포 대비.

## Non-Goals (v1)
- CFD, 스핀/자세 모델링, 저장/공유, 멀티유저.
- 모바일 정교화는 후순위(데스크톱 안정 60FPS 우선).

## Success Criteria (MVP)
- 물 30–40%가 가장 높이 난다; 압력이 높을수록 고도가 높다; 노즐 크기(고정 상수) 극단값은 성능 저하.
- 체험 카드가 직관적으로 다음/이전 이동되고, 클릭 시 해당 체험 페이지로 이동.
- 사용자가 “실제 실험 전에 이걸로 먼저 해보겠다”고 말할 만한 완성도.

## Implementation Notes
- 공통 상수는 한 곳에 노출해 튜닝하기 쉽게 유지.
- 컴포넌트/훅은 짧고 명확한 이름으로 분리.
- 장면 단순화: 실린더형 로켓+콘 노즐, 얇은 발사대/레일, 그리드, 궤적 라인.
