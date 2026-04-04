import { NextRequest, NextResponse } from 'next/server'
import { getTokensFromCode, saveTokens, createOAuth2Client } from '@/lib/gmail'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?gmail_error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?gmail_error=No+authorization+code', request.url)
      )
    }

    const tokens = await getTokensFromCode(code)

    // Get Gmail user info
    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials(tokens)
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const profile = await gmail.users.getProfile({ userId: 'me' })
    const email = profile.data.emailAddress

    await saveTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      email: email || undefined,
    })

    return NextResponse.redirect(
      new URL('/dashboard/settings?gmail_success=true', request.url)
    )
  } catch (error: any) {
    console.error('Gmail callback error:', error)
    return NextResponse.redirect(
      new URL(`/dashboard/settings?gmail_error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}
