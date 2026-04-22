import nodemailer from 'nodemailer'
import connectDB from './mongodb'
import Transaction from './models/Transaction'

function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_SENDER_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Food & Dining': '🍽️',
  'Shopping': '🛍️',
  'Transport': '🚗',
  'Utilities': '💡',
  'Healthcare': '💊',
  'Entertainment': '🎬',
  'Groceries': '🛒',
  'Others': '📦',
}

const CATEGORY_COLOR: Record<string, string> = {
  'Food & Dining': '#f59e0b',
  'Shopping': '#3b82f6',
  'Transport': '#10b981',
  'Utilities': '#6366f1',
  'Healthcare': '#ec4899',
  'Entertainment': '#8b5cf6',
  'Groceries': '#14b8a6',
  'Others': '#94a3b8',
}

interface DailySummary {
  totalSpent: number
  totalIncome: number
  txCount: number
  categories: { name: string; total: number }[]
  topTransactions: { merchant: string; amount: number; category: string; type: string }[]
}

async function getDailySummary(): Promise<DailySummary> {
  await connectDB()

  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const [aggregates, topTransactions] = await Promise.all([
    Transaction.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Transaction.find({ date: { $gte: start, $lte: end }, type: 'debit' })
      .sort({ amount: -1 })
      .limit(5)
      .lean(),
  ])

  let totalSpent = 0
  let totalIncome = 0
  let txCount = 0
  const categoryMap: Record<string, number> = {}

  for (const row of aggregates) {
    txCount += row.count
    if (row._id.type === 'debit') {
      totalSpent += row.total
      categoryMap[row._id.category] = (categoryMap[row._id.category] || 0) + row.total
    } else {
      totalIncome += row.total
    }
  }

  const categories = Object.entries(categoryMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)

  return {
    totalSpent,
    totalIncome,
    txCount,
    categories,
    topTransactions: topTransactions.map((t: any) => ({
      merchant: t.merchant || t.description || 'Unknown',
      amount: t.amount,
      category: t.category,
      type: t.type,
    })),
  }
}

function buildEmailHtml(summary: DailySummary, date: string): string {
  const categoryRows = summary.categories.map((c) => {
    const pct = summary.totalSpent > 0 ? Math.round((c.total / summary.totalSpent) * 100) : 0
    const color = CATEGORY_COLOR[c.name] || '#94a3b8'
    const emoji = CATEGORY_EMOJI[c.name] || '📦'
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          <span style="font-size:18px;margin-right:8px;">${emoji}</span>
          <span style="color:#1e293b;font-weight:500;">${c.name}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;">
          <span style="color:#1e293b;font-weight:600;">${formatINR(c.total)}</span>
          <br/>
          <span style="color:#94a3b8;font-size:12px;">${pct}%</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;width:120px;">
          <div style="background:#f1f5f9;border-radius:99px;height:6px;overflow:hidden;">
            <div style="background:${color};width:${pct}%;height:6px;border-radius:99px;"></div>
          </div>
        </td>
      </tr>`
  }).join('')

  const txRows = summary.topTransactions.map((t) => {
    const emoji = CATEGORY_EMOJI[t.category] || '📦'
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          <span style="font-size:16px;margin-right:8px;">${emoji}</span>
          <span style="color:#1e293b;">${t.merchant}</span>
          <br/>
          <span style="color:#94a3b8;font-size:12px;margin-left:24px;">${t.category}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;color:#ef4444;font-weight:600;">
          -${formatINR(t.amount)}
        </td>
      </tr>`
  }).join('')

  const noSpend = summary.totalSpent === 0

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">💰</div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Daily Spend Summary</h1>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:14px;">${date}</p>
          </td>
        </tr>

        <!-- Total spent hero -->
        <tr>
          <td style="background:#ffffff;padding:32px;text-align:center;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            ${noSpend
              ? `<p style="color:#64748b;font-size:18px;margin:0;">🎉 No spending today!</p>`
              : `
            <p style="margin:0 0 4px;color:#94a3b8;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Total Spent Today</p>
            <p style="margin:0;color:#ef4444;font-size:42px;font-weight:800;">${formatINR(summary.totalSpent)}</p>
            <div style="display:inline-flex;gap:24px;margin-top:20px;">
              <div style="text-align:center;padding:12px 20px;background:#f0fdf4;border-radius:10px;">
                <p style="margin:0;color:#22c55e;font-size:18px;font-weight:700;">${formatINR(summary.totalIncome)}</p>
                <p style="margin:4px 0 0;color:#86efac;font-size:12px;">Income</p>
              </div>
              <div style="text-align:center;padding:12px 20px;background:#f8fafc;border-radius:10px;">
                <p style="margin:0;color:#1e293b;font-size:18px;font-weight:700;">${summary.txCount}</p>
                <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Transactions</p>
              </div>
            </div>`
            }
          </td>
        </tr>

        ${summary.categories.length > 0 ? `
        <!-- Category breakdown -->
        <tr>
          <td style="background:#ffffff;padding:0 32px 24px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            <h2 style="margin:0 0 16px;color:#1e293b;font-size:16px;font-weight:700;">Spending by Category</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${categoryRows}
            </table>
          </td>
        </tr>` : ''}

        ${summary.topTransactions.length > 0 ? `
        <!-- Top transactions -->
        <tr>
          <td style="background:#ffffff;padding:0 32px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            <h2 style="margin:0 0 16px;color:#1e293b;font-size:16px;font-weight:700;">Top Transactions</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${txRows}
            </table>
          </td>
        </tr>` : ''}

        <!-- Footer -->
        <tr>
          <td style="background:#1e293b;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
            <p style="margin:0;color:#64748b;font-size:12px;">
              Sent by <strong style="color:#94a3b8;">ExpenseTracker</strong> · Auto-generated daily report
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendDailySpendEmail() {
  const to = process.env.NOTIFY_EMAIL
  const from = process.env.GMAIL_SENDER_EMAIL

  if (!to || !from || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[Mailer] Skipping email — NOTIFY_EMAIL, GMAIL_SENDER_EMAIL or GMAIL_APP_PASSWORD not set')
    return
  }

  const summary = await getDailySummary()
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const html = buildEmailHtml(summary, date)

  const transporter = createTransport()
  await transporter.sendMail({
    from: `"ExpenseTracker" <${from}>`,
    to,
    subject: `💸 Daily Spend: ${formatINR(summary.totalSpent)} — ${date}`,
    html,
  })

  console.log(`[Mailer] Daily summary sent to ${to} — spent ${formatINR(summary.totalSpent)}`)
}
