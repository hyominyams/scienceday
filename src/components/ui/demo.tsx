import { CardStack3D } from '@/components/ui/3d-flip-card'

export function CardStackDemo() {
  const images = [
    {
      src: '/assets/home/water.jpg',
      alt: 'Water rocket launching over a field',
      title: '물로켓',
      description: '물의 비율과 압력을 바꿔 실험해보세요.',
      badge: '3D 시뮬레이터',
      actionLabel: '시작',
    },
    {
      src: '/assets/home/hang.jpg',
      alt: 'Hang glider soaring above mountains',
      title: '행글라이더',
      description: '바람과 각도를 조합해 활공 궤적을 확인해요.',
      badge: '업데이트 예정',
      actionLabel: '준비 중',
      status: 'coming' as const,
    },
    {
      src: '/assets/home/future.jpg',
      alt: 'Futuristic city skyline at night',
      title: '미래사회 디자인',
      description: '아이디어를 시각적으로 구성하는 창작 랩입니다.',
      badge: '업데이트 예정',
      actionLabel: '준비 중',
      status: 'coming' as const,
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center">
      <CardStack3D images={images} cardWidth={320} cardHeight={192} spacing={{ x: 50, y: 50 }} />
    </div>
  )
}
