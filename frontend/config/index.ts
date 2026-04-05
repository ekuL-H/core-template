import { tradingConfig } from './modules/trading.config'
import { housingConfig } from './modules/housing.config'

const configs: Record<string, any> = {
  trading: tradingConfig,
  housing: housingConfig
}

const activeModule = process.env.NEXT_PUBLIC_MODULE || 'trading'

export const moduleConfig = configs[activeModule]