import type { VercelRequest, VercelResponse } from '@vercel/node'
import { runMonitor } from '../lib/monitor'

/**
 * Vercel Cron Job endpoint — triggered daily at 08:00 UTC via vercel.json.
 *
 * Vercel sends the CRON_SECRET as a Bearer token when the env var is set,
 * preventing unauthorized external invocations.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const result = await runMonitor()
    return res.status(200).json({ success: true, ...result })
  } catch (error) {
    console.error('[cron] Fatal error:', error)
    return res.status(500).json({ message: 'Monitor failed' })
  }
}
