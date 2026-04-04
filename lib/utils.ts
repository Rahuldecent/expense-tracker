import { type ClassValue, clsx } from 'clsx'
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { CATEGORY_COLORS } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string, formatStr = 'dd MMM yyyy'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return 'Invalid date'
    return format(d, formatStr)
  } catch {
    return 'Invalid date'
  }
}

export function formatRelativeTime(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return 'Unknown'
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#94a3b8'
}

export function detectCategory(merchant: string, description: string = ''): string {
  const text = `${merchant} ${description}`.toLowerCase()

  const rules: { keywords: string[]; category: string }[] = [
    {
      keywords: ['zomato', 'swiggy', 'restaurant', 'cafe', 'food', 'bistro', 'kitchen', 'dhaba', 'hotel', 'eat'],
      category: 'Food & Dining',
    },
    {
      keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'mall', 'store', 'shop', 'meesho', 'nykaa', 'snapdeal'],
      category: 'Shopping',
    },
    {
      keywords: ['uber', 'ola', 'rapido', 'metro', 'fuel', 'petrol', 'diesel', 'cab', 'taxi', 'auto', 'bus', 'train', 'irctc', 'indigo', 'airindia'],
      category: 'Transport',
    },
    {
      keywords: ['electricity', 'water', 'gas', 'internet', 'phone', 'mobile', 'recharge', 'broadband', 'dth', 'airtel', 'jio', 'bsnl', 'vodafone'],
      category: 'Utilities',
    },
    {
      keywords: ['pharmacy', 'hospital', 'medical', 'doctor', 'clinic', 'health', 'medicine', 'apollo', '1mg', 'netmeds', 'pharmeasy'],
      category: 'Healthcare',
    },
    {
      keywords: ['netflix', 'spotify', 'prime', 'hotstar', 'movie', 'cinema', 'pvr', 'inox', 'zee5', 'youtube', 'gaming', 'game', 'steam'],
      category: 'Entertainment',
    },
    {
      keywords: ['bigbasket', 'blinkit', 'zepto', 'grofers', 'grocery', 'supermarket', 'dmart', 'reliance', 'more'],
      category: 'Groceries',
    },
  ]

  for (const rule of rules) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.category
    }
  }

  return 'Others'
}

export function truncate(str: string, maxLength: number): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return months[month - 1] || ''
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
