'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, CandlestickData, UTCTimestamp } from 'lightweight-charts'
import { tradingApi as api } from '@/lib/api/trading'
import { Clock, ChevronDown, Star, BarChart3 } from 'lucide-react'
import { getTimezoneOffsetSeconds, TIMEZONES } from './timezone'
import {
  IndicatorConfig,
  INDICATOR_COLORS,
  DEFAULT_INDICATORS,
  generateIndicatorId,
  calcIndicator,
  applyTimezoneToCandles,
  applyTimezoneToLines,
} from './indicators'
import IndicatorModal from './IndicatorModal'
import ChartToolbar from './ChartToolbar'

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

export default function CandlestickChart({ symbol, color = '#6366f1' }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())
  const chartReady = useRef(false)
  const rawCandlesRef = useRef<CandlestickData[]>([])
  const isInitialLoad = useRef(true)

  const [activeTimeframe, setActiveTimeframe] = useState('30min')
  const [favourites, setFavourites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_FAVOURITES
    const saved = localStorage.getItem('chart_tf_favourites')
    return saved ? JSON.parse(saved) : DEFAULT_FAVOURITES
  })
  const [showTfDropdown, setShowTfDropdown] = useState(false)
  const [timezone, setTimezone] = useState('Europe/London')
  const [showTzDropdown, setShowTzDropdown] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [indicators, setIndicators] = useState<IndicatorConfig[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_INDICATORS
    const saved = localStorage.getItem('chart_indicators')
    return saved ? JSON.parse(saved) : DEFAULT_INDICATORS
  })
  const [showIndicatorModal, setShowIndicatorModal] = useState(false)
  const [editingIndicatorId, setEditingIndicatorId] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem('chart_indicators', JSON.stringify(indicators))
  }, [indicators])

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
    setFavourites((prev) => {
      const next = prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
      localStorage.setItem('chart_tf_favourites', JSON.stringify(next))
      return next
    })
  }

  // Sync indicator series with chart
  const syncIndicatorSeries = useCallback(() => {
    if (!chartRef.current || !chartReady.current) return

    const chart = chartRef.current
    const currentMap = indicatorSeriesRef.current

    const activeIds = new Set(indicators.map((i) => i.id))
    currentMap.forEach((series, id) => {
      if (!activeIds.has(id)) {
        chart.removeSeries(series)
        currentMap.delete(id)
      }
    })

    indicators.forEach((ind) => {
      const existing = currentMap.get(ind.id)
      if (existing) {
        existing.applyOptions({
          color: ind.color,
          title: `${ind.maType} ${ind.period}`,
        })
      } else {
        const series = chart.addSeries(LineSeries, {
          color: ind.color,
          lineWidth: 1,
          title: `${ind.maType} ${ind.period}`,
        })
        currentMap.set(ind.id, series)
      }
    })

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

  useEffect(() => {
    syncIndicatorSeries()
  }, [syncIndicatorSeries])

  const updateChartData = useCallback((candles: CandlestickData[], tz: string) => {
    if (!candleSeriesRef.current) return

    const offset = getTimezoneOffsetSeconds(tz)
    const adjusted = applyTimezoneToCandles(candles, offset)

    candleSeriesRef.current.setData(adjusted)

    indicatorSeriesRef.current.forEach((series, id) => {
      const config = indicators.find((i) => i.id === id)
      if (config) {
        const data = calcIndicator(candles, config)
        series.setData(applyTimezoneToLines(data, offset))
      }
    })

    if (isInitialLoad.current) {
      chartRef.current?.timeScale().fitContent()
      isInitialLoad.current = false
    }
  }, [indicators])

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

      let data
      try {
        data = await api.getMT5Candles(sym, tf, 500)
      } catch {
        data = await api.getCandles(sym, tf, 300)
      }

      if (!data.candles || data.candles.length === 0) {
        setError('No data available')
        return
      }

      if (!candleSeriesRef.current) return

      const candles = data.candles as CandlestickData[]
      rawCandlesRef.current = candles

      chartRef.current?.priceScale('right').applyOptions({ autoScale: true })

      const samplePrice = (candles[0] as any).close
      let minMove = 0.00001
      let precision = 5
      if (samplePrice > 1000) { precision = 2; minMove = 0.01 }
      else if (samplePrice > 100) { precision = 3; minMove = 0.001 }
      else if (samplePrice > 10) { precision = 4; minMove = 0.0001 }

      candleSeriesRef.current?.applyOptions({
        priceFormat: {
          type: 'price',
          precision: precision,
          minMove: minMove,
        }
      })

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
    isInitialLoad.current = true
    fetchCandles(symbol, activeTimeframe)
  }, [symbol, activeTimeframe, fetchCandles])

  // Live update: update current candle from MT5 bid price every 2 seconds
  const liveSymbolRef = useRef(symbol)
  liveSymbolRef.current = symbol
  const liveTimezoneRef = useRef(timezone)
  liveTimezoneRef.current = timezone

  useEffect(() => {
    if (!chartReady.current || !candleSeriesRef.current) return

    const timer = setInterval(async () => {
      try {
        if (!candleSeriesRef.current || rawCandlesRef.current.length === 0) return

        const data = await api.getBridgePrices()
        if (!data.prices || data.prices.length === 0) return

        const brokerSymbol = liveSymbolRef.current.replace('/', '')
        const price = data.prices.find((p: any) =>
          p.symbol.toUpperCase() === brokerSymbol.toUpperCase()
        )

        if (!price) return

        const candles = rawCandlesRef.current
        const lastCandle = candles[candles.length - 1]
        const offset = getTimezoneOffsetSeconds(liveTimezoneRef.current)
        const bid = price.bid

        const updatedRaw = {
          time: lastCandle.time,
          open: (lastCandle as any).open,
          high: Math.max((lastCandle as any).high, bid),
          low: Math.min((lastCandle as any).low, bid),
          close: bid,
        } as CandlestickData

        rawCandlesRef.current[candles.length - 1] = updatedRaw

        candleSeriesRef.current.update({
          time: ((updatedRaw.time as number) + offset) as UTCTimestamp,
          open: (updatedRaw as any).open,
          high: (updatedRaw as any).high,
          low: (updatedRaw as any).low,
          close: (updatedRaw as any).close,
        })
      } catch (err) {
        // Silent fail
      }
    }, 2000)

    return () => clearInterval(timer)
  }, [])

  // New bar detection
  useEffect(() => {
    if (!chartReady.current) return

    const intervalMs: Record<string, number> = {
      '1min': 5000,
      '5min': 10000,
      '15min': 15000,
      '30min': 20000,
      '1h': 30000,
      '2h': 30000,
      '4h': 60000,
      '1day': 300000,
      '1week': 300000,
      '1month': 300000,
    }
    const pollInterval = intervalMs[activeTimeframe] || 20000

    const timer = setInterval(async () => {
      if (!chartReady.current || !candleSeriesRef.current) return

      try {
        let data
        try {
          data = await api.getMT5CandlesFresh(symbol, activeTimeframe, 5)
        } catch {
          return
        }

        if (!data.candles || data.candles.length === 0) return

        const newCandles = data.candles as CandlestickData[]
        const existing = rawCandlesRef.current

        if (existing.length === 0) return

        const lastExistingTime = existing[existing.length - 1].time as number
        const newestFetchedTime = newCandles[newCandles.length - 1].time as number

        if (newestFetchedTime <= lastExistingTime) return

        let merged = [...existing]

        newCandles.forEach((nc) => {
          const idx = merged.findIndex((c) => (c.time as number) === (nc.time as number))
          if (idx >= 0) {
            merged[idx] = nc
          } else if ((nc.time as number) > lastExistingTime) {
            merged.push(nc)
          }
        })

        if (merged.length > 500) {
          merged = merged.slice(merged.length - 500)
        }

        rawCandlesRef.current = merged
        updateChartData(merged, timezone)
      } catch (err) {
        // Silent fail
      }
    }, pollInterval)

    return () => clearInterval(timer)
  }, [symbol, activeTimeframe, timezone, updateChartData])

  // Indicator management
  const addIndicator = () => {
    const nextColor = INDICATOR_COLORS[indicators.length % INDICATOR_COLORS.length]
    const newInd: IndicatorConfig = {
      id: generateIndicatorId(),
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
      <ChartToolbar
        color={color}
        activeTimeframe={activeTimeframe}
        favouriteTimeframes={favouriteTimeframes}
        allTimeframes={ALL_TIMEFRAMES}
        favourites={favourites}
        showTfDropdown={showTfDropdown}
        timezone={timezone}
        showTzDropdown={showTzDropdown}
        currentTime={currentTime}
        indicatorCount={indicators.length}
        onTimeframeChange={(key) => {
          setActiveTimeframe(key)
          setShowTfDropdown(false)
        }}
        onToggleTfDropdown={() => {
          setShowTfDropdown((prev) => !prev)
          setShowTzDropdown(false)
        }}
        onToggleFavourite={toggleFavourite}
        onResetView={() => chartRef.current?.timeScale().fitContent()}
        onOpenIndicators={() => setShowIndicatorModal(true)}
        onTimezoneChange={(key) => {
          setTimezone(key)
          setShowTzDropdown(false)
        }}
        onToggleTzDropdown={() => {
          setShowTzDropdown((prev) => !prev)
          setShowTfDropdown(false)
        }}
      />

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

      {showIndicatorModal && (
        <IndicatorModal
          indicators={indicators}
          editingId={editingIndicatorId}
          color={color}
          onClose={() => {
            setShowIndicatorModal(false)
            setEditingIndicatorId(null)
          }}
          onAdd={addIndicator}
          onRemove={removeIndicator}
          onUpdate={updateIndicator}
          onEditToggle={setEditingIndicatorId}
        />
      )}
    </div>
  )
}