import nodemailer from 'nodemailer'
import type { Options as SMTPOptions } from 'nodemailer/lib/smtp-transport'

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    family: 4,
  } as SMTPOptions)
}

interface PriceAlertEmailParams {
  email: string
  wineName: string
  targetPrice: number
  currentPrice: number
  wineUrl: string
}

function buildHtml({
  wineName,
  targetPrice,
  currentPrice,
  wineUrl,
}: Omit<PriceAlertEmailParams, 'email'>): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Price Drop Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#7B1E2B;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#e8c4b8;">VinoVault</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:normal;color:#ffffff;letter-spacing:0.5px;">Price Drop Alert 🍷</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#4a4a4a;line-height:1.6;">
                Great news! A wine on your wishlist has dropped below your target price.
              </p>

              <!-- Wine info card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf7f4;border:1px solid #e8ddd4;border-radius:6px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#2c2c2c;">${wineName}</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:40px;">
                          <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#999999;">Current Price</p>
                          <p style="margin:0;font-size:28px;font-weight:bold;color:#7B1E2B;">$${currentPrice.toFixed(2)}</p>
                        </td>
                        <td>
                          <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#999999;">Your Target</p>
                          <p style="margin:0;font-size:28px;color:#888888;text-decoration:line-through;">$${targetPrice.toFixed(2)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;font-size:15px;color:#4a4a4a;line-height:1.6;">
                The current price of <strong>$${currentPrice.toFixed(2)}</strong> is below your target of
                <strong>$${targetPrice.toFixed(2)}</strong>. Now is a great time to grab a bottle!
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:4px;background-color:#7B1E2B;">
                    <a href="${wineUrl}" target="_blank"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">
                      Buy Now &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid #f0e8e0;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                You're receiving this because you added this wine to your VinoVault wishlist.<br />
                Prices may change — check the link above for the latest availability.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendPriceAlertEmail({
  email,
  wineName,
  targetPrice,
  currentPrice,
  wineUrl,
}: PriceAlertEmailParams): Promise<void> {
  try {
    console.log(`[email] Sending price alert to ${email} for "${wineName}"`)
    await createTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `🚨 Price Drop Alert: ${wineName} has reached your target price!`,
      html: buildHtml({ wineName, targetPrice, currentPrice, wineUrl }),
    })
    console.log(`[email] Price alert sent successfully to ${email}`)
  } catch (error) {
    console.error(`[email] Failed to send price alert to ${email}:`, error)
    throw error
  }
}
