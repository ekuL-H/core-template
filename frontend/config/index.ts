import { tradingConfig } from './modules/trading.config'
import { housingConfig } from './modules/housing.config'

const configs: Record<string, any> = {
  trading: tradingConfig,
  housing: housingConfig
}

function getActiveModule(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_MODULE || 'trading'
  try {
    const ws = localStorage.getItem('activeWorkspace')
    if (ws) {
      const parsed = JSON.parse(ws)
      if (parsed.type && configs[parsed.type]) return parsed.type
    }
  } catch {}
  return process.env.NEXT_PUBLIC_MODULE || 'trading'
}

// Re-export as getter so it reads fresh each time
export const getModuleConfig = () => configs[getActiveModule()] || tradingConfig

// For backward compatibility — components that import moduleConfig directly
// This works on initial load but won't update dynamically without a refresh
export const moduleConfig = typeof window !== 'undefined' 
  ? configs[getActiveModule()] || tradingConfig 
  : tradingConfig