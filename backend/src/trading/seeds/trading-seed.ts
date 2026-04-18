import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const symbols = [
  // Forex Majors
  { name: 'EUR/USD', assetClass: 'forex', description: 'Euro / US Dollar' },
  { name: 'GBP/USD', assetClass: 'forex', description: 'British Pound / US Dollar' },
  { name: 'USD/JPY', assetClass: 'forex', description: 'US Dollar / Japanese Yen' },
  { name: 'USD/CHF', assetClass: 'forex', description: 'US Dollar / Swiss Franc' },
  { name: 'AUD/USD', assetClass: 'forex', description: 'Australian Dollar / US Dollar' },
  { name: 'USD/CAD', assetClass: 'forex', description: 'US Dollar / Canadian Dollar' },
  { name: 'NZD/USD', assetClass: 'forex', description: 'New Zealand Dollar / US Dollar' },
  // Forex Minors
  { name: 'EUR/GBP', assetClass: 'forex', description: 'Euro / British Pound' },
  { name: 'EUR/JPY', assetClass: 'forex', description: 'Euro / Japanese Yen' },
  { name: 'GBP/JPY', assetClass: 'forex', description: 'British Pound / Japanese Yen' },
  { name: 'EUR/AUD', assetClass: 'forex', description: 'Euro / Australian Dollar' },
  { name: 'GBP/AUD', assetClass: 'forex', description: 'British Pound / Australian Dollar' },
  { name: 'AUD/JPY', assetClass: 'forex', description: 'Australian Dollar / Japanese Yen' },
  { name: 'EUR/CAD', assetClass: 'forex', description: 'Euro / Canadian Dollar' },
  { name: 'GBP/CAD', assetClass: 'forex', description: 'British Pound / Canadian Dollar' },
  // Indices
  { name: 'SPX', assetClass: 'index', description: 'S&P 500' },
  { name: 'NDX', assetClass: 'index', description: 'NASDAQ 100' },
  { name: 'DJI', assetClass: 'index', description: 'Dow Jones Industrial Average' },
  { name: 'DAX', assetClass: 'index', description: 'German DAX' },
  { name: 'FTSE', assetClass: 'index', description: 'FTSE 100' },
  { name: 'NKY', assetClass: 'index', description: 'Nikkei 225' },
  // Crypto
  { name: 'BTC/USD', assetClass: 'crypto', description: 'Bitcoin / US Dollar' },
  { name: 'ETH/USD', assetClass: 'crypto', description: 'Ethereum / US Dollar' },
  { name: 'XRP/USD', assetClass: 'crypto', description: 'Ripple / US Dollar' },
  // Commodities
  { name: 'XAU/USD', assetClass: 'commodity', description: 'Gold / US Dollar' },
  { name: 'XAG/USD', assetClass: 'commodity', description: 'Silver / US Dollar' },
  { name: 'WTI', assetClass: 'commodity', description: 'West Texas Intermediate Crude Oil' },
]

async function main() {
  console.log('Seeding symbols...')

  for (const symbol of symbols) {
    await prisma.symbol.upsert({
      where: { name: symbol.name },
      update: {},
      create: symbol
    })
  }

  console.log(`Seeded ${symbols.length} symbols`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())