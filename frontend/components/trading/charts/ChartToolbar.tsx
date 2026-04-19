'use client'

import { Clock, ChevronDown, Star, BarChart3 } from 'lucide-react'
import { TIMEZONES } from './timezone'

interface Timeframe {
  key: string
  label: string
}

interface ChartToolbarProps {
  color: string
  activeTimeframe: string
  favouriteTimeframes: Timeframe[]
  allTimeframes: Timeframe[]
  favourites: string[]
  showTfDropdown: boolean
  timezone: string
  showTzDropdown: boolean
  currentTime: string
  indicatorCount: number
  onTimeframeChange: (key: string) => void
  onToggleTfDropdown: () => void
  onToggleFavourite: (key: string) => void
  onResetView: () => void
  onOpenIndicators: () => void
  onTimezoneChange: (key: string) => void
  onToggleTzDropdown: () => void
}

export default function ChartToolbar({
  color,
  activeTimeframe,
  favouriteTimeframes,
  allTimeframes,
  favourites,
  showTfDropdown,
  timezone,
  showTzDropdown,
  currentTime,
  indicatorCount,
  onTimeframeChange,
  onToggleTfDropdown,
  onToggleFavourite,
  onResetView,
  onOpenIndicators,
  onTimezoneChange,
  onToggleTzDropdown,
}: ChartToolbarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1 border-b border-black/5 dark:border-white/5 flex-shrink-0">
      <div className="flex items-center gap-1">
        {favouriteTimeframes.map((tf) => (
          <button
            key={tf.key}
            onClick={() => onTimeframeChange(tf.key)}
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
              onToggleTfDropdown()
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
              {allTimeframes.map((tf) => (
                <div
                  key={tf.key}
                  className="flex items-center justify-between px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  <button
                    onClick={() => onTimeframeChange(tf.key)}
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
                      onToggleFavourite(tf.key)
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

        {/* Reset view */}
        <button
          onClick={onResetView}
          className="px-1.5 py-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 rounded hover:bg-black/5 dark:hover:bg-white/5"
          title="Reset view"
        >
          ⟲
        </button>

        <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />

        {/* Indicators button */}
        <button
          onClick={onOpenIndicators}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 rounded hover:bg-black/5 dark:hover:bg-white/5"
        >
          <BarChart3 className="w-3 h-3" />
          <span>Indicators</span>
          {indicatorCount > 0 && (
            <span
              className="text-[9px] px-1 rounded-full text-white"
              style={{ backgroundColor: color }}
            >
              {indicatorCount}
            </span>
          )}
        </button>
      </div>

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
              onToggleTzDropdown()
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
                  onClick={() => onTimezoneChange(tz.key)}
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
  )
}