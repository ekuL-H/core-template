'use client'

import { X, Pencil, Check, Plus } from 'lucide-react'
import { IndicatorConfig, INDICATOR_COLORS } from './indicators'

interface IndicatorModalProps {
  indicators: IndicatorConfig[]
  editingId: string | null
  color: string
  onClose: () => void
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<IndicatorConfig>) => void
  onEditToggle: (id: string | null) => void
}

export default function IndicatorModal({
  indicators,
  editingId,
  color,
  onClose,
  onAdd,
  onRemove,
  onUpdate,
  onEditToggle,
}: IndicatorModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg border border-black/10 dark:border-white/10 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Indicators</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <div className="px-4 py-3 max-h-[300px] overflow-y-auto">
          {indicators.length === 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4">
              No indicators added
            </p>
          )}

          {indicators.map((ind) => (
            <div key={ind.id} className="mb-2">
              <div className="flex items-center justify-between py-2 px-3 rounded-md bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ind.color }} />
                  <span className="text-xs font-medium text-zinc-900 dark:text-white">
                    {ind.maType} {ind.period}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditToggle(editingId === ind.id ? null : ind.id)}
                    className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                  >
                    {editingId === ind.id ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Pencil className="w-3 h-3 text-zinc-500" />
                    )}
                  </button>
                  <button
                    onClick={() => onRemove(ind.id)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>

              {editingId === ind.id && (
                <div className="mt-1 px-3 py-3 rounded-md border border-black/10 dark:border-white/10">
                  <div className="mb-3">
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">Type</p>
                    <div className="flex gap-1">
                      {(['SMA', 'EMA'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => onUpdate(ind.id, { maType: t })}
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

                  <div className="mb-3">
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">Period</p>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={ind.period}
                      onChange={(e) =>
                        onUpdate(ind.id, { period: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-20 px-2 py-1 text-xs rounded-md border border-black/10 dark:border-white/10 bg-transparent text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">Colour</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {INDICATOR_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => onUpdate(ind.id, { color: c })}
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

        <div className="px-4 py-3 border-t border-black/10 dark:border-white/10">
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Moving Average
          </button>
        </div>
      </div>
    </div>
  )
}