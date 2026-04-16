// MT5 broker server timezone (IC Markets uses EET - UTC+2/+3)
export const MT5_SERVER_TZ = 'Europe/Helsinki'

export function getTimezoneOffsetSeconds(tzKey: string): number {
  const now = new Date()
  const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' })

  const mt5Str = now.toLocaleString('en-US', { timeZone: MT5_SERVER_TZ })
  const mt5OffsetSeconds = Math.round((new Date(mt5Str).getTime() - new Date(utcStr).getTime()) / 1000)

  if (tzKey === 'UTC') {
    return -mt5OffsetSeconds
  }

  const tzStr = now.toLocaleString('en-US', { timeZone: tzKey })
  const desiredOffsetSeconds = Math.round((new Date(tzStr).getTime() - new Date(utcStr).getTime()) / 1000)

  return desiredOffsetSeconds - mt5OffsetSeconds
}

export const TIMEZONES = [
  { key: 'UTC', label: 'UTC+0' },
  { key: 'Europe/London', label: 'London (UTC+0/+1)' },
  { key: 'Europe/Paris', label: 'Paris (UTC+1/+2)' },
  { key: 'America/New_York', label: 'New York (UTC-5/-4)' },
  { key: 'America/Chicago', label: 'Chicago (UTC-6/-5)' },
  { key: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { key: 'Asia/Hong_Kong', label: 'Hong Kong (UTC+8)' },
  { key: 'Australia/Sydney', label: 'Sydney (UTC+10/+11)' },
]