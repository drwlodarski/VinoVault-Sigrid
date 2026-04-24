/**
 * One-off runner for the price-refresh + price-drop monitor.
 * Usage: tsx scripts/run-monitor.ts
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const require = createRequire(import.meta.url)
const mongoose = require('mongoose')
const { runMonitor } = require('../lib/monitor')

runMonitor()
  .then((result: unknown) => {
    console.log('\n[run-monitor] Result:', result)
  })
  .catch((err: unknown) => {
    console.error('[run-monitor] Fatal:', err)
  })
  .finally(async () => {
    await mongoose.disconnect()
    console.log('[run-monitor] Disconnected from MongoDB')
    process.exit(0)
  })
