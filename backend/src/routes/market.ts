import { Router } from 'express'
import mt5Routes from './mt5'
import twelveDataRoutes from './twelvedata'

const router = Router()

// MT5 live data routes -> /api/market/mt5/*
router.use('/mt5', mt5Routes)

// Twelve Data routes (kept for fallback) -> /api/market/candles, /api/market/quote
router.use('/', twelveDataRoutes)

export default router