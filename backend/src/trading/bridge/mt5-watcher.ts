import fs from 'fs'
import path from 'path'
import prisma from '../../lib/prisma'

const MT5_FILES_PATH = '/mnt/c/Users/ekuL/AppData/Roaming/MetaQuotes/Terminal/49CDDEAA95A409ED22BD2287BB67CB9C/MQL5/Files'

const PRICES_FILE = path.join(MT5_FILES_PATH, 'bridge_prices.json')
const ACCOUNT_FILE = path.join(MT5_FILES_PATH, 'bridge_account.json')
const REQUEST_FILE = path.join(MT5_FILES_PATH, 'bridge_request.json')
const CANDLES_FILE = path.join(MT5_FILES_PATH, 'bridge_candles.json')

// In-memory store for latest prices
export const livePrices: Map<string, {
  symbol: string
  bid: number
  ask: number
  digits: number
  spread: number
  timestamp: string
}> = new Map()

export const accountInfo: { data: any | null } = { data: null }

// Candle request tracking
interface PendingRequest {
  requestId: string
  resolve: (data: any) => void
  reject: (err: any) => void
  timeout: NodeJS.Timeout
}

const pendingRequests: Map<string, PendingRequest> = new Map()

let lastPricesMtime = 0
let lastAccountMtime = 0
let lastCandlesMtime = 0

function readPrices() {
  try {
    const stat = fs.statSync(PRICES_FILE)
    const mtime = stat.mtimeMs
    if (mtime <= lastPricesMtime) return
    lastPricesMtime = mtime

    const raw = fs.readFileSync(PRICES_FILE, 'utf-8')
    const data = JSON.parse(raw)

    if (data.prices && Array.isArray(data.prices)) {
      data.prices.forEach((p: any) => {
        livePrices.set(p.symbol, {
          symbol: p.symbol,
          bid: p.bid,
          ask: p.ask,
          digits: p.digits,
          spread: p.spread,
          timestamp: data.timestamp
        })
      })
    }
  } catch (err) {
    // File might be mid-write
  }
}

function readAccount() {
  try {
    const stat = fs.statSync(ACCOUNT_FILE)
    const mtime = stat.mtimeMs
    if (mtime <= lastAccountMtime) return
    lastAccountMtime = mtime

    const raw = fs.readFileSync(ACCOUNT_FILE, 'utf-8')
    const data = JSON.parse(raw)
    accountInfo.data = data
    updateBrokerStatus(data)
  } catch (err) {
    // File might be mid-write
  }
}

function readCandles() {
  try {
    if (!fs.existsSync(CANDLES_FILE)) return

    const stat = fs.statSync(CANDLES_FILE)
    const mtime = stat.mtimeMs
    if (mtime <= lastCandlesMtime) return
    lastCandlesMtime = mtime

    const raw = fs.readFileSync(CANDLES_FILE, 'utf-8')
    const data = JSON.parse(raw)

    if (!data.requestId) return

    const pending = pendingRequests.get(data.requestId)
    if (!pending) return

    clearTimeout(pending.timeout)
    pendingRequests.delete(data.requestId)

    if (data.error) {
      pending.reject(new Error(data.error))
    } else {
      pending.resolve(data)
    }
  } catch (err) {
    // File might be mid-write
  }
}

async function updateBrokerStatus(account: any) {
  try {
    const connection = await prisma.brokerConnection.findFirst({
      where: { accountNumber: String(account.account) }
    })

    if (connection && connection.status !== 'connected') {
      await prisma.brokerConnection.update({
        where: { id: connection.id },
        data: { status: 'connected' }
      })
      console.log(`[MT5 Bridge] Broker connection ${connection.id} marked as connected`)
    }
  } catch (err) {
    // Silent fail
  }
}

// Request candles from MT5
export function requestCandles(symbol: string, interval: string, bars: number = 500): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Write request file
    const request = JSON.stringify({
      symbol,
      interval,
      bars: String(bars),
      requestId
    })

    try {
      fs.writeFileSync(REQUEST_FILE, request)
    } catch (err) {
      reject(new Error('Failed to write request file'))
      return
    }

    // Set timeout (10 seconds)
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Candle request timed out'))
    }, 10000)

    pendingRequests.set(requestId, { requestId, resolve, reject, timeout })
  })
}

export function startMT5Watcher() {
  if (!fs.existsSync(MT5_FILES_PATH)) {
    console.log('[MT5 Bridge] MT5 files path not found, bridge disabled')
    return
  }

  console.log('[MT5 Bridge] Watching for MT5 data...')

  // Poll every 500ms
  setInterval(() => {
    readPrices()
    readAccount()
    readCandles()
  }, 500)

  // Initial read
  readPrices()
  readAccount()
}