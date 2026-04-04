import cron from 'node-cron'

let cronStarted = false

export function startCronJobs() {
  if (cronStarted) return
  if (typeof window !== 'undefined') return // Client-side guard

  cronStarted = true
  console.log('[Cron] Starting scheduled jobs...')

  // Daily at 11 PM
  cron.schedule('0 23 * * *', async () => {
    console.log('[Cron] Running daily email fetch job at', new Date().toISOString())
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
  })

  console.log('[Cron] Scheduled email fetch job: daily at 11 PM')
}
