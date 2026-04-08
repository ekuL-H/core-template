import { Router, Request, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import prisma from '../lib/prisma'
import axios from 'axios'

const router = Router()

const TWELVEDATA_BASE = 'https://api.twelvedata.com'
const API_KEY = process.env.TWELVEDATA_API_KEY

// Get candles for a symbol
router.get('/candles', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { symbol, interval = '30min', outputsize = '100' } = req.query

    if (!symbol) {
      res.status(400).json({ error: 'Symbol is required' })
      return
    }

    const symbolStr = (symbol as string).toUpperCase()
    const intervalStr = interval as string
    const size = parseInt(outputsize as string)

    // Check cache first — get candles from DB
    const dbSymbol = await prisma.symbol.findFirst({
      where: { name: symbolStr }
    })

    if (dbSymbol) {
      const cached = await prisma.candle.findMany({
        where: {
          symbolId: dbSymbol.id,
          timeframe: intervalStr
        },
        orderBy: { timestamp: 'desc' },
        take: size
      })

      // If we have cached data, check if it's recent enough
      if (cached.length > 0) {
        const newest = cached[0].timestamp
        const now = new Date()
        const intervalMs = getIntervalMs(intervalStr)

        // If the newest candle is less than 2 intervals old, serve from cache
        if (now.getTime() - newest.getTime() < intervalMs * 2) {
          const sorted = cached.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          res.json({
            symbol: symbolStr,
            interval: intervalStr,
            source: 'cache',
            candles: sorted.map(formatCandle)
          })
          return
        }
      }
    }

    // Fetch from Twelve Data
    const response = await axios.get(`${TWELVEDATA_BASE}/time_series`, {
      params: {
        symbol: symbolStr,
        interval: intervalStr,
        outputsize: size,
        timezone: 'UTC',
        apikey: API_KEY
      }
    })

    if (response.data.status === 'error') {
      res.status(400).json({ error: response.data.message })
      return
    }

    const values = response.data.values
    if (!values || values.length === 0) {
      res.status(404).json({ error: 'No data returned' })
      return
    }

    // Store in DB if we have the symbol
    if (dbSymbol) {
      const upserts = values.map((v: any) => ({
        where: {
          symbolId_timeframe_timestamp: {
            symbolId: dbSymbol.id,
            timeframe: intervalStr,
            timestamp: new Date(v.datetime + 'Z')
          }
        },
        update: {
          open: parseFloat(v.open),
          high: parseFloat(v.high),
          low: parseFloat(v.low),
          close: parseFloat(v.close),
          volume: v.volume ? parseFloat(v.volume) : null
        },
        create: {
          symbolId: dbSymbol.id,
          timeframe: intervalStr,
          timestamp: new Date(v.datetime + 'Z'),
          open: parseFloat(v.open),
          high: parseFloat(v.high),
          low: parseFloat(v.low),
          close: parseFloat(v.close),
          volume: v.volume ? parseFloat(v.volume) : null
        }
      }))

      // Batch upsert
      await Promise.all(upserts.map((u: any) => prisma.candle.upsert(u)))
    }

    // Return formatted data
    const candles = values
      .map((v: any) => ({
        time: Math.floor(new Date(v.datetime + 'Z').getTime() / 1000),
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: v.volume ? parseFloat(v.volume) : undefined
      }))
      .reverse() // Twelve Data returns newest first, charts need oldest first

    res.json({
      symbol: symbolStr,
      interval: intervalStr,
      source: 'twelvedata',
      candles
    })
  } catch (err) {
    console.error('Market candles error:', err)
    res.status(500).json({ error: 'Failed to fetch candles' })
  }
})

// Get current quote for a symbol
router.get('/quote', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.query

    if (!symbol) {
      res.status(400).json({ error: 'Symbol is required' })
      return
    }

    const response = await axios.get(`${TWELVEDATA_BASE}/quote`, {
      params: {
        symbol: (symbol as string).toUpperCase(),
        apikey: API_KEY
      }
    })

    if (response.data.status === 'error') {
      res.status(400).json({ error: response.data.message })
      return
    }

    res.json(response.data)
  } catch (err) {
    console.error('Market quote error:', err)
    res.status(500).json({ error: 'Failed to fetch quote' })
  }
})

// Helper: convert interval string to milliseconds
function getIntervalMs(interval: string): number {
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
function formatCandle(c: any) {
  return {
    time: Math.floor(c.timestamp.getTime() / 1000),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume ?? undefined
  }
}

export default router