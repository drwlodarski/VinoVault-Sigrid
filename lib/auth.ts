import { verifyToken } from '@clerk/backend'
import type { VercelRequest } from '@vercel/node'

/** Extracts and verifies the Clerk Bearer token, returns clerkId (sub) or null. */
export async function getClerkId(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    })
    return payload.sub
  } catch {
    return null
  }
}
