import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectDB } from '../lib/db'
import { getClerkId } from '../lib/auth'
import { findOrCreateUserFromClerk } from '../lib/user-sync'

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

    const clerkId = await getClerkId(req)
    if (!clerkId) return res.status(401).json({ message: 'Unauthorized' })

    const user = await findOrCreateUserFromClerk(clerkId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    return res.status(200).json({
      data: {
        clerkId: user.clerkId,
        email: user.email,
        username: user.username,
        profile: user.profile ?? {},
      },
    })
  } catch (error) {
    console.error('[me] Error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
