'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, CandlestickData, LineData, UTCTimestamp } from 'lightweight-charts'
import { api } from '@/lib/api'
import { Clock, ChevronDown, Star, BarChart3, X, Pencil, Plus, Check } from 'lucide-react'

interface CandlestickChartProps {
  symbol: string
  color?: string
}

// --- Indicator types ---
interface IndicatorConfig {
  id: string
  type: 'ma'
  maType: 'SMA' | 'EMA'
  period: number
  color: string
}

const INDICATOR_COLORS = ['#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#22c55e', '#06b6d4', '#ef4444', '#64748b']

const DEFAULT_INDICATORS: IndicatorConfig[] = [
  { id: 'ind_1', type: 'ma', maType: 'EMA', period: 20, color: '#f59e0b' },
  { id: 'ind_2', type: 'ma', maType: 'SMA', period: 50, color: '#3b82f6' },
  { id: 'ind_3', type: 'ma', maType: 'SMA', period: 200, color: '#a855f7' },
]

let indicatorIdCounter = 100

function generateId() {
  indicatorIdCounter++
  return `ind_${indicatorIdCounter}`
}

// --- Timeframes ---
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

// --- Timezones ---
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

// --- Calculation functions ---
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

function calcIndicator(candles: CandlestickData[], config: IndicatorConfig): LineData[] {
  if (config.type === 'ma') {
    return config.maType === 'EMA'
      ? calcEMA(candles, config.period)
      : calcSMA(candles, config.period)
  }
  return []
}

