import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'
import { detectCategory } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const filter: Record<string, any> = {}

    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        filter.date.$lte = end
      }
    }

    if (category && category !== 'all') filter.category = category
    if (type && type !== 'all') filter.type = type
    if (search) {
      filter.$or = [
        { merchant: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { referenceNo: { $regex: search, $options: 'i' } },
      ]
    }

    const total = await Transaction.countDocuments(filter)
    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { amount, type, category, merchant, description, date, bankName, referenceNo } = body

    if (!amount || !type || !date) {
      return NextResponse.json({ error: 'Amount, type, and date are required' }, { status: 400 })
    }

    const resolvedCategory = category || detectCategory(merchant || '', description || '')

    const transaction = await Transaction.create({
      amount: parseFloat(amount),
      type,
      category: resolvedCategory,
      merchant: merchant || '',
      description: description || '',
      date: new Date(date),
      source: 'manual',
      bankName: bankName || '',
      referenceNo: referenceNo || '',
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('POST /api/transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
