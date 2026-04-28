'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { useTabs } from '@/lib/tabs'

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, addTab, closeTab, reorderTabs } = useTabs()

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const tabRefs = useRef<(HTMLDivElement | null)[]>([])
  const hoverIndexRef = useRef<number | null>(null)
  const dragIndexRef = useRef<number | null>(null)

  useEffect(() => { hoverIndexRef.current = hoverIndex }, [hoverIndex])
  useEffect(() => { dragIndexRef.current = dragIndex }, [dragIndex])

  const getTabWidths = useCallback(() => {
    return tabRefs.current.map(ref => ref?.offsetWidth || 0)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    if ((e.target as HTMLElement).closest('.tab-close')) return

    e.preventDefault()
    const startX = e.clientX
    setDragIndex(index)
    setDragOffset(0)
    setHoverIndex(index)

    const widths = getTabWidths()

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX
      setDragOffset(delta)

      let newIndex = index
      if (delta > 0) {
        let accumulated = 0
        for (let i = index + 1; i < widths.length; i++) {
          accumulated += widths[i]
          if (delta > accumulated - widths[i] / 2) newIndex = i
          else break
        }
      } else {
        let accumulated = 0
        for (let i = index - 1; i >= 0; i--) {
          accumulated -= widths[i]
          if (delta < accumulated + widths[i] / 2) newIndex = i
          else break
        }
      }
      setHoverIndex(newIndex)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      const finalHover = hoverIndexRef.current
      const finalDrag = dragIndexRef.current
      if (finalHover !== null && finalDrag !== null && finalHover !== finalDrag) {
        reorderTabs(finalDrag, finalHover)
      }

      setDragIndex(null)
      setDragOffset(0)
      setHoverIndex(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [getTabWidths, reorderTabs])

  const getTabStyle = (index: number): React.CSSProperties => {
    if (dragIndex === null) return {}

    if (index === dragIndex) {
      return { transform: `translateX(${dragOffset}px)`, zIndex: 50, opacity: 0.9, transition: 'none' }
    }

    if (hoverIndex !== null && hoverIndex !== dragIndex) {
      const dragWidth = tabRefs.current[dragIndex]?.offsetWidth || 0
      if (dragIndex < hoverIndex) {
        if (index > dragIndex && index <= hoverIndex) {
          return { transform: `translateX(-${dragWidth + 2}px)`, transition: 'transform 150ms ease' }
        }
      } else {
        if (index >= hoverIndex && index < dragIndex) {
          return { transform: `translateX(${dragWidth + 2}px)`, transition: 'transform 150ms ease' }
        }
      }
    }

    return { transition: 'transform 150ms ease' }
  }

  return (
    <div className="flex items-end gap-0.5 flex-1 min-w-0 overflow-x-auto no-scrollbar relative">
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          ref={el => { tabRefs.current[index] = el }}
          onMouseDown={(e) => handleMouseDown(e, index)}
          onClick={() => { if (dragIndex === null) setActiveTab(tab.id) }}
          style={getTabStyle(index)}
          className={`group flex items-center gap-1.5 px-3 py-1 text-[12px] max-w-[180px] min-w-[80px] rounded-t transition-colors relative select-none ${
            tab.id === activeTabId
              ? 'bg-background text-foreground border border-border border-b-background -mb-px z-10'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          } ${dragIndex === index ? 'cursor-grabbing shadow-lg' : 'cursor-pointer'}`}
        >
          <span className="truncate flex-1 text-left pointer-events-none">{tab.title}</span>
          {tabs.length > 1 && (
            <span
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
              className={`tab-close flex-shrink-0 p-0.5 rounded hover:bg-muted transition-colors ${
                tab.id === activeTabId ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-60 hover:opacity-100'
              }`}
            >
              <X className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      ))}
      <button
        onClick={() => addTab()}
        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
        title="New tab"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}