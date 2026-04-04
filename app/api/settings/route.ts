import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGmailStatus } from '@/lib/gmail'
import connectDB from '@/lib/mongodb'
import Settings from '@/lib/models/Settings'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const gmailStatus = await getGmailStatus()
    const settings = await Settings.findOne({})

    return NextResponse.json({
      gmail: gmailStatus,
      adminEmail: process.env.ADMIN_EMAIL,
      emailIdentifiers: settings?.emailIdentifiers ?? ['alerts@hdfcbank.bank.in'],
    })
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { emailIdentifiers } = await request.json()

    if (!Array.isArray(emailIdentifiers)) {
      return NextResponse.json({ error: 'emailIdentifiers must be an array' }, { status: 400 })
    }

    // Sanitise: trim, lowercase, remove empty
    const cleaned = emailIdentifiers
      .map((e: string) => String(e).trim().toLowerCase())
      .filter(Boolean)

    await Settings.findOneAndUpdate(
      {},
      { emailIdentifiers: cleaned },
      { upsert: true, new: true }
    )

    return NextResponse.json({ emailIdentifiers: cleaned })
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
