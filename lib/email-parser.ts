import { ParsedTransaction } from '@/types'
import { detectCategory } from './utils'

interface BankPattern {
  bankName: string
  debitPatterns: RegExp[]
  creditPatterns: RegExp[]
  amountPattern: RegExp
  merchantPatterns: RegExp[]
  refPatterns: RegExp[]
  datePatterns: RegExp[]
}

const BANK_PATTERNS: BankPattern[] = [
  {
    bankName: 'HDFC',
    debitPatterns: [
      /Rs\.?\s*[\d,]+\.?\d*\s*has been debited/i,
      /debited from your HDFC/i,
      /debited.*?Rs\.?\s*[\d,]+\.?\d*/i,
      /INR\s*[\d,]+\.?\d*.*?debited/i,
    ],
    creditPatterns: [
      /Rs\.?\s*[\d,]+\.?\d*\s*has been credited/i,
      /credited.*?Rs\.?\s*[\d,]+\.?\d*/i,
    ],
    amountPattern: /Rs\.?\s*([\d,]+\.?\d*)/i,
    merchantPatterns: [
      /to\s+([A-Za-z0-9\s&._@-]+?)\s+on\s+\d/i,
      /at\s+([A-Za-z0-9\s&._@-]+?)(?:\s+on|\s+dated|\.|$)/i,
      /merchant[:\s]+([A-Za-z0-9\s&._@-]+?)(?:\s+on|\s+dated|\.|$)/i,
      /towards\s+([A-Za-z0-9\s&._@-]+?)(?:\s+on|\s+dated|\.|$)/i,
    ],
    refPatterns: [
      /UPI\s+transaction\s+reference\s+number\s+is\s+(\d+)/i,
      /ref(?:erence)?\.?\s*(?:no\.?|number)?\s*(?:is\s*)?:?\s*([A-Z0-9]+)/i,
      /transaction\s+(?:id|ref(?:erence)?)[:\s]+([A-Z0-9]+)/i,
    ],
    datePatterns: [
      /on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /dated\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /(\d{1,2}[/-]\d{1,2}[/-]\d{4})/,
    ],
  },
  {
    bankName: 'SBI',
    debitPatterns: [
      /debited\s+by\s+Rs\.?\s*[\d,]+\.?\d*/i,
      /Rs\.?\s*[\d,]+\.?\d*.*?debited\s+from/i,
      /your\s+a\/c.*?debited\s+with\s+INR\s*[\d,]+/i,
    ],
    creditPatterns: [
      /credited\s+by\s+Rs\.?\s*[\d,]+\.?\d*/i,
      /Rs\.?\s*[\d,]+\.?\d*.*?credited\s+to/i,
    ],
    amountPattern: /(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i,
    merchantPatterns: [
      /(?:at|to|from)\s+([A-Za-z0-9\s&._-]+?)(?:\s+on|\s+ref|\s+dated|\.|$)/i,
      /merchant\s*:?\s*([A-Za-z0-9\s&._-]+?)(?:\s+on|\s*ref|\.|$)/i,
    ],
    refPatterns: [
      /ref\.?\s*(?:no\.?\s*)?([A-Z0-9]+)/i,
      /utr[:\s]+([A-Z0-9]+)/i,
    ],
    datePatterns: [
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
      /on\s+(\d{1,2}\s+\w+\s+\d{4})/i,
    ],
  },
  {
    bankName: 'ICICI',
    debitPatterns: [
      /INR\s*[\d,]+\.?\d*\s*debited/i,
      /debited.*?INR\s*[\d,]+\.?\d*/i,
      /Rs\.?\s*[\d,]+\.?\d*\s*has\s+been\s+debited/i,
    ],
    creditPatterns: [
      /INR\s*[\d,]+\.?\d*\s*credited/i,
      /credited.*?INR\s*[\d,]+\.?\d*/i,
    ],
    amountPattern: /(?:INR|Rs\.?)\s*([\d,]+\.?\d*)/i,
    merchantPatterns: [
      /at\s+([A-Za-z0-9\s&._-]+?)(?:\s+on|\s+dated|\s+Info|\.|$)/i,
      /(?:UPI-|to\s+)([A-Za-z0-9\s&._@-]+?)(?:\s+on|\s+dated|\.|$)/i,
    ],
    refPatterns: [
      /ref\.?\s*no\.?\s*:?\s*([A-Z0-9]+)/i,
      /rrn[:\s]+([0-9]+)/i,
    ],
    datePatterns: [
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    ],
  },
  {
    bankName: 'Axis',
    debitPatterns: [
      /Rs\.?\s*[\d,]+\.?\d*\s*is\s+debited/i,
      /debited.*?Rs\.?\s*[\d,]+\.?\d*/i,
      /INR\s*[\d,]+\.?\d*.*?debited/i,
    ],
    creditPatterns: [
      /Rs\.?\s*[\d,]+\.?\d*\s*is\s+credited/i,
      /credited.*?Rs\.?\s*[\d,]+\.?\d*/i,
    ],
    amountPattern: /(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i,
    merchantPatterns: [
      /at\s+([A-Za-z0-9\s&._-]+?)(?:\s+on|\s+dated|\.|$)/i,
      /(?:to|from)\s+([A-Za-z0-9\s&._-]+?)(?:\s+on|\s+dated|\.|$)/i,
    ],
    refPatterns: [
      /ref\.?\s*([A-Z0-9]+)/i,
      /transaction\s+ref[:\s]+([A-Z0-9]+)/i,
    ],
    datePatterns: [
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    ],
  },
  {
    bankName: 'Kotak',
    debitPatterns: [
      /debited\s+Rs\.?\s*[\d,]+\.?\d*/i,
      /Rs\.?\s*[\d,]+\.?\d*.*?debited/i,
    ],
    creditPatterns: [
      /credited\s+Rs\.?\s*[\d,]+\.?\d*/i,
      /Rs\.?\s*[\d,]+\.?\d*.*?credited/i,
    ],
    amountPattern: /(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i,
    merchantPatterns: [
      /at\s+([A-Za-z0-9\s&._-]+?)(?:\s+on|\s+dated|\.|$)/i,
      /towards\s+([A-Za-z0-9\s&._-]+?)(?:\s+on|\s+dated|\.|$)/i,
    ],
    refPatterns: [
      /ref\.?\s*(?:no\.?\s*)?([A-Z0-9]+)/i,
    ],
    datePatterns: [
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    ],
  },
]

function parseAmount(text: string, pattern: RegExp): number {
  const match = text.match(pattern)
  if (!match || !match[1]) return 0
  const cleaned = match[1].replace(/,/g, '')
  return parseFloat(cleaned) || 0
}

function parseDate(text: string, patterns: RegExp[]): Date {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const dateStr = match[1]
      // Try multiple date formats
      const formats = [
        // DD/MM/YYYY or DD-MM-YYYY
        /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
        // DD/MM/YY or DD-MM-YY
        /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/,
      ]

      for (const fmt of formats) {
        const m = dateStr.match(fmt)
        if (m) {
          const day = parseInt(m[1])
          const month = parseInt(m[2]) - 1
          let year = parseInt(m[3])
          if (year < 100) year += 2000
          const d = new Date(year, month, day)
          if (!isNaN(d.getTime())) return d
        }
      }

      // Fallback - try native parsing
      const d = new Date(dateStr)
      if (!isNaN(d.getTime())) return d
    }
  }
  return new Date()
}

function parseMerchant(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim().substring(0, 100)
    }
  }
  return ''
}

