import cron from 'node-cron'
import { sendDailySpendEmail } from './mailer'

declare global {
  // eslint-disable-next-line no-var
  var _cronStarted: boolean | undefined
}

const TEST_MODE = process.env.CRON_TEST_MODE === 'true'
const TEST_SCHEDULE = '* * * * *'   // every 1 minute
const PROD_SCHEDULE = '0 23 * * *'  // daily at 11 PM

async function runEmailFetch() {
  console.log('[Cron] Running email fetch job at', new Date().toISOString())
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/cron/fetch-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.NEXTAUTH_SECRET || '',
      },
    })
    const data = await response.json()
    console.log('[Cron] Email fetch result:', data)
  } catch (error) {
    console.error('[Cron] Error in email fetch job:', error)
  }

  try {
    await sendDailySpendEmail()
  } catch (error) {
    console.error('[Cron] Error sending daily email:', error)
  }
}

export function startCronJobs() {
  if (global._cronStarted) return
  if (typeof window !== 'undefined') return

  global._cronStarted = true

  const schedule = TEST_MODE ? TEST_SCHEDULE : PROD_SCHEDULE
  const label = TEST_MODE ? 'every 1 minute (test mode)' : 'daily at 11 PM'

  console.log(`[Cron] Starting scheduled jobs... schedule: ${label}`)
  cron.schedule(schedule, runEmailFetch)
  console.log(`[Cron] Scheduled email fetch job: ${label}`)
}
