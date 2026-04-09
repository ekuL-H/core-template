import fs from 'fs'
import path from 'path'
import prisma from '../lib/prisma'

const MT5_FILES_PATH = '/mnt/c/Users/ekuL/AppData/Roaming/MetaQuotes/Terminal/49CDDEAA95A409ED22BD2287BB67CB9C/MQL5/Files'

const PRICES_FILE = path.join(MT5_FILES_PATH, 'bridge_prices.json')
const ACCOUNT_FILE = path.join(MT5_FILES_PATH, 'bridge_account.json')

// In-memory store for latest prices (accessible from routes)
export const livePrices: Map<string, {
  symbol: string
  bid: number
  ask: number
  digits: number
  spread: number
  timestamp: string
}> = new Map()

export const accountInfo: { data: any | null } = { data: null }

let lastPricesMtime = 0
let lastAccountMtime = 0

function readPrices() {
  try {
    const stat = fs.statSync(PRICES_FILE)
    const mtime = stat.mtimeMs

    // Only read if file has changed
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
    // File might be mid-write, skip this cycle
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

    // Update broker connection status in DB
    updateBrokerStatus(data)
  } catch (err) {
    // File might be mid-write, skip this cycle
  }
}

async function updateBrokerStatus(account: any) {
  try {
    // Find matching broker connection by account number
    const connection = await prisma.brokerConnection.findFirst({
      where: {
        accountNumber: String(account.account)
      }
    })

    if (connection && connection.status !== 'connected') {
      await prisma.brokerConnection.update({
        where: { id: connection.id },
        data: { status: 'connected' }
      })
      console.log(`[MT5 Bridge] Broker connection ${connection.id} marked as connected`)
    }
  } catch (err) {
    // Silent fail — DB might not be ready
  }
}

export function startMT5Watcher() {
  // Check if MT5 files path exists
  if (!fs.existsSync(MT5_FILES_PATH)) {
    console.log('[MT5 Bridge] MT5 files path not found, bridge disabled')
    return
  }

  console.log('[MT5 Bridge] Watching for MT5 data...')

  // Poll every 500ms
  setInterval(() => {
    readPrices()
    readAccount()
  }, 500)

  // Initial read
  readPrices()
  readAccount()
}