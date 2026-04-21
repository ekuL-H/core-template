import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Core API running' })
})

// --- Core routes ---
import authRoutes from './routes/auth'
app.use('/api/auth', authRoutes)

// --- Trading module routes ---
import watchlistRoutes from './routes/trading/watchlist'
import marketRoutes from './routes/trading/market'
import brokerRoutes from './routes/trading/broker'
import bridgeRoutes from './routes/trading/bridge'
import { startMT5Watcher } from './trading/bridge/mt5-watcher'

app.use('/api/watchlist', watchlistRoutes)
app.use('/api/market', marketRoutes)
app.use('/api/broker', brokerRoutes)
app.use('/api/bridge', bridgeRoutes)

import aiRoutes from './routes/trading/ai'
app.use('/api/ai', aiRoutes)

import datasetRoutes from './routes/trading/datasets'
app.use('/api/datasets', datasetRoutes)

import journalRoutes from './routes/trading/journal'
app.use('/api/journal', journalRoutes)

startMT5Watcher()

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})