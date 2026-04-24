import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectDB } from '../lib/db'
import { Wishlist } from '../lib/models/Wishlist'
import { Wine } from '../lib/models/Wine'
import { getClerkId } from '../lib/auth'
import { findOrCreateUserFromClerk } from '../lib/user-sync'
import { PriceDropSubject, EmailObserver, NotificationObserver } from '../lib/monitor'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    await connectDB()

    const clerkId = await getClerkId(req)
    if (!clerkId) return res.status(401).json({ message: 'Unauthorized' })

    const user = await findOrCreateUserFromClerk(clerkId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const { email } = user

    // ── GET /api/wishlist ──────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const wishlistItems = await Wishlist.find({ email }).lean()

      const wineIds = wishlistItems.map((item) => item.wineId)
      const wines = await Wine.find({ wineId: { $in: wineIds } })
        .select('wineId name region salePrice regularPrice')
        .lean()

      const wineMap = new Map(wines.map((w) => [w.wineId, w]))

      const data = wishlistItems.map((item) => {
        const wine = wineMap.get(item.wineId)
        return {
          _id: item._id,
          wineId: item.wineId,
          targetPrice: item.targetPrice,
          isNotified: item.isNotified,
          name: wine?.name ?? 'Unknown Wine',
          region: wine?.region ?? null,
          marketPrice: wine?.salePrice ?? null,
          regularPrice: wine?.regularPrice ?? null,
        }
      })

      return res.status(200).json({ data })
    }

    // ── POST /api/wishlist ─────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { wineId, targetPrice } = req.body ?? {}

      if (!wineId || targetPrice === undefined) {
        return res.status(400).json({ message: 'wineId and targetPrice are required' })
      }

      const numericTarget = Number(targetPrice)

      // Upsert wishlist item
      let savedItem
      let updated = false
      const existing = await Wishlist.findOne({ email, wineId })
      if (existing) {
        existing.targetPrice = numericTarget
        existing.isNotified = false
        savedItem = await existing.save()
        updated = true
      } else {
        savedItem = await Wishlist.create({ email, wineId, targetPrice: numericTarget })
      }

      // Immediately notify if the current price already meets the new target
      try {
        const wine = await Wine.findOne({ wineId: String(wineId) })
        if (wine && wine.salePrice !== null && wine.salePrice <= numericTarget) {
          const subject = new PriceDropSubject()
          subject.subscribe(new EmailObserver())
          subject.subscribe(new NotificationObserver())
          await subject.notify({
            email,
            wineId: String(wineId),
            wineName: wine.name,
            previousPrice: wine.regularPrice,
            currentPrice: wine.salePrice,
            targetPrice: numericTarget,
            wineUrl:
              wine.wineUrl ??
              `https://www.wine.com/search/red-wine/0?searchterm=${encodeURIComponent(wine.name)}`,
          })
          await Wishlist.updateOne({ email, wineId: String(wineId) }, { isNotified: true })
        }
      } catch (notifyErr) {
        // Non-fatal — wishlist was saved successfully, notification failure shouldn't block response
        console.error('[wishlist] POST immediate notify error:', notifyErr)
      }

      return res.status(updated ? 200 : 201).json({ data: savedItem, updated })
    }

    // ── DELETE /api/wishlist?id=<_id> ──────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) return res.status(400).json({ message: 'id query param required' })

      const deleted = await Wishlist.findOneAndDelete({ _id: String(id), email })
      if (!deleted) return res.status(404).json({ message: 'Wishlist item not found' })

      return res.status(200).json({ message: 'Removed from wishlist' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('[wishlist] Error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
