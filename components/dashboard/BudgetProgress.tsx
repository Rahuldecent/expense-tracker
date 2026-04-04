'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IBudget } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface BudgetWithSpent extends IBudget {
  spent: number
}

export default function BudgetProgress() {
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const now = new Date()
        const res = await fetch(
          `/api/budget?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
        )
        const data = await res.json()
        setBudgets(data.budgets || [])
      } catch (err) {
        console.error('Failed to fetch budgets:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBudgets()
  }, [])

  const getProgressColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500'
    if (pct >= 70) return 'bg-amber-500'
    return 'bg-violet-500'
  }

  const getStatusEmoji = (pct: number) => {
    if (pct >= 100) return '🔴'
    if (pct >= 80) return '🟡'
    return '🟢'
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">Budget Tracker</h3>
          <p className="text-xs text-slate-500 mt-0.5">This month's spending limits</p>
        </div>
        <Link
          href="/dashboard/budget"
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
        >
          Manage →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1.5">
                <div className="skeleton w-24 h-4 rounded" />
                <div className="skeleton w-16 h-4 rounded" />
              </div>
              <div className="skeleton w-full h-2 rounded-full" />
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="py-8 text-center text-slate-500">
          <span className="text-4xl block mb-2">🎯</span>
          <p className="text-sm">No budgets set</p>
          <Link
            href="/dashboard/budget"
            className="text-xs text-violet-400 hover:text-violet-300 mt-2 inline-block"
          >
            Set your first budget →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.slice(0, 5).map((budget) => {
            const pct = Math.min((budget.spent / budget.amount) * 100, 100)
            const remaining = budget.amount - budget.spent

            return (
              <div key={budget._id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span>{getStatusEmoji(pct)}</span>
                    <span className="text-sm text-slate-300">{budget.category}</span>
                  </div>
                  <div className="text-right">
                    <span className={cn('text-xs font-medium', pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-amber-400' : 'text-slate-400')}>
                      {formatCurrency(budget.spent)}
                    </span>
                    <span className="text-xs text-slate-600"> / {formatCurrency(budget.amount)}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-1000', getProgressColor(pct))}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {remaining >= 0
                    ? `${formatCurrency(remaining)} remaining`
                    : `${formatCurrency(Math.abs(remaining))} over budget`}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
