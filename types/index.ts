export interface ITransaction {
  _id?: string
  amount: number
  type: 'debit' | 'credit'
  category: string
  merchant: string
  description: string
  date: Date | string
  source: 'email' | 'manual'
  bankName?: string
  referenceNo?: string
  rawEmail?: string
  emailId?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface IBudget {
  _id?: string
  category: string
  amount: number
  month: number
  year: number
  spent?: number
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface ISettings {
  _id?: string
  gmailAccessToken?: string
  gmailRefreshToken?: string
  gmailTokenExpiry?: Date | string
  gmailEmail?: string
  lastEmailFetch?: Date | string
  emailParserRules?: IParserRule[]
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface IParserRule {
  bankName: string
  debitPattern: string
  creditPattern: string
  amountGroup: number
  merchantGroup?: number
  refGroup?: number
  enabled: boolean
}

export interface ParsedTransaction {
  amount: number
  type: 'debit' | 'credit'
  merchant: string
  date: Date
  rawEmail: string
  bankName: string
  referenceNo: string
  emailId: string
}

export interface DashboardStats {
  totalTransactions: number
  totalDebits: number
  totalCredits: number
  netBalance: number
  transactionCount: number
}

export interface ChartDataPoint {
  label: string
  debit: number
  credit: number
  date: string
}

export interface CategoryData {
  name: string
  value: number
  color: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface TransactionFilters {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  category?: string
  type?: string
  search?: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transport',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Groceries',
  'Others',
] as const

export type Category = typeof CATEGORIES[number]

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#f59e0b',
  Shopping: '#3b82f6',
  Transport: '#10b981',
  Utilities: '#6366f1',
  Healthcare: '#ec4899',
  Entertainment: '#8b5cf6',
  Groceries: '#14b8a6',
  Others: '#94a3b8',
}
