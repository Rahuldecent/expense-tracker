import { google } from 'googleapis'
import connectDB from './mongodb'
import Settings from './models/Settings'

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

const DEFAULT_EMAIL_IDENTIFIERS = ['alerts@hdfcbank.bank.in']

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  )
}

export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function getStoredTokens() {
  await connectDB()
  const settings = await Settings.findOne({})
  if (!settings?.gmailRefreshToken) return null
  return {
    access_token: settings.gmailAccessToken,
    refresh_token: settings.gmailRefreshToken,
    expiry_date: settings.gmailTokenExpiry ? new Date(settings.gmailTokenExpiry).getTime() : undefined,
  }
}

export async function saveTokens(tokens: {
  access_token?: string | null
  refresh_token?: string | null
  expiry_date?: number | null
  email?: string
}) {
  await connectDB()
  await Settings.findOneAndUpdate(
    {},
    {
      gmailAccessToken: tokens.access_token,
      gmailRefreshToken: tokens.refresh_token,
      gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      gmailEmail: tokens.email,
    },
    { upsert: true, new: true }
  )
}

export async function getAuthenticatedClient() {
  const tokens = await getStoredTokens()
  if (!tokens?.refresh_token) throw new Error('Gmail not connected. Please authenticate first.')

  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials(tokens)

  oauth2Client.on('tokens', async (newTokens) => {
    await saveTokens({
      access_token: newTokens.access_token ?? tokens.access_token,
      refresh_token: newTokens.refresh_token ?? tokens.refresh_token,
      expiry_date: newTokens.expiry_date ?? tokens.expiry_date,
    })
  })

  return oauth2Client
}

const LABEL_NAME = 'Expense Tracker'

export async function getOrCreateLabel(gmail: any): Promise<string> {
  // List all labels and find ours
  const res = await gmail.users.labels.list({ userId: 'me' })
  const existing = (res.data.labels || []).find((l: any) => l.name === LABEL_NAME)
  if (existing) return existing.id

  // Create it if not found
  const created = await gmail.users.labels.create({
    userId: 'me',
    requestBody: {
      name: LABEL_NAME,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
      color: { backgroundColor: '#8e63ce', textColor: '#ffffff' },
    },
  })
  return created.data.id
}

export async function moveEmailToLabel(gmail: any, messageId: string, labelId: string) {
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { addLabelIds: [labelId] },
  })
}

export async function getEmailIdentifiers(): Promise<string[]> {
  await connectDB()
  const settings = await Settings.findOne({})
  const identifiers = settings?.emailIdentifiers
  return identifiers && identifiers.length > 0 ? identifiers : DEFAULT_EMAIL_IDENTIFIERS
}

export async function fetchBankEmails(hoursBack = 24): Promise<
  Array<{ id: string; body: string; subject: string; date: Date }>
> {
  const auth = await getAuthenticatedClient()
  const gmail = google.gmail({ version: 'v1', auth })

  const afterDate = new Date()
  afterDate.setHours(afterDate.getHours() - hoursBack)
  const afterTimestamp = Math.floor(afterDate.getTime() / 1000)

  const identifiers = await getEmailIdentifiers()
  // Build query: from:(email1 OR email2 OR ...) after:timestamp
  const fromQuery = identifiers.map((e) => `from:${e}`).join(' OR ')
  const query = `(${fromQuery}) after:${afterTimestamp}`

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 100,
  })

  const messages = listResponse.data.messages || []
  const emails: Array<{ id: string; body: string; subject: string; date: Date }> = []

  for (const msg of messages) {
    if (!msg.id) continue
    try {
      const msgResponse = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      })

      const headers = msgResponse.data.payload?.headers || []
      const subjectHeader = headers.find((h) => h.name === 'Subject')
      const dateHeader = headers.find((h) => h.name === 'Date')

      const subject = subjectHeader?.value || ''
      const dateStr = dateHeader?.value
      const date = dateStr ? new Date(dateStr) : new Date()

      const body = extractEmailBody(msgResponse.data.payload)

      if (body) {
        emails.push({ id: msg.id, body, subject, date })
      }
    } catch (err) {
      console.error(`Error fetching email ${msg.id}:`, err)
    }
  }

  return emails
}

function extractEmailBody(payload: any): string {
  if (!payload) return ''

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
        if (part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
      }
      const nested = extractEmailBody(part)
      if (nested) return nested
    }
  }

  return ''
}

export async function updateLastFetchTime() {
  await connectDB()
  await Settings.findOneAndUpdate({}, { lastEmailFetch: new Date() }, { upsert: true })
}

export async function getGmailStatus() {
  await connectDB()
  const settings = await Settings.findOne({})
  return {
    connected: !!settings?.gmailRefreshToken,
    email: settings?.gmailEmail || null,
    lastFetch: settings?.lastEmailFetch || null,
  }
}
