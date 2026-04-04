import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/gmail'

export async function GET(request: NextRequest) {
  try {
    const authUrl = getAuthUrl()
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Gmail auth error:', error)
    // Redirect back to settings with a readable error instead of a blank JSON page
    return NextResponse.redirect(
      new URL(`/dashboard/settings?gmail_error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}
