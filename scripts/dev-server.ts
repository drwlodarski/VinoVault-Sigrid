/**
 * Local development API server.
 * Wraps the Vercel serverless handlers with a lightweight Express server
 * so you can run `npm run dev` without needing `vercel dev`.
 *
 * Usage: started automatically by `npm run dev` via concurrently.
 */
import dotenv from 'dotenv'
import path from 'path'
import express from 'express'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

import winesHandlerMod from '../api/wines'
import wishlistHandlerMod from '../api/wishlist'
import notificationsHandlerMod from '../api/notifications'
import meHandlerMod from '../api/me'
import meUsernameHandlerMod from '../api/me/username'

const app = express()
app.use(express.json())

// CJS/ESM interop: tsx may wrap the default export
type AnyHandler = (req: any, res: any) => any
function fn(mod: any): AnyHandler {
  return typeof mod === 'function' ? mod : mod.default
}

const mount = (handler: AnyHandler) => (req: express.Request, res: express.Response) =>
  handler(req, res)

app.all('/api/me/username', mount(fn(meUsernameHandlerMod)))
app.all('/api/me', mount(fn(meHandlerMod)))
app.all('/api/wines', mount(fn(winesHandlerMod)))
app.all('/api/wishlist', mount(fn(wishlistHandlerMod)))
app.all('/api/notifications', mount(fn(notificationsHandlerMod)))

const PORT = 3001
app.listen(PORT, () => {
  console.log(`[API] Dev server → http://localhost:${PORT}`)
})
