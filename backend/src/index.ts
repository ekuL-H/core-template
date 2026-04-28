import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

import rateLimit from 'express-rate-limit'

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute per IP
  message: { error: 'Too many requests, please slow down' }
})
app.use('/api', apiLimiter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Core API running' })
})

// ============================================================================
// CORE ROUTES — auth, workspaces (shared across all module types)
// ============================================================================

import authRoutes from './routes/auth'
import workspaceRoutes from './routes/workspace'

app.use('/api/auth', authRoutes)
app.use('/api/workspace', workspaceRoutes)

// ============================================================================
// TRADING MODULE ROUTES — watchlists, charts, broker, journal, AI, datasets
// ============================================================================

import watchlistRoutes from './routes/trading/watchlist'
import marketRoutes from './routes/trading/market'
import brokerRoutes from './routes/trading/broker'
import bridgeRoutes from './routes/trading/bridge'
import aiRoutes from './routes/trading/ai'
import datasetRoutes from './routes/trading/datasets'
import journalRoutes from './routes/trading/journal'
import { startMT5Watcher } from './trading/bridge/mt5-watcher'

app.use('/api/watchlist', watchlistRoutes)
app.use('/api/market', marketRoutes)
app.use('/api/broker', brokerRoutes)
app.use('/api/bridge', bridgeRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/datasets', datasetRoutes)
app.use('/api/journal', journalRoutes)

// Start MT5 file bridge watcher
startMT5Watcher()

// ============================================================================
// PROPERTY MODULE ROUTES — (future: properties, tenants, maintenance, payments)
// ============================================================================

// import propertyRoutes from './routes/property/properties'
// app.use('/api/properties', propertyRoutes)

// ============================================================================

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})