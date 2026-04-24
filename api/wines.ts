import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectDB } from '../lib/db'
import { Wine } from '../lib/models/Wine'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await connectDB()

    const { search, region, priceRange, page, limit } = req.query
    const query = String(search ?? '').trim()
    const pageNumber = Math.max(1, Number(page ?? 1) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(limit ?? 24) || 24))
    const filter: Record<string, unknown> = { name: { $exists: true, $nin: [null, ''] } }

    if (query.length >= 2) {
      filter.name = { $exists: true, $nin: [null, ''], $regex: query, $options: 'i' }
    }

    if (region && String(region).trim()) {
      filter.region = String(region).trim()
    }

    if (priceRange && String(priceRange).trim()) {
      const normalizedRange = String(priceRange).trim()

      if (normalizedRange === 'under-30') {
        filter.salePrice = { $lt: 30 }
      } else if (normalizedRange === '30-60') {
        filter.salePrice = { $gte: 30, $lt: 60 }
      } else if (normalizedRange === '60-100') {
        filter.salePrice = { $gte: 60, $lt: 100 }
      } else if (normalizedRange === '100-plus') {
        filter.salePrice = { $gte: 100 }
      }
    }

    const wines = await Wine.find(filter)
      .select('wineId name region salePrice regularPrice')
      .sort({ name: 1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean()

    const total = await Wine.countDocuments(filter)
    const regions = (
      await Wine.distinct('region', {
        region: { $nin: [null, ''] },
      })
    )
      .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
      .sort((a, b) => a.localeCompare(b))

    return res.status(200).json({
      data: wines,
      meta: {
        page: pageNumber,
        limit: pageSize,
        total,
        hasMore: pageNumber * pageSize < total,
        nextPage: pageNumber * pageSize < total ? pageNumber + 1 : null,
        regions,
      },
    })
  } catch (error) {
    console.error('[wines] Error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
