import * as cheerio from 'cheerio'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY

// Set WINE_COM_BASE_URL in .env.local to scrape a different category. Defaults to category 7155.
const BASE_URL = process.env.WINE_COM_BASE_URL || 'https://www.wine.com/list/wine/7155'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function scraperApiUrl(targetUrl) {
  return `http://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}`
}

async function scrapeWinePage(pageNumber) {
  const targetUrl = pageNumber === 1 ? BASE_URL : `${BASE_URL}/${pageNumber}`
  console.log(`[+] Fetching page ${pageNumber}: ${targetUrl}...`)

  try {
    const response = await fetch(scraperApiUrl(targetUrl), {
      signal: AbortSignal.timeout(60000), // 60s timeout
    })

    if (!response.ok) {
      console.error(`[-] Page ${pageNumber}: HTTP ${response.status}`)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const pageTitle = $('title').text()
    if (pageTitle.includes('Just a moment') || pageTitle.includes('Access Denied')) {
      console.error(`[-] Page ${pageNumber} blocked by WAF.`)
      return []
    }

    const scriptContent = $('script[name="sharify"]').html() || $('script[name="sharify"]').text()

    if (!scriptContent) {
      console.error(
        `[-] Page ${pageNumber}: sharify data block not found. Page structure may have changed.`
      )
      return []
    }

    let jsonString = scriptContent.trim()
    jsonString = jsonString.replace(/^window\.__sharifyData\s*=\s*/, '')
    jsonString = jsonString.replace(/;?\s*$/, '')

    const data = JSON.parse(jsonString)
    const wineModels = data?.model?.collection?.models || []
    const winesOnPage = []

    wineModels.forEach((wine) => {
      const catalog = wine.catalogModel
      if (!catalog) return

      const regPrice = catalog.regularPrice
        ? parseFloat(`${catalog.regularPrice.whole}.${catalog.regularPrice.fractional}`)
        : null
      const salePrice = catalog.salePrice
        ? parseFloat(`${catalog.salePrice.whole}.${catalog.salePrice.fractional}`)
        : null

      winesOnPage.push({
        id: catalog.id,
        name: catalog.fullName,
        vintage: catalog.vintage,
        region: catalog.origin,
        stock: catalog.stock,
        regularPrice: regPrice,
        salePrice: salePrice || regPrice,
        rating: wine.averageRatingModel?.ratingsAverageDisplay || null,
        url:
          catalog.seoFullName && catalog.productTemplateId
            ? `https://www.wine.com/product/${catalog.seoFullName.toLowerCase()}/${catalog.productTemplateId}`
            : null,
      })
    })

    return winesOnPage
  } catch (error) {
    console.error(`[-] Page ${pageNumber} error: ${error.message}`)
    return []
  }
}

async function runScraper() {
  console.log('Starting scrape (ScraperAPI mode)...\n')

  if (!SCRAPERAPI_KEY) {
    console.error('Error: SCRAPERAPI_KEY is not set. Add it to .env.local:')
    console.error('  SCRAPERAPI_KEY=your_api_key_here')
    process.exit(1)
  }

  let allWines = []
  const START_PAGE = 1
  const END_PAGE = 8

  for (let i = START_PAGE; i <= END_PAGE; i++) {
    const wines = await scrapeWinePage(i)

    if (wines.length === 0) {
      console.log('No data on this page — stopping.')
      break
    }

    allWines = allWines.concat(wines)
    console.log(`[v] Parsed ${wines.length} wines, total so far: ${allWines.length}`)

    const delay = Math.floor(Math.random() * 1000) + 500
    console.log(`[zzz] Sleeping ${delay}ms...\n`)
    await sleep(delay)
  }

  if (allWines.length > 0) {
    const outputPath = path.join(__dirname, 'wine_data.json')
    await fs.writeFile(outputPath, JSON.stringify(allWines, null, 2))
    console.log(`\nDone! ${allWines.length} wines saved to scripts/wine_data.json`)
    console.log('Run "npm run seed" to import into MongoDB.')
  } else {
    console.log('Scrape failed — no data collected.')
  }
}

runScraper()
