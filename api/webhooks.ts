import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Webhook } from 'svix'
import { connectDB } from '../lib/db'
import { User } from '../lib/models/User'

// Disable Vercel's default body parser so svix can verify the raw HMAC signature
export const config = {
  api: { bodyParser: false },
}

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    res.status(500).json({ error: 'Webhook secret not configured' })
    return
  }

  const svixId = req.headers['svix-id'] as string
  const svixTimestamp = req.headers['svix-timestamp'] as string
  const svixSignature = req.headers['svix-signature'] as string

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: 'Missing svix headers' })
    return
  }

  const rawBody = await getRawBody(req)
  const wh = new Webhook(webhookSecret)
  let payload: { type: string; data: Record<string, unknown> }

  try {
    payload = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof payload
  } catch {
    res.status(400).json({ error: 'Invalid signature' })
    return
  }

  const { type, data } = payload
  const clerkId = data.id as string

  await connectDB()

  try {
    switch (type) {
      case 'user.created': {
        const emails = data.email_addresses as Array<{ email_address: string }>
        const email = emails?.[0]?.email_address ?? ''
        const username = (data.username as string) ?? ''
        await User.create({ clerkId, email, username, profile: {} })
        console.log(`[webhook] user.created: ${clerkId}`)
        break
      }
      case 'user.updated': {
        const emails = data.email_addresses as Array<{ email_address: string }>
        const email = emails?.[0]?.email_address ?? ''
        const username = (data.username as string) ?? ''
        await User.findOneAndUpdate(
          { clerkId },
          { email, username },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        console.log(`[webhook] user.updated: ${clerkId}`)
        break
      }
      case 'user.deleted': {
        await User.findOneAndDelete({ clerkId })
        console.log(`[webhook] user.deleted: ${clerkId}`)
        break
      }
      default:
        console.log(`[webhook] unhandled event: ${type}`)
    }
  } catch (err) {
    console.error('[webhook] DB error:', err)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  res.json({ received: true })
}
