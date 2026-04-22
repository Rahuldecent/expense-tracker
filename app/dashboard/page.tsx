'use client'

import { useEffect, useState } from 'react'
import StatsCard from '@/components/dashboard/StatsCard'
import ExpenseLineChart from '@/components/dashboard/ExpenseLineChart'
import CategoryPieChart from '@/components/dashboard/CategoryPieChart'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import BudgetProgress from '@/components/dashboard/BudgetProgress'
import AverageSpend from '@/components/dashboard/AverageSpend'
import { CategoryData, ITransaction } from '@/types'

interface DashboardData {
  totalTransactions: number
  totalDebits: number
  totalCredits: number
  netBalance: number
  categoryBreakdown: CategoryData[]
  recentTransactions: ITransaction[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const [monthName, setMonthName] = useState('')
  useEffect(() => {
    setMonthName(new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }))
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Overview</h1>
          <p className="text-sm text-slate-400 mt-1">{monthName ? `${monthName} — ` : ''}Real-time expense tracking</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Spent (Month)"
          value={data?.totalDebits || 0}
          icon="💸"
          variant="red"
          trendLabel="Debits this month"
          loading={loading}
        />
        <StatsCard
          title="Total Income (Month)"
          value={data?.totalCredits || 0}
          icon="💰"
          variant="green"
          trendLabel="Credits this month"
          loading={loading}
        />
        <StatsCard
          title="Net Balance"
          value={data?.netBalance || 0}
          icon={data?.netBalance !== undefined && data.netBalance >= 0 ? '📈' : '📉'}
          variant={data?.netBalance !== undefined && data.netBalance >= 0 ? 'blue' : 'red'}
          trendLabel="Credits minus debits"
          loading={loading}
        />
        <StatsCard
          title="Transactions"
          value={data?.totalTransactions || 0}
          prefix=""
          suffix=" total"
          icon="🔄"
          variant="purple"
          trendLabel="This month"
          loading={loading}
        />
      </div>

      {/* Average spend */}
      <AverageSpend />

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ExpenseLineChart />
        </div>
        <div>
          <CategoryPieChart
            data={data?.categoryBreakdown || []}
            loading={loading}
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentTransactions
          transactions={data?.recentTransactions || []}
          loading={loading}
        />
        <BudgetProgress />
      </div>
    </div>
  )
}