// --- Component ---
export default function CandlestickChart({ symbol, color = '#6366f1' }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())
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

  // Indicator state
  const [indicators, setIndicators] = useState<IndicatorConfig[]>(DEFAULT_INDICATORS)
  const [showIndicatorModal, setShowIndicatorModal] = useState(false)
  const [editingIndicatorId, setEditingIndicatorId] = useState<string | null>(null)

  // Clock
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

  // --- Sync indicator series with chart ---
  const syncIndicatorSeries = useCallback(() => {
    if (!chartRef.current || !chartReady.current) return

    const chart = chartRef.current
    const currentMap = indicatorSeriesRef.current

    // Remove series that no longer exist in indicators
    const activeIds = new Set(indicators.map((i) => i.id))
    currentMap.forEach((series, id) => {
      if (!activeIds.has(id)) {
        chart.removeSeries(series)
        currentMap.delete(id)
      }
    })

    // Add or update series for each indicator
    indicators.forEach((ind) => {
      const existing = currentMap.get(ind.id)
      if (existing) {
        // Update options
        existing.applyOptions({
          color: ind.color,
          title: `${ind.maType} ${ind.period}`,
        })
      } else {
        // Create new series
        const series = chart.addSeries(LineSeries, {
          color: ind.color,
          lineWidth: 1,
          title: `${ind.maType} ${ind.period}`,
        })
        currentMap.set(ind.id, series)
      }
    })

    // Update data if we have candles
    if (rawCandlesRef.current.length > 0) {
      const offset = getTimezoneOffsetSeconds(timezone)
      indicators.forEach((ind) => {
        const series = currentMap.get(ind.id)
        if (series) {
          const data = calcIndicator(rawCandlesRef.current, ind)
          series.setData(applyTimezoneToLines(data, offset))
        }
      })
    }
  }, [indicators, timezone])

  // When indicators change, sync series
  useEffect(() => {
    syncIndicatorSeries()
  }, [syncIndicatorSeries])

  const updateChartData = useCallback((candles: CandlestickData[], tz: string) => {
    if (!candleSeriesRef.current) return

    const offset = getTimezoneOffsetSeconds(tz)
    const adjusted = applyTimezoneToCandles(candles, offset)

    candleSeriesRef.current.setData(adjusted)

    // Update all indicator series
    indicatorSeriesRef.current.forEach((series, id) => {
      const config = indicators.find((i) => i.id === id)
      if (config) {
        const data = calcIndicator(candles, config)
        series.setData(applyTimezoneToLines(data, offset))
      }
    })

    chartRef.current?.timeScale().fitContent()
  }, [indicators])

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

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    indicatorSeriesRef.current = new Map()
    chartReady.current = true

    // Create initial indicator series
    indicators.forEach((ind) => {
      const series = chart.addSeries(LineSeries, {
        color: ind.color,
        lineWidth: 1,
        title: `${ind.maType} ${ind.period}`,
      })
      indicatorSeriesRef.current.set(ind.id, series)
    })

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
      indicatorSeriesRef.current = new Map()
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

  // --- Indicator management ---
  const addIndicator = () => {
    const nextColor = INDICATOR_COLORS[indicators.length % INDICATOR_COLORS.length]
    const newInd: IndicatorConfig = {
      id: generateId(),
      type: 'ma',
      maType: 'SMA',
      period: 20,
      color: nextColor,
    }
    setIndicators((prev) => [...prev, newInd])
    setEditingIndicatorId(newInd.id)
  }

  const removeIndicator = (id: string) => {
    setIndicators((prev) => prev.filter((i) => i.id !== id))
    if (editingIndicatorId === id) setEditingIndicatorId(null)
  }

  const updateIndicator = (id: string, updates: Partial<IndicatorConfig>) => {
    setIndicators((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    )
  }

  const favouriteTimeframes = ALL_TIMEFRAMES.filter((tf) => favourites.includes(tf.key))

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-black/5 dark:border-white/5 flex-shrink-0">
        {/* Left: timeframes + indicators button */}
        <div className="flex items-center gap-1">
          {favouriteTimeframes.map((tf) => (
            <button
              key={tf.key}
              onClick={() => setActiveTimeframe(tf.key)}
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

          {/* Divider */}
          <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />

          {/* Indicators button */}
          <button
            onClick={() => setShowIndicatorModal(true)}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 rounded hover:bg-black/5 dark:hover:bg-white/5"
          >
            <BarChart3 className="w-3 h-3" />
            <span>Indicators</span>
            {indicators.length > 0 && (
              <span
                className="text-[9px] px-1 rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                {indicators.length}
              </span>
            )}
          </button>
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

      {/* Indicator Modal */}
      {showIndicatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="bg-white dark:bg-zinc-900 rounded-lg border border-black/10 dark:border-white/10 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Indicators</h2>
              <button
                onClick={() => {
                  setShowIndicatorModal(false)
                  setEditingIndicatorId(null)
                }}
                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            {/* Active indicators list */}
            <div className="px-4 py-3 max-h-[300px] overflow-y-auto">
              {indicators.length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4">
                  No indicators added
                </p>
              )}

              {indicators.map((ind) => (
                <div key={ind.id} className="mb-2">
                  {/* Indicator row */}
                  <div className="flex items-center justify-between py-2 px-3 rounded-md bg-black/5 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ind.color }} />
                      <span className="text-xs font-medium text-zinc-900 dark:text-white">
                        {ind.maType} {ind.period}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setEditingIndicatorId(editingIndicatorId === ind.id ? null : ind.id)
                        }
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                      >
                        {editingIndicatorId === ind.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Pencil className="w-3 h-3 text-zinc-500" />
                        )}
                      </button>
                      <button
                        onClick={() => removeIndicator(ind.id)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Edit panel */}
                  {editingIndicatorId === ind.id && (
                    <div className="mt-1 px-3 py-3 rounded-md border border-black/10 dark:border-white/10">
                      {/* MA Type */}
                      <div className="mb-3">
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">Type</p>
                        <div className="flex gap-1">
                          {(['SMA', 'EMA'] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => updateIndicator(ind.id, { maType: t })}
                              className={`px-3 py-1 text-[11px] rounded-md transition-colors ${
                                ind.maType === t
                                  ? 'text-white'
                                  : 'text-zinc-600 dark:text-zinc-400 border border-black/10 dark:border-white/10'
                              }`}
                              style={ind.maType === t ? { backgroundColor: color } : {}}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Period */}
                      <div className="mb-3">
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">Period</p>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={ind.period}
                          onChange={(e) =>
                            updateIndicator(ind.id, { period: Math.max(1, parseInt(e.target.value) || 1) })
                          }
                          className="w-20 px-2 py-1 text-xs rounded-md border border-black/10 dark:border-white/10 bg-transparent text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>

                      {/* Colour */}
                      <div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">Colour</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {INDICATOR_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => updateIndicator(ind.id, { color: c })}
                              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                              style={{
                                backgroundColor: c,
                                borderColor: ind.color === c ? 'white' : 'transparent',
                                boxShadow: ind.color === c ? `0 0 0 2px ${c}` : 'none',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add button */}
            <div className="px-4 py-3 border-t border-black/10 dark:border-white/10">
              <button
                onClick={addIndicator}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Moving Average
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}