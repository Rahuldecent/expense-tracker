import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'
import { CATEGORY_COLORS } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // This month stats
    const monthlyTransactions = await Transaction.find({
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).lean()

    const totalDebits = monthlyTransactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalCredits = monthlyTransactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)

    const netBalance = totalCredits - totalDebits
    const totalTransactions = monthlyTransactions.length

    // Category breakdown for pie chart
    const categoryMap: Record<string, number> = {}
    monthlyTransactions
      .filter((t) => t.type === 'debit')
      .forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount
      })

    const categoryBreakdown = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: CATEGORY_COLORS[name] || '#94a3b8',
    }))

    // Recent 10 transactions
    const recentTransactions = await Transaction.find({})
      .sort({ date: -1 })
      .limit(10)
      .lean()

    return NextResponse.json({
      totalTransactions,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      netBalance: Math.round(netBalance * 100) / 100,
      categoryBreakdown,
      recentTransactions,
    })
  } catch (error) {
    console.error('GET /api/dashboard/stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
