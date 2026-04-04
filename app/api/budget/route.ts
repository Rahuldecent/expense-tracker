import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Budget from '@/lib/models/Budget'
import Transaction from '@/lib/models/Transaction'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = new URL(request.url)
    const now = new Date()
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()))

    const budgets = await Budget.find({ month, year }).lean()

    // Get actual spending for each category
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    const spending = await Transaction.aggregate([
      {
        $match: {
          type: 'debit',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' },
        },
      },
    ])

    const spendingMap: Record<string, number> = {}
    spending.forEach((s) => {
      spendingMap[s._id] = Math.round(s.spent * 100) / 100
    })

    const budgetsWithSpending = budgets.map((b) => ({
      ...b,
      spent: spendingMap[b.category] || 0,
    }))

    return NextResponse.json({ budgets: budgetsWithSpending, month, year })
  } catch (error) {
    console.error('GET /api/budget error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const body = await request.json()
    const { category, amount, month, year } = body

    if (!category || !amount || !month || !year) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    const budget = await Budget.findOneAndUpdate(
      { category, month, year },
      { amount: parseFloat(amount) },
      { upsert: true, new: true }
    )

    return NextResponse.json({ budget }, { status: 201 })
  } catch (error) {
    console.error('POST /api/budget error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await Budget.findByIdAndDelete(id)
    return NextResponse.json({ message: 'Budget deleted' })
  } catch (error) {
    console.error('DELETE /api/budget error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
