import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../../middleware/auth'
import { livePrices, accountInfo } from '../../trading/bridge/mt5-watcher'

const router = Router()

// Get all live prices from MT5
router.get('/prices', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prices = Array.from(livePrices.values())
    res.json({ source: 'mt5', count: prices.length, prices })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Get live price for a specific symbol
router.get('/price/:symbol', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const symbol = req.params.symbol as string
    const price = livePrices.get(symbol)

    if (!price) {
      res.status(404).json({ error: `No live price for ${symbol}` })
      return
    }

    res.json(price)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Get MT5 account info
router.get('/account', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!accountInfo.data) {
      res.status(404).json({ error: 'No account data available. Is MT5 running?' })
      return
    }
    res.json(accountInfo.data)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router