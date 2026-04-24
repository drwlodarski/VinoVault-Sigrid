/**
 * scripts/monitor.js — Manual price-drop monitor (Observer pattern)
 *
 * This script mirrors the logic in api/lib/monitor.ts and can be triggered
 * on-demand via `npm run monitor`.  The Vercel Cron Job at api/cron/monitor.ts
 * handles daily automated runs in production.
 *
 * Observer pattern:
 *   PriceDropSubject      — broadcasts price-drop events to all subscribers
 *   EmailObserver         — sends a Nodemailer email alert
 *   NotificationObserver  — persists the event to MongoDB (frontend reads this)
 *
 * To add a new notification channel, create a class with an `update(event)` method
 * and call subject.subscribe(new YourObserver()) — nothing else changes.
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// ─── Env validation ───────────────────────────────────────────────────────────
const REQUIRED_ENV = ['MONGODB_URI', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[monitor] Missing required env var: ${key}`)
    process.exit(1)
  }
}

// ─── Mongoose models ──────────────────────────────────────────────────────────
// Schemas are defined inline so this script runs with plain `node` (no tsx/tsc).
// They intentionally mirror api/lib/models/ — keep in sync if schemas change.

const wineSchema = new mongoose.Schema({
  wineId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  salePrice: { type: Number, default: null },
  regularPrice: { type: Number, default: null },
})
const Wine = mongoose.models.Wine ?? mongoose.model('Wine', wineSchema)

const wishlistSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    wineId: { type: String, required: true },
    targetPrice: { type: Number, required: true },
    isNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
)
wishlistSchema.index({ email: 1, wineId: 1 }, { unique: true })
const Wishlist = mongoose.models.Wishlist ?? mongoose.model('Wishlist', wishlistSchema)

const notificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    wineId: { type: String, required: true },
    wineName: { type: String, required: true },
    previousPrice: { type: Number, default: null },
    currentPrice: { type: Number, required: true },
    targetPrice: { type: Number, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
)
const Notification =
  mongoose.models.Notification ?? mongoose.model('Notification', notificationSchema)

// ─── Email ────────────────────────────────────────────────────────────────────
// Mirrors api/lib/email.ts — kept inline so this script stays self-contained.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

function buildHtml({ wineName, targetPrice, currentPrice, wineUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Price Drop Alert</title></head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr><td style="background:#7B1E2B;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#e8c4b8;">VinoVault</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:normal;color:#fff;">Price Drop Alert 🍷</h1>
        </td></tr>
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 20px;font-size:16px;color:#4a4a4a;line-height:1.6;">Great news! A wine on your wishlist has dropped below your target price.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f4;border:1px solid #e8ddd4;border-radius:6px;margin-bottom:28px;">
            <tr><td style="padding:24px 28px;">
              <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#2c2c2c;">${wineName}</p>
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="padding-right:40px;">
                  <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#999;">Current Price</p>
                  <p style="margin:0;font-size:28px;font-weight:bold;color:#7B1E2B;">$${currentPrice.toFixed(2)}</p>
                </td>
                <td>
                  <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#999;">Your Target</p>
                  <p style="margin:0;font-size:28px;color:#888;text-decoration:line-through;">$${targetPrice.toFixed(2)}</p>
                </td>
              </tr></table>
            </td></tr>
          </table>
          <p style="margin:0 0 28px;font-size:15px;color:#4a4a4a;line-height:1.6;">
            The current price of <strong>$${currentPrice.toFixed(2)}</strong> is below your target of <strong>$${targetPrice.toFixed(2)}</strong>.
          </p>
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="border-radius:4px;background:#7B1E2B;">
              <a href="${wineUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:bold;color:#fff;text-decoration:none;">Buy Now &rarr;</a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f0e8e0;">
          <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">You're receiving this because you added this wine to your VinoVault wishlist.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

async function sendPriceAlertEmail({ email, wineName, targetPrice, currentPrice, wineUrl }) {
  console.log(`[email] Sending price alert to ${email} for "${wineName}"`)
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `🚨 Price Drop Alert: ${wineName} has reached your target price!`,
    html: buildHtml({ wineName, targetPrice, currentPrice, wineUrl }),
  })
  console.log(`[email] Sent successfully to ${email}`)
}

// ─── Observer pattern ─────────────────────────────────────────────────────────

class PriceDropSubject {
  #observers = []
  subscribe(observer) {
    this.#observers.push(observer)
  }
  async notify(event) {
    await Promise.all(this.#observers.map((obs) => obs.update(event)))
  }
}

class EmailObserver {
  async update({ email, wineName, targetPrice, currentPrice, wineUrl }) {
    try {
      await sendPriceAlertEmail({ email, wineName, targetPrice, currentPrice, wineUrl })
    } catch (err) {
      console.error('[EmailObserver] Failed:', err)
    }
  }
}

class NotificationObserver {
  async update({ email, wineId, wineName, previousPrice, currentPrice, targetPrice }) {
    try {
      await Notification.create({
        email,
        wineId,
        wineName,
        previousPrice,
        currentPrice,
        targetPrice,
      })
      console.log(`[NotificationObserver] Saved notification for ${email}`)
    } catch (err) {
      console.error('[NotificationObserver] Failed:', err)
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function runMonitor() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('[monitor] Connected to MongoDB')

  const pendingItems = await Wishlist.find({ isNotified: false })
  console.log(`[monitor] Found ${pendingItems.length} unnotified wishlist item(s)`)

  const subject = new PriceDropSubject()
  subject.subscribe(new EmailObserver())
  subject.subscribe(new NotificationObserver())

  let alerted = 0

  for (const item of pendingItems) {
    try {
      const wine = await Wine.findOne({ wineId: item.wineId })

      if (!wine) {
        console.log(`[monitor] Wine not found for wineId "${item.wineId}", skipping`)
        continue
      }

      if (wine.salePrice !== null && wine.salePrice <= item.targetPrice) {
        await subject.notify({
          email: item.email,
          wineId: item.wineId,
          wineName: wine.name,
          previousPrice: wine.regularPrice,
          currentPrice: wine.salePrice,
          targetPrice: item.targetPrice,
          wineUrl: `https://www.wine.com/product/${item.wineId}`,
        })

        await Wishlist.updateOne({ _id: item._id }, { isNotified: true })
        console.log(`[monitor] Alerted ${item.email} for "${wine.name}"`)
        alerted++
      } else {
        console.log(
          `[monitor] No alert for "${wine.name}" — $${wine.salePrice} > target $${item.targetPrice}`
        )
      }
    } catch (err) {
      console.error(`[monitor] Error processing item ${item._id}:`, err)
    }
  }

  console.log(`[monitor] Done — checked: ${pendingItems.length}, alerted: ${alerted}`)
  await mongoose.disconnect()
  console.log('[monitor] Disconnected')
  process.exit(0)
}

runMonitor().catch((err) => {
  console.error('[monitor] Fatal error:', err)
  mongoose.disconnect().finally(() => process.exit(1))
})
