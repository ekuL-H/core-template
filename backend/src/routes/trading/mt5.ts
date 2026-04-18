import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../../middleware/auth'
import prisma from '../../lib/prisma'
import { requestCandles as requestMT5Candles } from '../../trading/bridge/mt5-watcher'
import { getIntervalMs, formatCandle, MT5_INTERVAL_MAP } from './marketHelpers'

const router = Router()

// Get candles from MT5 bridge
router.get('/candles', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { symbol, interval = '30min', bars = '500', fresh = 'false' } = req.query

    if (!symbol) {
      res.status(400).json({ error: 'Symbol is required' })
      return
    }

    const symbolStr = (symbol as string).toUpperCase()
    const intervalStr = interval as string
    const barsNum = parseInt(bars as string)
    const mt5Interval = MT5_INTERVAL_MAP[intervalStr] || intervalStr

    // Look up the symbol in DB
    const dbSymbol = await prisma.symbol.findFirst({
      where: { name: { contains: symbolStr, mode: 'insensitive' } }
    })

    // Look up the broker symbol mapping
    let brokerSymbol = symbolStr
    if (dbSymbol) {
      const mapping = await prisma.symbolMapping.findFirst({
        where: { symbolId: dbSymbol.id, source: 'icmarkets-mt5' }
      })
      if (mapping) {
        brokerSymbol = mapping.sourceSymbol
      }
    }

    // Check DB cache (unless fresh requested)
    if (dbSymbol) {
      const cached = await prisma.candle.findMany({
        where: { symbolId: dbSymbol.id, timeframe: intervalStr },
        orderBy: { timestamp: 'desc' },
        take: barsNum
      })

      if (cached.length > 0) {
        const newest = cached[0].timestamp
        const now = new Date()
        const intervalMs = getIntervalMs(intervalStr)

        if (fresh !== 'true' && now.getTime() - newest.getTime() < intervalMs * 2 && cached.length >= Math.min(barsNum, 100)) {
          const sorted = cached.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          res.json({
            symbol: symbolStr,
            interval: intervalStr,
            source: 'mt5-cache',
            candles: sorted.map(formatCandle)
          })
          return
        }
      }
    }

    // Request from MT5 via bridge
    const data = await requestMT5Candles(brokerSymbol, mt5Interval, barsNum)

    if (!data.candles || data.candles.length === 0) {
      res.status(404).json({ error: 'No candle data returned from MT5' })
      return
    }

    // Store in DB
    if (dbSymbol) {
      const upserts = data.candles.map((c: any) => ({
        where: {
          symbolId_timeframe_timestamp: {
            symbolId: dbSymbol.id,
            timeframe: intervalStr,
            timestamp: new Date(c.time * 1000)
          }
        },
        update: {
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume || null
        },
        create: {
          symbolId: dbSymbol.id,
          timeframe: intervalStr,
          timestamp: new Date(c.time * 1000),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume || null
        }
      }))

      await Promise.all(upserts.map((u: any) => prisma.candle.upsert(u)))
    }

    const candles = data.candles.map((c: any) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume || undefined
    }))

    res.json({
      symbol: symbolStr,
      interval: intervalStr,
      source: 'mt5',
      candles
    })
  } catch (err: any) {
    console.error('MT5 candles error:', err.message)
    res.status(500).json({ error: err.message || 'Failed to fetch candles from MT5' })
  }
})

export default router