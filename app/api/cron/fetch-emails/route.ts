import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'
import { fetchBankEmails, updateLastFetchTime, getAuthenticatedClient, getOrCreateLabel, moveEmailToLabel, clearGmailTokens } from '@/lib/gmail'
import { parseEmailBody, enrichTransaction } from '@/lib/email-parser'
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    // Allow: valid NextAuth session (browser) OR matching cron secret (server cron job)
    const cronSecret = request.headers.get('x-cron-secret')
    const isValidCronSecret = cronSecret && cronSecret === process.env.NEXTAUTH_SECRET

    if (!isValidCronSecret) {
      const session = await getServerSession(authOptions)
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    await connectDB()

    const body = await request.json().catch(() => ({}))
    const hoursBack = body.hoursBack || 24

    console.log(`[Email Fetch] Fetching emails from last ${hoursBack} hours...`)

    const emails = await fetchBankEmails(hoursBack)
    console.log(`[Email Fetch] Found ${emails.length} emails to process`)

    // Set up Gmail client + label (label creation requires gmail.modify scope)
    const auth = await getAuthenticatedClient()
    const gmail = google.gmail({ version: 'v1', auth })
    let labelId: string | null = null
    try {
      labelId = await getOrCreateLabel(gmail)
    } catch (labelErr: any) {
      console.warn('[Email Fetch] Could not create label (reconnect Gmail for gmail.modify scope):', labelErr.message)
    }

    let processed = 0
    let skipped = 0
    let failed = 0

    for (const email of emails) {
      try {
        const parsed = parseEmailBody(email.body, email.id, email.date)
        if (!parsed) {
          skipped++
          continue
        }

        const enriched = enrichTransaction(parsed)

        // Check for duplicate
        const existing = await Transaction.findOne({ emailId: email.id })
        if (existing) {
          if (labelId) await moveEmailToLabel(gmail, email.id, labelId).catch(() => {})
          skipped++
          continue
        }

        await Transaction.create({
          amount: enriched.amount,
          type: enriched.type,
          category: enriched.category,
          merchant: enriched.merchant,
          description: email.subject,
          date: enriched.date,
          source: 'email',
          bankName: enriched.bankName,
          referenceNo: enriched.referenceNo,
          rawEmail: enriched.rawEmail,
          emailId: enriched.emailId,
        })

        // Move email to "Expense Tracker" label in Gmail
        if (labelId) {
          await moveEmailToLabel(gmail, email.id, labelId).catch((err) => {
            console.warn(`[Email Fetch] Could not label email ${email.id}:`, err.message)
          })
        }

        processed++
      } catch (err) {
        console.error(`[Email Fetch] Error processing email ${email.id}:`, err)
        failed++
      }
    }

    await updateLastFetchTime()

    const result = {
      message: 'Email fetch complete',
      total: emails.length,
      processed,
      skipped,
      failed,
      timestamp: new Date().toISOString(),
    }

    console.log('[Email Fetch] Result:', result)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Email Fetch] Fatal error:', error)

    if (error.message?.includes('Gmail not connected')) {
      return NextResponse.json(
        { error: 'Gmail not connected. Please authenticate in Settings.' },
        { status: 503 }
      )
    }

    if (
      error.response?.data?.error === 'invalid_grant' ||
      error.message?.includes('invalid_grant')
    ) {
      await clearGmailTokens().catch(() => {})
      return NextResponse.json(
        { error: 'Gmail token expired or revoked. Please reconnect Gmail in Settings.' },
        { status: 401 }
      )
    }

    if (error.message?.includes('insufficient authentication scopes') || error.code === 403) {
      return NextResponse.json(
        { error: 'Insufficient Gmail permissions. Please go to Settings → Reconnect Gmail to grant updated permissions.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// Vercel Cron calls GET — proxy to POST handler
export async function GET(request: NextRequest) {
  return POST(request)
}

export const maxDuration = 60 // seconds — allow long email fetch runs
