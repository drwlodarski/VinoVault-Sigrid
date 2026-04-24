// Seed dummy reviews for local testing.
// Usage: node server/src/modules/review/review.seed.js
require('dotenv').config({ path: 'server/.env' })
const mongoose = require('mongoose')
const ReviewModel = require('./review.model')
const WineModel = require('./wine.model')
const { ALLOWED_NOTES } = require('./review.model')

const SEED_USERS = [
  { userId: 'seed_user_maya', userName: 'Maya Lin' },
  { userId: 'seed_user_tom', userName: 'Tom Becker' },
  { userId: 'seed_user_sofia', userName: 'Sofia Ricci' },
  { userId: 'seed_user_james', userName: "James O'Neil" },
  { userId: 'seed_user_priya', userName: 'Priya Nair' },
]

const SAMPLE_TEXTS = [
  'Silky tannins, long finish. A standout bottle for the price.',
  'Opens up beautifully after 30 minutes. Great with grilled lamb.',
  "Bright and structured. I'd buy again without hesitation.",
  'Fruit-forward but balanced. Memorable nose.',
  'Dense and brooding — needs another few years in the cellar.',
  '',
  'Elegant rather than powerful. Loved it.',
  '',
]

function pickRandom(arr, n) {
  const copy = [...arr]
  const out = []
  while (out.length < n && copy.length) {
    const idx = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(idx, 1)[0])
  }
  return out
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI missing. Did you load server/.env?')
    process.exit(1)
  }
  await mongoose.connect(uri)
  console.log('[seed] connected')

  const deleted = await ReviewModel.deleteMany({ userId: /^seed_/ })
  console.log(`[seed] cleared ${deleted.deletedCount} prior seeded reviews`)

  const wines = await WineModel.aggregate([{ $sample: { size: 10 } }])
  if (!wines.length) {
    console.error('[seed] no wines in DB — nothing to seed against')
    await mongoose.disconnect()
    process.exit(1)
  }

  const docs = []
  for (const wine of wines) {
    const reviewCount = 2 + Math.floor(Math.random() * 4) // 2-5 per wine
    const reviewers = pickRandom(SEED_USERS, Math.min(reviewCount, SEED_USERS.length))
    for (const user of reviewers) {
      docs.push({
        userId: user.userId,
        userName: user.userName,
        wineId: wine.wineId,
        wineName: wine.name,
        rating: Math.round((2.5 + Math.random() * 2.5) * 2) / 2, // 2.5 - 5.0, half steps
        notes: pickRandom(ALLOWED_NOTES, 1 + Math.floor(Math.random() * 3)),
        reviewText: SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)],
        photoUrl: '',
      })
    }
  }

  await ReviewModel.insertMany(docs)
  console.log(`[seed] inserted ${docs.length} reviews across ${wines.length} wines`)

  await mongoose.disconnect()
  console.log('[seed] done')
}

main().catch((err) => {
  console.error('[seed] failed', err)
  process.exit(1)
})
