import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'

const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7
const EPOCH = new Date(0)

export async function GET() {
  try {
    await connectDB()

    const now = new Date()

    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const twelveWeeksAgo = new Date(now)
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

    const twelveMonthsAgo = new Date(now)
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const [dailyResult, weeklyResult, monthlyResult, yearlyResult] = await Promise.all([
      // Average spend per day (last 30 days)
      Transaction.aggregate([
        { $match: { type: 'debit', date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' },
            },
            total: { $sum: '$amount' },
          },
        },
        { $group: { _id: null, avg: { $avg: '$total' } } },
      ]),

      // Average spend per week (last 12 weeks)
      Transaction.aggregate([
        { $match: { type: 'debit', date: { $gte: twelveWeeksAgo } } },
        {
          $group: {
            _id: { $floor: { $divide: [{ $subtract: ['$date', EPOCH] }, MS_PER_WEEK] } },
            total: { $sum: '$amount' },
          },
        },
        { $group: { _id: null, avg: { $avg: '$total' } } },
      ]),

      // Average spend per month (last 12 months)
      Transaction.aggregate([
        { $match: { type: 'debit', date: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $group: { _id: null, avg: { $avg: '$total' } } },
      ]),

      // Average spend per year (all time)
      Transaction.aggregate([
        { $match: { type: 'debit' } },
        {
          $group: {
            _id: { $year: '$date' },
            total: { $sum: '$amount' },
          },
        },
        { $group: { _id: null, avg: { $avg: '$total' } } },
      ]),
    ])

    return NextResponse.json({
      dailyAvg: Math.round((dailyResult[0]?.avg || 0) * 100) / 100,
      weeklyAvg: Math.round((weeklyResult[0]?.avg || 0) * 100) / 100,
      monthlyAvg: Math.round((monthlyResult[0]?.avg || 0) * 100) / 100,
      yearlyAvg: Math.round((yearlyResult[0]?.avg || 0) * 100) / 100,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
