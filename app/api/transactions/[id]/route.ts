import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const transaction = await Transaction.findById(params.id).lean()
    if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('GET /api/transactions/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const body = await request.json()

    const transaction = await Transaction.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean()

    if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('PUT /api/transactions/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const transaction = await Transaction.findByIdAndDelete(params.id)
    if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/transactions/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
