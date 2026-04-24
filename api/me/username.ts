import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClerkClient } from '@clerk/backend'
import { connectDB } from '../../lib/db'
import { getClerkId } from '../../lib/auth'
import { User } from '../../lib/models/User'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await connectDB()

    const clerkId = await getClerkId(req)
    if (!clerkId) return res.status(401).json({ message: 'Unauthorized' })

    const { username } = req.body as { username?: string }
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ message: 'username is required' })
    }

    const trimmed = username.trim()

    const updated = await clerkClient.users.updateUser(clerkId, {
      username: trimmed,
    })

    await User.findOneAndUpdate({ clerkId }, { username: trimmed })

    return res.status(200).json({
      data: {
        clerkId: updated.id,
        email: updated.emailAddresses[0]?.emailAddress || '',
        username: updated.username || '',
        profile: {},
      },
    })
  } catch (error: any) {
    if (error?.errors?.[0]?.code === 'form_identifier_exists') {
      return res.status(409).json({ message: 'Username already taken' })
    }
    if (error?.errors?.[0]?.code === 'form_username_invalid_character') {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, - or _' })
    }
    console.error('[me/username] Error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
