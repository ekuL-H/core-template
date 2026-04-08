'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts'
import { api } from '@/lib/api'

interface CandlestickChartProps {
  symbol: string
  color?: string
}

const TIMEFRAMES = [
  { key: '30min', label: '30m' },
  { key: '4h', label: '4H' },
  { key: '1day', label: 'D' },
]

function calcSMA(candles: CandlestickData[], period: number): LineData[] {
  const result: LineData[] = []
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) {
      sum += (candles[j] as any).close
    }
    result.push({ time: candles[i].time, value: sum / period })
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
  result.push({ time: candles[period - 1].time, value: ema })

  for (let i = period; i < candles.length; i++) {
    ema = ((candles[i] as any).close - ema) * multiplier + ema
    result.push({ time: candles[i].time, value: ema })
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

  const [activeTimeframe, setActiveTimeframe] = useState('30min')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCandles = useCallback(async (sym: string, tf: string) => {
    // Don't fetch if chart isn't ready or symbol is empty
    if (!chartReady.current || !sym) return

    try {
      setError(null)
      setLoading(true)

      const data = await api.getCandles(sym, tf, 300)

      if (!data.candles || data.candles.length === 0) {
        setError('No data available')
        return
      }

      // Double check refs are still valid (component might have unmounted)
      if (!candleSeriesRef.current) return

      const candles = data.candles as CandlestickData[]

      candleSeriesRef.current.setData(candles)
      ema20SeriesRef.current?.setData(calcEMA(candles, 20))
      sma50SeriesRef.current?.setData(calcSMA(candles, 50))
      sma200SeriesRef.current?.setData(calcSMA(candles, 200))

      chartRef.current?.timeScale().fitContent()
    } catch (err) {
      console.error('Failed to fetch candles:', err)
      // Only set error if component is still mounted
      if (chartReady.current) {
        setError('Failed to load chart data')
      }
    } finally {
      if (chartReady.current) {
        setLoading(false)
      }
    }
  }, [])

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

    // Fetch initial data now that chart is ready
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

  // Fetch when symbol or timeframe changes (but not on first mount — that's handled above)
  const prevSymbol = useRef(symbol)
  const prevTimeframe = useRef(activeTimeframe)

  useEffect(() => {
    if (!chartReady.current) return
    if (symbol === prevSymbol.current && activeTimeframe === prevTimeframe.current) return

    prevSymbol.current = symbol
    prevTimeframe.current = activeTimeframe
    fetchCandles(symbol, activeTimeframe)
  }, [symbol, activeTimeframe, fetchCandles])

  // Auto-refresh on candle close
  useEffect(() => {
    if (!chartReady.current) return

    const intervalMs: Record<string, number> = {
      '30min': 30000,
      '4h': 60000,
      '1day': 300000,
    }
    const pollInterval = intervalMs[activeTimeframe] || 30000

    const timer = setInterval(() => fetchCandles(symbol, activeTimeframe), pollInterval)
    return () => clearInterval(timer)
  }, [symbol, activeTimeframe, fetchCandles])

  return (
    <div className="flex flex-col h-full">
      {/* Timeframe selector */}
      <div className="flex items-center gap-1 px-3 py-1 border-b border-black/5 dark:border-white/5">
        {TIMEFRAMES.map((tf) => (
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
      </div>

      {/* Chart area */}
      <div className="flex-1 relative">
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