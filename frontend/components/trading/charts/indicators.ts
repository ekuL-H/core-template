import type { CandlestickData, LineData, UTCTimestamp } from 'lightweight-charts'

export interface IndicatorConfig {
  id: string
  type: 'ma'
  maType: 'SMA' | 'EMA'
  period: number
  color: string
}

export const INDICATOR_COLORS = ['#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#22c55e', '#06b6d4', '#ef4444', '#64748b']

export const DEFAULT_INDICATORS: IndicatorConfig[] = [
  { id: 'ind_1', type: 'ma', maType: 'EMA', period: 20, color: '#f59e0b' },
  { id: 'ind_2', type: 'ma', maType: 'SMA', period: 50, color: '#3b82f6' },
  { id: 'ind_3', type: 'ma', maType: 'SMA', period: 200, color: '#a855f7' },
]

let indicatorIdCounter = 100

export function generateIndicatorId() {
  indicatorIdCounter++
  return `ind_${indicatorIdCounter}`
}

export function calcSMA(candles: CandlestickData[], period: number): LineData[] {
  const result: LineData[] = []
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) {
      sum += (candles[j] as any).close
    }
    result.push({ time: candles[i].time as UTCTimestamp, value: sum / period })
  }
  return result
}

export function calcEMA(candles: CandlestickData[], period: number): LineData[] {
  if (candles.length < period) return []
  const result: LineData[] = []
  const multiplier = 2 / (period + 1)

  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += (candles[i] as any).close
  }
  let ema = sum / period
  result.push({ time: candles[period - 1].time as UTCTimestamp, value: ema })

  for (let i = period; i < candles.length; i++) {
    ema = ((candles[i] as any).close - ema) * multiplier + ema
    result.push({ time: candles[i].time as UTCTimestamp, value: ema })
  }
  return result
}

export function calcIndicator(candles: CandlestickData[], config: IndicatorConfig): LineData[] {
  if (config.type === 'ma') {
    return config.maType === 'EMA'
      ? calcEMA(candles, config.period)
      : calcSMA(candles, config.period)
  }
  return []
}

export function applyTimezoneToCandles(candles: CandlestickData[], offsetSeconds: number): CandlestickData[] {
  return candles.map((c) => ({
    ...c,
    time: ((c.time as number) + offsetSeconds) as UTCTimestamp,
  }))
}

export function applyTimezoneToLines(data: LineData[], offsetSeconds: number): LineData[] {
  return data.map((d) => ({
    ...d,
    time: ((d.time as number) + offsetSeconds) as UTCTimestamp,
  }))
}