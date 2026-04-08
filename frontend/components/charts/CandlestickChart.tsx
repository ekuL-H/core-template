'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, CandlestickData, LineData, UTCTimestamp } from 'lightweight-charts'
import { api } from '@/lib/api'
import { Clock, ChevronDown, Star } from 'lucide-react'

interface CandlestickChartProps {
  symbol: string
  color?: string
}

const ALL_TIMEFRAMES = [
  { key: '1min', label: '1m' },
  { key: '5min', label: '5m' },
  { key: '15min', label: '15m' },
  { key: '30min', label: '30m' },
  { key: '1h', label: '1H' },
  { key: '2h', label: '2H' },
  { key: '4h', label: '4H' },
  { key: '1day', label: 'D' },
  { key: '1week', label: 'W' },
  { key: '1month', label: 'M' },
]

const DEFAULT_FAVOURITES = ['30min', '4h', '1day']

const TIMEZONES = [
  { key: 'UTC', label: 'UTC+0' },
  { key: 'Europe/London', label: 'London (UTC+0/+1)' },
  { key: 'Europe/Paris', label: 'Paris (UTC+1/+2)' },
  { key: 'America/New_York', label: 'New York (UTC-5/-4)' },
  { key: 'America/Chicago', label: 'Chicago (UTC-6/-5)' },
  { key: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { key: 'Asia/Hong_Kong', label: 'Hong Kong (UTC+8)' },
  { key: 'Australia/Sydney', label: 'Sydney (UTC+10/+11)' },
]

function getTimezoneOffsetSeconds(tzKey: string): number {
  if (tzKey === 'UTC') return 0

  const now = new Date()
  const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' })
  const tzStr = now.toLocaleString('en-US', { timeZone: tzKey })
  return Math.round((new Date(tzStr).getTime() - new Date(utcStr).getTime()) / 1000)
}

function applyTimezoneToCandles(candles: CandlestickData[], offsetSeconds: number): CandlestickData[] {
  return candles.map((c) => ({
    ...c,
    time: ((c.time as number) + offsetSeconds) as UTCTimestamp,
  }))
}

function applyTimezoneToLines(data: LineData[], offsetSeconds: number): LineData[] {
  return data.map((d) => ({
    ...d,
    time: ((d.time as number) + offsetSeconds) as UTCTimestamp,
  }))
}

function calcSMA(candles: CandlestickData[], period: number): LineData[] {
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

function calcEMA(candles: CandlestickData[], period: number): LineData[] {
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

export default function CandlestickChart({ symbol, color = '#6366f1' }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const sma200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const chartReady = useRef(false)
  const rawCandlesRef = useRef<CandlestickData[]>([])

  const [activeTimeframe, setActiveTimeframe] = useState('30min')
  const [favourites, setFavourites] = useState<string[]>(DEFAULT_FAVOURITES)
  const [showTfDropdown, setShowTfDropdown] = useState(false)
  const [timezone, setTimezone] = useState('Europe/London')
  const [showTzDropdown, setShowTzDropdown] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Update clock every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const formatted = now.toLocaleString('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
      })
      setCurrentTime(formatted)
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [timezone])

  const toggleFavourite = (key: string) => {
    setFavourites((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    )
  }

  const updateChartData = useCallback((candles: CandlestickData[], tz: string) => {
    if (!candleSeriesRef.current) return

    const offset = getTimezoneOffsetSeconds(tz)
    const adjusted = applyTimezoneToCandles(candles, offset)

    console.log('TZ:', tz, 'Offset:', offset, 'Raw last:', candles[candles.length-1]?.time, 'Adjusted last:', adjusted[adjusted.length-1]?.time)
    candleSeriesRef.current.setData(adjusted)
    candleSeriesRef.current.setData(adjusted)
    ema20SeriesRef.current?.setData(applyTimezoneToLines(calcEMA(candles, 20), offset))
    sma50SeriesRef.current?.setData(applyTimezoneToLines(calcSMA(candles, 50), offset))
    sma200SeriesRef.current?.setData(applyTimezoneToLines(calcSMA(candles, 200), offset))

    chartRef.current?.timeScale().fitContent()
  }, [])

  // Re-apply timezone when it changes
  useEffect(() => {
    if (rawCandlesRef.current.length > 0 && chartReady.current) {
      updateChartData(rawCandlesRef.current, timezone)
    }
  }, [timezone, updateChartData])

  const fetchCandles = useCallback(async (sym: string, tf: string) => {
    if (!chartReady.current || !sym) return

    try {
      setError(null)
      setLoading(true)

      const data = await api.getCandles(sym, tf, 300)

      if (!data.candles || data.candles.length === 0) {
        setError('No data available')
        return
      }

      if (!candleSeriesRef.current) return

      const candles = data.candles as CandlestickData[]
      rawCandlesRef.current = candles

      chartRef.current?.priceScale('right').applyOptions({ autoScale: true })

      updateChartData(candles, timezone)
    } catch (err) {
      console.error('Failed to fetch candles:', err)
      if (chartReady.current) {
        setError('Failed to load chart data')
      }
    } finally {
      if (chartReady.current) {
        setLoading(false)
      }
    }
  }, [timezone, updateChartData])

  // Create chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(255,255,255,0.1)', width: 1, style: 3 },
        horzLine: { color: 'rgba(255,255,255,0.1)', width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    const ema20Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 1,
      title: 'EMA 20',
    })

    const sma50Series = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 1,
      title: 'SMA 50',
    })

    const sma200Series = chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 1,
      title: 'SMA 200',
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    ema20SeriesRef.current = ema20Series
    sma50SeriesRef.current = sma50Series
    sma200SeriesRef.current = sma200Series
    chartReady.current = true

    fetchCandles(symbol, activeTimeframe)

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(chartContainerRef.current)

    return () => {
      chartReady.current = false
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      ema20SeriesRef.current = null
      sma50SeriesRef.current = null
      sma200SeriesRef.current = null
    }
  }, [])

  // Fetch when symbol or timeframe changes
  const prevSymbol = useRef(symbol)
  const prevTimeframe = useRef(activeTimeframe)

  useEffect(() => {
    if (!chartReady.current) return
    if (symbol === prevSymbol.current && activeTimeframe === prevTimeframe.current) return

    prevSymbol.current = symbol
    prevTimeframe.current = activeTimeframe
    fetchCandles(symbol, activeTimeframe)
  }, [symbol, activeTimeframe, fetchCandles])

  // Auto-refresh
  useEffect(() => {
    if (!chartReady.current) return

    const intervalMs: Record<string, number> = {
      '1min': 10000,
      '5min': 15000,
      '15min': 20000,
      '30min': 30000,
      '1h': 60000,
      '2h': 60000,
      '4h': 60000,
      '1day': 300000,
      '1week': 300000,
      '1month': 300000,
    }
    const pollInterval = intervalMs[activeTimeframe] || 30000

    const timer = setInterval(() => fetchCandles(symbol, activeTimeframe), pollInterval)
    return () => clearInterval(timer)
  }, [symbol, activeTimeframe, fetchCandles])

  const favouriteTimeframes = ALL_TIMEFRAMES.filter((tf) => favourites.includes(tf.key))

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-black/5 dark:border-white/5 flex-shrink-0">
        {/* Left: timeframes */}
        <div className="flex items-center gap-1">
          {favouriteTimeframes.map((tf) => (
            <button
              key={tf.key}
              onClick={() => {
                setActiveTimeframe(tf.key)
              }}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                activeTimeframe === tf.key
                  ? 'text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
              style={activeTimeframe === tf.key ? { backgroundColor: color } : {}}
            >
              {tf.label}
            </button>
          ))}

          {/* Timeframe dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowTfDropdown((prev) => !prev)
                setShowTzDropdown(false)
              }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 rounded hover:bg-black/5 dark:hover:bg-white/5"
            >
              <ChevronDown className="w-3 h-3" />
            </button>

            {showTfDropdown && (
              <div
                className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-md shadow-lg py-1 min-w-[160px]"
                onClick={(e) => e.stopPropagation()}
              >
                {ALL_TIMEFRAMES.map((tf) => (
                  <div
                    key={tf.key}
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <button
                      onClick={() => {
                        setActiveTimeframe(tf.key)
                        setShowTfDropdown(false)
                      }}
                      className="text-[11px] flex-1 text-left"
                      style={activeTimeframe === tf.key ? { color: color } : { color: undefined }}
                    >
                      <span className={activeTimeframe === tf.key ? 'font-medium' : 'text-zinc-700 dark:text-zinc-300'}>
                        {tf.label}
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavourite(tf.key)
                      }}
                      className="p-0.5"
                    >
                      <Star
                        className="w-3 h-3"
                        fill={favourites.includes(tf.key) ? '#f59e0b' : 'none'}
                        stroke={favourites.includes(tf.key) ? '#f59e0b' : '#9ca3af'}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: clock + timezone */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            <Clock className="w-3 h-3" />
            <span>{currentTime}</span>
          </div>

          {/* Timezone dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowTzDropdown((prev) => !prev)
                setShowTfDropdown(false)
              }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 rounded hover:bg-black/5 dark:hover:bg-white/5"
            >
              {TIMEZONES.find((t) => t.key === timezone)?.label.split('(')[1]?.replace(')', '') || 'UTC'}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showTzDropdown && (
              <div
                className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-md shadow-lg py-1 min-w-[220px]"
                onClick={(e) => e.stopPropagation()}
              >
                {TIMEZONES.map((tz) => (
                  <button
                    key={tz.key}
                    onClick={() => {
                      setTimezone(tz.key)
                      setShowTzDropdown(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-black/5 dark:hover:bg-white/5"
                    style={timezone === tz.key ? { color: color } : {}}
                  >
                    <span className={timezone === tz.key ? 'font-medium' : 'text-zinc-700 dark:text-zinc-300'}>
                      {tz.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 relative min-h-0">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-[10px] text-zinc-400">Loading...</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-[10px] text-red-400">{error}</span>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  )
}