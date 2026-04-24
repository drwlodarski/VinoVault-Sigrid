/**
 * Core price-drop monitoring logic using the Observer design pattern.
 *
 * Architecture:
 *   PriceDropSubject   — maintains a list of observers and broadcasts events
 *   PriceDropObserver  — interface every notification channel must implement
 *   EmailObserver      — sends a price-drop email via Nodemailer
 *   NotificationObserver — persists the event to MongoDB for the frontend
 *
 * Adding a new notification channel (e.g. SMS, push) only requires:
 *   1. Implement PriceDropObserver
 *   2. subject.subscribe(new SmsObserver())  ← no other code changes needed
 */

import { connectDB } from './db'
import { Wishlist } from './models/Wishlist'
import { Wine } from './models/Wine'
import { Notification } from './models/Notification'
import { sendPriceAlertEmail } from './email'
import { fetchWinePrice } from './priceFetcher'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PriceDropEvent {
  email: string
  wineId: string
  wineName: string
  previousPrice: number | null
  currentPrice: number
  targetPrice: number
  wineUrl: string
}

export interface PriceDropObserver {
  update(event: PriceDropEvent): Promise<void>
}

// ── Subject ───────────────────────────────────────────────────────────────────

export class PriceDropSubject {
  private observers: PriceDropObserver[] = []

  subscribe(observer: PriceDropObserver): void {
    this.observers.push(observer)
  }

  /** Broadcasts the event to all registered observers in parallel. */
  async notify(event: PriceDropEvent): Promise<void> {
    await Promise.all(this.observers.map((obs) => obs.update(event)))
  }
}

// ── Concrete Observers ────────────────────────────────────────────────────────

/** Sends a formatted HTML email to the user via SMTP. */
export class EmailObserver implements PriceDropObserver {
  async update(event: PriceDropEvent): Promise<void> {
    try {
      await sendPriceAlertEmail({
        email: event.email,
        wineName: event.wineName,
        targetPrice: event.targetPrice,
        currentPrice: event.currentPrice,
        wineUrl: event.wineUrl,
      })
      console.log(`[EmailObserver] Email sent to ${event.email}`)
    } catch (err) {
      // Log but don't throw — a failed email must not block other observers
      console.error(`[EmailObserver] Failed for ${event.email}:`, err)
    }
  }
}

/** Persists the price-drop event to MongoDB so the frontend can display it. */
export class NotificationObserver implements PriceDropObserver {
  async update(event: PriceDropEvent): Promise<void> {
    try {
      await Notification.create({
        email: event.email,
        wineId: event.wineId,
        wineName: event.wineName,
        wineUrl: event.wineUrl,
        previousPrice: event.previousPrice,
        currentPrice: event.currentPrice,
        targetPrice: event.targetPrice,
      })
      console.log(`[NotificationObserver] Saved notification for ${event.email}`)
    } catch (err) {
      console.error(`[NotificationObserver] Failed for ${event.email}:`, err)
    }
  }
}

// ── Price refresh ─────────────────────────────────────────────────────────────

export interface MonitorResult {
  checked: number
  alerted: number
  refreshed: number
  refreshFailed: number
}

const REFRESH_DELAY_MS = 800

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetches the latest CA price for each unique wineId and writes it back
 * to Wine.salePrice / Wine.regularPrice in MongoDB.
 */
async function refreshWinePrices(
  wineIds: string[]
): Promise<{ refreshed: number; refreshFailed: number }> {
  let refreshed = 0
  let refreshFailed = 0

  for (const wineId of wineIds) {
    const wine = await Wine.findOne({ wineId })
    if (!wine) {
      console.log(`[monitor] Wine not found for wineId "${wineId}", skipping`)
      continue
    }
    if (!wine.wineUrl) {
      console.log(`[monitor] No wineUrl for "${wine.name}", skipping refresh`)
      continue
    }

    console.log(`[monitor] Refreshing "${wine.name}" …`)
    const prices = await fetchWinePrice(wine.wineUrl)

    if (prices) {
      await Wine.updateOne(
        { wineId },
        { $set: { regularPrice: prices.regularPrice, salePrice: prices.salePrice } }
      )
      console.log(
        `[monitor] Updated "${wine.name}" — regular: $${prices.regularPrice}, sale: $${prices.salePrice}`
      )
      refreshed++
    } else {
      console.warn(`[monitor] Refresh failed for "${wine.name}", keeping existing price`)
      refreshFailed++
    }

    await sleep(REFRESH_DELAY_MS)
  }

  return { refreshed, refreshFailed }
}

// ── Main monitor function ─────────────────────────────────────────────────────

export async function runMonitor(): Promise<MonitorResult> {
  await connectDB()
  console.log('[monitor] Connected to MongoDB')

  const pendingItems = await Wishlist.find({}).lean()
  console.log(`[monitor] Found ${pendingItems.length} wishlist item(s) to check`)

  const uniqueWineIds = [...new Set(pendingItems.map((i) => i.wineId))]
  console.log(`[monitor] Refreshing prices for ${uniqueWineIds.length} unique wine(s) …`)
  const { refreshed, refreshFailed } = await refreshWinePrices(uniqueWineIds)
  console.log(`[monitor] Price refresh complete — updated: ${refreshed}, failed: ${refreshFailed}`)

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
        const wineUrl =
          wine.wineUrl ??
          `https://www.wine.com/search/red-wine/0?searchterm=${encodeURIComponent(wine.name)}`
        await subject.notify({
          email: item.email,
          wineId: item.wineId,
          wineName: wine.name,
          previousPrice: wine.regularPrice,
          currentPrice: wine.salePrice,
          targetPrice: item.targetPrice,
          wineUrl,
        })
        console.log(`[monitor] Alerted ${item.email} for "${wine.name}" @ $${wine.salePrice}`)
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

  console.log(
    `[monitor] Done — checked: ${pendingItems.length}, alerted: ${alerted}, refreshed: ${refreshed}, refreshFailed: ${refreshFailed}`
  )
  return { checked: pendingItems.length, alerted, refreshed, refreshFailed }
}
