import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Core API running' })
})

app.use('/api/auth', authRoutes)

import watchlistRoutes from './routes/watchlist'
app.use('/api/watchlist', watchlistRoutes)

import marketRoutes from './routes/market'
app.use('/api/market', marketRoutes)

import brokerRoutes from './routes/broker'
app.use('/api/broker', brokerRoutes)

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})

import bridgeRoutes from './routes/bridge'
import { startMT5Watcher } from './bridge/mt5-watcher'

app.use('/api/bridge', bridgeRoutes)

// Start MT5 file watcher
startMT5Watcher()

export default app