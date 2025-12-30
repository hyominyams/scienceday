import { useMemo, useState } from 'react'
import type { SimConfig } from './simulation'
import { defaultConfig, useWaterRocketSim } from './simulation'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { MainPage } from './pages/MainPage'
import { WaterRocketSetupPage } from './pages/WaterRocketSetupPage'
import { WaterRocketSimPage } from './pages/WaterRocketSimPage'

type Route =
  | { name: 'home' }
  | { name: 'water-setup' }
  | { name: 'water-sim' }
  | { name: 'coming-soon'; feature: 'hang' | 'future' }

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [config, setConfig] = useState<SimConfig>(defaultConfig)
  const [cameraMode, setCameraMode] = useState<'follow' | 'fixed'>('follow')
  const sim = useWaterRocketSim(config)

  const title = useMemo(() => {
    switch (route.name) {
      case 'home':
        return 'Science Day'
      case 'water-setup':
        return 'Water Rocket - Setup'
      case 'water-sim':
        return 'Water Rocket - Simulation'
      case 'coming-soon':
        return route.feature === 'hang' ? 'Hang Glider - Coming Soon' : 'Future Society Design - Coming Soon'
      default:
        return 'Science Day'
    }
  }, [route])

  // keep document title simple
  if (typeof document !== 'undefined') document.title = title

  const onChangeConfig = (partial: Partial<SimConfig>) => setConfig((prev) => ({ ...prev, ...partial }))

  if (route.name === 'home') {
    return (
      <MainPage
        onSelectWaterRocket={() => setRoute({ name: 'water-setup' })}
        onSelectHangGlider={() => setRoute({ name: 'coming-soon', feature: 'hang' })}
        onSelectFutureDesign={() => setRoute({ name: 'coming-soon', feature: 'future' })}
      />
    )
  }

  if (route.name === 'coming-soon') {
    return (
      <ComingSoonPage
        feature={route.feature}
        onBack={() => setRoute({ name: 'home' })}
        onGoWaterRocket={() => setRoute({ name: 'water-setup' })}
      />
    )
  }

  if (route.name === 'water-setup') {
    return (
      <WaterRocketSetupPage
        config={config}
        onChange={onChangeConfig}
        onBackHome={() => setRoute({ name: 'home' })}
        onGoSim={() => setRoute({ name: 'water-sim' })}
      />
    )
  }

  return (
    <WaterRocketSimPage
      config={config}
      cameraMode={cameraMode}
      onToggleCamera={() => setCameraMode((m) => (m === 'follow' ? 'fixed' : 'follow'))}
      onForceCameraFollow={() => setCameraMode('follow')}
      sim={sim}
      onBackHome={() => setRoute({ name: 'home' })}
      onBackToSetup={() => setRoute({ name: 'water-setup' })}
      onApplyConfig={(next) => setConfig(next)}
    />
  )
}
