import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectDB } from '../lib/db'
import { Notification } from '../lib/models/Notification'
import { getClerkId } from '../lib/auth'
import { findOrCreateUserFromClerk } from '../lib/user-sync'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    await connectDB()

    const clerkId = await getClerkId(req)
    if (!clerkId) return res.status(401).json({ message: 'Unauthorized' })

    const user = await findOrCreateUserFromClerk(clerkId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const { email } = user

    // ── GET /api/notifications ─────────────────────────────────────────────────
    if (req.method === 'GET') {
      const notifications = await Notification.find({ email })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
      return res.status(200).json({ data: notifications })
    }

    if (req.method === 'PATCH') {
      const { id } = req.query

      // ── PATCH /api/notifications?id=<_id> — mark one as read ────────────────
      if (id) {
        const updated = await Notification.findOneAndUpdate(
          { _id: String(id), email },
          { isRead: true },
          { new: true }
        )
        if (!updated) return res.status(404).json({ message: 'Notification not found' })
        return res.status(200).json({ data: updated })
      }

      // ── PATCH /api/notifications — mark ALL as read ──────────────────────────
      await Notification.updateMany({ email, isRead: false }, { isRead: true })
      return res.status(200).json({ message: 'All notifications marked as read' })
    }

    // ── DELETE /api/notifications — clear all ─────────────────────────────────
    if (req.method === 'DELETE') {
      await Notification.deleteMany({ email })
      return res.status(200).json({ message: 'All notifications cleared' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('[notifications] Error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
