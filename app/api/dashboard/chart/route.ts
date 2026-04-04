import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'daily'

    const now = new Date()
    let chartData: Array<{ label: string; debit: number; credit: number; date: string }> = []

    if (period === 'daily') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const day = subDays(now, i)
        const start = startOfDay(day)
        const end = endOfDay(day)

        const transactions = await Transaction.find({
          date: { $gte: start, $lte: end },
        }).lean()

        const debit = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
        const credit = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)

        chartData.push({
          label: format(day, 'dd MMM'),
          debit: Math.round(debit * 100) / 100,
          credit: Math.round(credit * 100) / 100,
          date: day.toISOString(),
        })
      }
    } else if (period === 'weekly') {
      // Last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })

        const transactions = await Transaction.find({
          date: { $gte: weekStart, $lte: weekEnd },
        }).lean()

        const debit = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
        const credit = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)

        chartData.push({
          label: `W${format(weekStart, 'w')} ${format(weekStart, 'MMM')}`,
          debit: Math.round(debit * 100) / 100,
          credit: Math.round(credit * 100) / 100,
          date: weekStart.toISOString(),
        })
      }
    } else if (period === 'monthly') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i)
        const monthStart = startOfMonth(monthDate)
        const monthEnd = endOfMonth(monthDate)

        const transactions = await Transaction.find({
          date: { $gte: monthStart, $lte: monthEnd },
        }).lean()

        const debit = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
        const credit = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)

        chartData.push({
          label: format(monthDate, 'MMM yyyy'),
          debit: Math.round(debit * 100) / 100,
          credit: Math.round(credit * 100) / 100,
          date: monthStart.toISOString(),
        })
      }
    }

    return NextResponse.json({ chartData, period })
  } catch (error) {
    console.error('GET /api/dashboard/chart error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