function parseRef(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return ''
}

export function parseEmailBody(
  emailBody: string,
  emailId: string,
  emailDate?: Date
): ParsedTransaction | null {
  const cleanBody = emailBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

  for (const bank of BANK_PATTERNS) {
    let type: 'debit' | 'credit' | null = null

    // Check for debit
    for (const pattern of bank.debitPatterns) {
      if (pattern.test(cleanBody)) {
        type = 'debit'
        break
      }
    }

    // Check for credit
    if (!type) {
      for (const pattern of bank.creditPatterns) {
        if (pattern.test(cleanBody)) {
          type = 'credit'
          break
        }
      }
    }

    if (!type) continue

    const amount = parseAmount(cleanBody, bank.amountPattern)
    if (amount <= 0) continue

    const merchant = parseMerchant(cleanBody, bank.merchantPatterns)
    const referenceNo = parseRef(cleanBody, bank.refPatterns)
    const date = emailDate || parseDate(cleanBody, bank.datePatterns)

    return {
      amount,
      type,
      merchant: merchant || bank.bankName + ' Transaction',
      date,
      rawEmail: emailBody,
      bankName: bank.bankName,
      referenceNo,
      emailId,
    }
  }

  // Generic fallback parser
  const genericDebit = /(?:debited|debit|payment|spent).*?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i
  const genericCredit = /(?:credited|credit|received|refund).*?(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i
  const genericAmount = /(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i

  let type: 'debit' | 'credit' | null = null
  let amountMatch: RegExpMatchArray | null = null

  if (genericDebit.test(cleanBody)) {
    type = 'debit'
    amountMatch = cleanBody.match(genericDebit)
  } else if (genericCredit.test(cleanBody)) {
    type = 'credit'
    amountMatch = cleanBody.match(genericCredit)
  }

  if (!type) return null

  const amountStr = amountMatch?.[1] || cleanBody.match(genericAmount)?.[1] || '0'
  const amount = parseFloat(amountStr.replace(/,/g, '')) || 0
  if (amount <= 0) return null

  return {
    amount,
    type,
    merchant: 'Bank Transaction',
    date: emailDate || new Date(),
    rawEmail: emailBody,
    bankName: 'Unknown',
    referenceNo: '',
    emailId,
  }
}

export function enrichTransaction(parsed: ParsedTransaction): ParsedTransaction & { category: string } {
  const category = detectCategory(parsed.merchant)
  return { ...parsed, category }
}
