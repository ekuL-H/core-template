// Helper: convert interval string to milliseconds
export function getIntervalMs(interval: string): number {
  const map: Record<string, number> = {
    '1min': 60000,
    '5min': 300000,
    '15min': 900000,
    '30min': 1800000,
    '1h': 3600000,
    '4h': 14400000,
    '1day': 86400000,
    '1week': 604800000
  }
  return map[interval] || 1800000
}

// Helper: format DB candle for response
export function formatCandle(c: any) {
  return {
    time: Math.floor(c.timestamp.getTime() / 1000),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume ?? undefined
  }
}

// Map interval format: frontend sends '30min', '4h', '1day' — MT5 EA expects '30', '240', 'D'
export const MT5_INTERVAL_MAP: Record<string, string> = {
  '1min': '1',
  '5min': '5',
  '15min': '15',
  '30min': '30',
  '1h': '60',
  '2h': '120',
  '4h': '240',
  '1day': 'D',
  '1week': 'W',
  '1month': 'M',
}