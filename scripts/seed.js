import mongoose from 'mongoose'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load env from root .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Inline schema (mirrors server/src/modules/wines/wine.model.js)
const wineSchema = new mongoose.Schema(
  {
    wineId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    vintage: { type: mongoose.Schema.Types.Mixed, default: null },
    region: { type: String, default: null },
    stock: { type: Number, default: null },
    regularPrice: { type: Number, default: null },
    salePrice: { type: Number, default: null },
    rating: { type: String, default: null },
    wineUrl: { type: String, default: null },
  },
  { timestamps: true }
)
const Wine = mongoose.models.Wine ?? mongoose.model('Wine', wineSchema)

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Error: MONGODB_URI not found. Check .env.local.')
    process.exit(1)
  }

  const dataPath = path.join(__dirname, 'wine_data.json')
  let wines
  try {
    const raw = await fs.readFile(dataPath, 'utf-8')
    wines = JSON.parse(raw)
  } catch {
    console.error('Error: scripts/wine_data.json not found. Run "npm run scrape" first.')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log(`MongoDB connected. Importing ${wines.length} wines...`)

  let upserted = 0
  let failed = 0

  for (const wine of wines) {
    try {
      await Wine.findOneAndUpdate(
        { wineId: wine.id },
        {
          wineId: wine.id,
          name: wine.name,
          vintage: wine.vintage,
          region: wine.region,
          stock: wine.stock,
          regularPrice: wine.regularPrice,
          salePrice: wine.salePrice,
          rating: wine.rating,
          wineUrl: wine.url ?? null,
        },
        { upsert: true }
      )
      upserted++
    } catch (err) {
      console.error(`Skipped wineId=${wine.id}: ${err.message}`)
      failed++
    }
  }

  console.log(`Done! ${upserted} upserted, ${failed} failed.`)
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
