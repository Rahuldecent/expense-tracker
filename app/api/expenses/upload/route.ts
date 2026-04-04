import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'
import { detectCategory } from '@/lib/utils'

// Parse CSV text → array of row objects
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase())

  return lines.slice(1).map((line) => {
    // Handle quoted commas
    const cols: string[] = []
    let inQuote = false
    let cell = ''
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue }
      if (ch === ',' && !inQuote) { cols.push(cell.trim()); cell = ''; continue }
      cell += ch
    }
    cols.push(cell.trim())

    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = cols[i] ?? '' })
    return row
  })
}

// Map flexible column names to our schema fields
function normalizeRow(row: Record<string, string>): {
  amount: number
  type: 'debit' | 'credit'
  category: string
  merchant: string
  description: string
  date: Date
  bankName: string
  referenceNo: string
} | null {
  const get = (...keys: string[]) =>
    keys.map((k) => row[k] || row[k.toLowerCase()] || row[k.replace(/ /g, '_')] || '').find(Boolean) || ''

  const amountStr = get('amount', 'amt', 'transaction amount', 'debit amount', 'credit amount')
  const amount = parseFloat(amountStr.replace(/[^0-9.]/g, ''))
  if (isNaN(amount) || amount <= 0) return null

  const typeStr = get('type', 'transaction type', 'txn type', 'dr/cr').toLowerCase()
  let type: 'debit' | 'credit' = 'debit'
  if (typeStr.includes('credit') || typeStr === 'cr' || typeStr === 'c') type = 'credit'
  else if (typeStr.includes('debit') || typeStr === 'dr' || typeStr === 'd') type = 'debit'
  else {
    // Infer from separate columns
    const debitCol = get('debit', 'withdrawal', 'dr')
    const creditCol = get('credit', 'deposit', 'cr')
    if (creditCol && parseFloat(creditCol.replace(/[^0-9.]/g, '')) > 0) type = 'credit'
    else type = 'debit'
  }

  const dateStr = get('date', 'transaction date', 'txn date', 'value date')
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null

  const merchant = get('merchant', 'payee', 'narration', 'description', 'particulars', 'beneficiary')
  const description = get('description', 'remarks', 'note', 'notes', 'narration', 'particulars')
  const category = get('category', 'cat')
  const bankName = get('bank', 'bank name', 'bank_name')
  const referenceNo = get('reference', 'ref', 'reference no', 'txn id', 'transaction id', 'utr')

  return {
    amount,
    type,
    category: category || detectCategory(merchant, description),
    merchant: merchant || description || '',
    description: description || '',
    date,
    bankName,
    referenceNo,
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const preview = formData.get('preview') === 'true'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      return NextResponse.json({ error: 'Only CSV and Excel files are supported' }, { status: 400 })
    }

    let rows: Record<string, string>[] = []

    if (ext === 'csv') {
      const text = await file.text()
      rows = parseCSV(text)
    } else {
      // Excel parsing using xlsx library
      const buffer = await file.arrayBuffer()
      const XLSX = await import('xlsx')
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
      // Normalize header keys to lowercase
      rows = rows.map((r) =>
        Object.fromEntries(Object.entries(r).map(([k, v]) => [String(k).trim().toLowerCase(), String(v)]))
      )
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'File is empty or could not be parsed' }, { status: 400 })
    }

    const normalized = rows.map(normalizeRow).filter(Boolean) as ReturnType<typeof normalizeRow>[]

    if (normalized.length === 0) {
      return NextResponse.json({
        error: 'No valid rows found. Ensure your file has: date, amount, and type/description columns.',
      }, { status: 400 })
    }

    // Preview mode – return parsed data without saving
    if (preview) {
      return NextResponse.json({
        preview: normalized.slice(0, 10),
        total: normalized.length,
        skipped: rows.length - normalized.length,
      })
    }

    // Bulk insert
    const docs = normalized.map((r) => ({ ...r, source: 'manual' }))
    const inserted = await Transaction.insertMany(docs, { ordered: false })

    return NextResponse.json({
      inserted: inserted.length,
      skipped: rows.length - inserted.length,
      total: rows.length,
    }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/expenses/upload error:', error)
    return NextResponse.json({ error: 'Upload failed: ' + (error.message || 'Unknown error') }, { status: 500 })
  }
}
