'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardHeader, CardContent } from '@/components/ui/Card'
import { formatDate, formatRelativeTime } from '@/lib/utils'

interface GmailStatus {
  connected: boolean
  email: string | null
  lastFetch: string | null
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null)
  const [gmailLoading, setGmailLoading] = useState(true)
  const [fetchingEmails, setFetchingEmails] = useState(false)
  const [fetchResult, setFetchResult] = useState<any>(null)
  const [hoursBack, setHoursBack] = useState(24)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Email identifiers state
  const [identifiers, setIdentifiers] = useState<string[]>(['alerts@hdfcbank.bank.in'])
  const [newIdentifier, setNewIdentifier] = useState('')
  const [savingIdentifiers, setSavingIdentifiers] = useState(false)

  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  useEffect(() => {
    // Check for Gmail callback result
    const gmailSuccess = searchParams.get('gmail_success')
    const gmailError = searchParams.get('gmail_error')
    if (gmailSuccess) {
      setNotification({ type: 'success', message: 'Gmail connected successfully!' })
    } else if (gmailError) {
      setNotification({ type: 'error', message: `Gmail error: ${gmailError}` })
    }
  }, [searchParams])

  useEffect(() => {
    fetchGmailStatus()
  }, [])

  const fetchGmailStatus = async () => {
    setGmailLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setGmailStatus(data.gmail)
        if (data.emailIdentifiers?.length) setIdentifiers(data.emailIdentifiers)
      } else {
        setGmailStatus({ connected: false, email: null, lastFetch: null })
      }
    } catch {
      setGmailStatus({ connected: false, email: null, lastFetch: null })
    } finally {
      setGmailLoading(false)
    }
  }

  const handleAddIdentifier = () => {
    const val = newIdentifier.trim().toLowerCase()
    if (!val || identifiers.includes(val)) { setNewIdentifier(''); return }
    setIdentifiers((prev) => [...prev, val])
    setNewIdentifier('')
  }

  const handleRemoveIdentifier = (email: string) => {
    setIdentifiers((prev) => prev.filter((e) => e !== email))
  }

  const handleSaveIdentifiers = async () => {
    setSavingIdentifiers(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIdentifiers: identifiers }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setNotification({ type: 'success', message: 'Email identifiers saved!' })
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message })
    } finally {
      setSavingIdentifiers(false)
    }
  }

  const handleConnectGmail = () => {
    window.location.href = '/api/gmail/auth'
  }

  const handleFetchEmails = async () => {
    setFetchingEmails(true)
    setFetchResult(null)
    try {
      const res = await fetch('/api/cron/fetch-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hoursBack }),
      })
      const data = await res.json()
      setFetchResult(data)
      if (data.processed !== undefined) {
        setNotification({ type: 'success', message: `Fetched ${data.total} emails, processed ${data.processed} transactions` })
      } else {
        setNotification({ type: 'error', message: data.error || 'Fetch failed' })
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Network error' })
    } finally {
      setFetchingEmails(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (!pwForm.current || !pwForm.newPw) {
      setPwError('Please fill all fields')
      return
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('New passwords do not match')
      return
    }
    if (pwForm.newPw.length < 6) {
      setPwError('Password must be at least 6 characters')
      return
    }

    setPwLoading(true)
    // Password change requires env var update — inform user
    await new Promise((r) => setTimeout(r, 500))
    setPwLoading(false)
    setPwError('')
    setPwSuccess(true)
    setPwForm({ current: '', newPw: '', confirm: '' })
    setNotification({
      type: 'success',
      message: 'To change your password, update the ADMIN_PASSWORD environment variable and restart the server.',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure your expense tracker</p>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <span>{notification.type === 'success' ? '✅' : '❌'}</span>
          <p>{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-auto text-current opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Gmail Integration */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-xl">
              📧
            </div>
            <div>
              <h3 className="font-semibold text-white">Gmail Integration</h3>
              <p className="text-xs text-slate-500 mt-0.5">Connect Gmail to auto-import bank transactions</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${gmailStatus?.connected ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                <div>
                  <p className="text-sm text-white">
                    {gmailStatus?.connected ? 'Connected' : 'Not Connected'}
                  </p>
                  {gmailStatus?.email && (
                    <p className="text-xs text-slate-500">{gmailStatus.email}</p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleConnectGmail}
                variant={gmailStatus?.connected ? 'secondary' : 'primary'}
                size="sm"
              >
                {gmailStatus?.connected ? 'Reconnect' : 'Connect Gmail'}
              </Button>
            </div>

            {/* Last fetch info */}
            {gmailStatus?.lastFetch && (
              <p className="text-xs text-slate-500">
                Last email fetch: {formatRelativeTime(gmailStatus.lastFetch)}
              </p>
            )}

            {/* Cron info */}
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-slate-400">
              <p className="font-medium text-violet-300 mb-1">⏰ Automatic Schedule</p>
              <p>Emails are automatically fetched daily at <strong className="text-white">11:00 PM</strong> (server time).</p>
            </div>

            {/* Manual trigger */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">Manual Email Fetch</p>
                  <p className="text-xs text-slate-500 mt-0.5">Fetch bank emails from the selected period</p>
                </div>
                <Button
                  onClick={handleFetchEmails}
                  loading={fetchingEmails}
                  variant="secondary"
                  size="sm"
                  icon="🔄"
                >
                  Fetch Now
                </Button>
              </div>
              {/* Period selector */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: 'Last 24h', value: 24 },
                  { label: 'Last 3 days', value: 72 },
                  { label: 'Last 7 days', value: 168 },
                  { label: 'Last 30 days', value: 720 },
                  { label: 'Last 90 days', value: 2160 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setHoursBack(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      hoursBack === opt.value
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fetch result */}
            {fetchResult && (
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Total Found', value: fetchResult.total },
                    { label: 'Processed', value: fetchResult.processed, color: 'text-emerald-400' },
                    { label: 'Skipped', value: fetchResult.skipped, color: 'text-amber-400' },
                    { label: 'Failed', value: fetchResult.failed, color: 'text-red-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className={`text-lg font-bold ${stat.color || 'text-white'}`}>{stat.value ?? '—'}</p>
                      <p className="text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Identifiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-xl">📨</div>
            <div>
              <h3 className="font-semibold text-white">Bank Email Identifiers</h3>
              <p className="text-xs text-slate-500 mt-0.5">Only emails from these senders will be fetched</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current identifiers */}
            <div className="space-y-2">
              {identifiers.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No identifiers added yet</p>
              ) : (
                identifiers.map((email) => (
                  <div key={email} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 group">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">✉️</span>
                      <span className="text-sm text-slate-200 font-mono">{email}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveIdentifier(email)}
                      className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add new identifier */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="e.g. alerts@sbi.co.in"
                value={newIdentifier}
                onChange={(e) => setNewIdentifier(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddIdentifier()}
                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 font-mono"
              />
              <Button variant="secondary" size="sm" onClick={handleAddIdentifier} disabled={!newIdentifier.trim()}>
                + Add
              </Button>
            </div>

            {/* Common bank emails hint */}
            <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-3">
              <p className="text-xs text-slate-500 mb-2 font-medium">Common Indian bank sender addresses:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'alerts@hdfcbank.bank.in',
                  'alerts@axisbank.com',
                  'alerts@icicibank.com',
                  'sbialerts@sbi.co.in',
                  'noreply@kotak.com',
                ].filter((e) => !identifiers.includes(e)).map((email) => (
                  <button
                    key={email}
                    onClick={() => setIdentifiers((prev) => [...prev, email])}
                    className="text-xs px-2 py-1 rounded-lg bg-violet-600/10 border border-violet-600/20 text-violet-400 hover:bg-violet-600/20 transition-colors font-mono"
                  >
                    + {email}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSaveIdentifiers}
              loading={savingIdentifiers}
              disabled={identifiers.length === 0}
              className="w-full"
            >
              Save Identifiers
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Parser Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">🔍</div>
            <div>
              <h3 className="font-semibold text-white">Email Parser Rules</h3>
              <p className="text-xs text-slate-500 mt-0.5">Supported Indian bank email formats</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { bank: 'HDFC Bank', pattern: 'Rs. X,XXX.XX has been debited from your account', status: '✅' },
              { bank: 'SBI', pattern: 'debited by Rs X,XXX.XX', status: '✅' },
              { bank: 'ICICI Bank', pattern: 'INR X,XXX.XX debited', status: '✅' },
              { bank: 'Axis Bank', pattern: 'Rs.X,XXX.XX is debited', status: '✅' },
              { bank: 'Kotak Bank', pattern: 'debited Rs. X,XXX.XX', status: '✅' },
              { bank: 'Generic', pattern: 'Any email with debit/credit + INR/Rs amount', status: '⚡' },
            ].map((rule) => (
              <div key={rule.bank} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                <span>{rule.status}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{rule.bank}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{rule.pattern}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Environment variables info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl">🔧</div>
            <div>
              <h3 className="font-semibold text-white">Configuration</h3>
              <p className="text-xs text-slate-500 mt-0.5">Required environment variables</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { key: 'MONGODB_URI', description: 'MongoDB connection string' },
              { key: 'NEXTAUTH_SECRET', description: 'Session encryption secret' },
              { key: 'ADMIN_EMAIL', description: 'Admin login email' },
              { key: 'ADMIN_PASSWORD', description: 'Admin login password' },
              { key: 'GOOGLE_CLIENT_ID', description: 'Google OAuth client ID (for Gmail)' },
              { key: 'GOOGLE_CLIENT_SECRET', description: 'Google OAuth client secret' },
              { key: 'GMAIL_REDIRECT_URI', description: 'OAuth callback URL' },
            ].map((env) => (
              <div key={env.key} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/30">
                <code className="text-xs text-violet-400 font-mono bg-violet-500/10 px-2 py-0.5 rounded">
                  {env.key}
                </code>
                <span className="text-xs text-slate-500">{env.description}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3">
            Set these in your <code className="text-slate-400">.env.local</code> file.
          </p>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-xl">👤</div>
            <div>
              <h3 className="font-semibold text-white">Admin Account</h3>
              <p className="text-xs text-slate-500 mt-0.5">Account management</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Note</p>
              <p className="text-sm text-slate-300">
                To change the admin password, update the <code className="text-violet-400">ADMIN_PASSWORD</code> environment variable in your <code className="text-violet-400">.env.local</code> file and restart the server.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              🚪 Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App info */}
      <div className="text-center text-xs text-slate-600 py-4">
        <p>ExpenseTracker v1.0.0 · Built with Next.js 14, MongoDB, Gmail API</p>
        <p className="mt-1">Cron: Daily at 23:00 (11 PM server time)</p>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
