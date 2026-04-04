'use client'

import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { IBudget, CATEGORIES } from '@/types'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface BudgetWithSpent extends IBudget {
  spent: number
}

export default function BudgetPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    category: CATEGORIES[0] as string,
    amount: '',
  })

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/budget?month=${month}&year=${year}`)
      const data = await res.json()
      setBudgets(data.budgets || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [month, year])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Enter a valid amount')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: form.category, amount: parseFloat(form.amount), month, year }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setShowModal(false)
      setForm({ category: CATEGORIES[0], amount: '' })
      fetchBudgets()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/budget?id=${id}`, { method: 'DELETE' })
      fetchBudgets()
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const totalRemaining = totalBudget - totalSpent

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: getMonthName(i + 1),
  }))

  const yearOptions = [-2, -1, 0, 1].map((offset) => ({
    value: String(now.getFullYear() + offset),
    label: String(now.getFullYear() + offset),
  }))

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return { bar: 'bg-red-500', text: 'text-red-400' }
    if (pct >= 80) return { bar: 'bg-amber-500', text: 'text-amber-400' }
    if (pct >= 60) return { bar: 'bg-yellow-500', text: 'text-yellow-400' }
    return { bar: 'bg-violet-500', text: 'text-violet-400' }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Budget Management</h1>
          <p className="text-sm text-slate-400 mt-1">Set and track monthly spending limits</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32">
            <Select
              value={String(month)}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              options={monthOptions}
            />
          </div>
          <div className="w-24">
            <Select
              value={String(year)}
              onChange={(e) => setYear(parseInt(e.target.value))}
              options={yearOptions}
            />
          </div>
          <Button onClick={() => setShowModal(true)} icon="➕">Add Budget</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Budget', value: totalBudget, color: 'text-violet-400', bg: 'bg-violet-500/10', icon: '🎯' },
          { label: 'Total Spent', value: totalSpent, color: 'text-red-400', bg: 'bg-red-500/10', icon: '💸' },
          { label: 'Remaining', value: totalRemaining, color: totalRemaining >= 0 ? 'text-emerald-400' : 'text-red-400', bg: totalRemaining >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10', icon: totalRemaining >= 0 ? '✅' : '⚠️' },
        ].map((item) => (
          <div key={item.label} className={cn('glass rounded-2xl p-5 flex items-center gap-4')}>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-2xl', item.bg)}>
              {item.icon}
            </div>
            <div>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className={cn('text-xl font-bold mt-0.5', item.color)}>{formatCurrency(item.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      {totalBudget > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-white">Overall Budget Usage</p>
            <p className="text-sm text-slate-400">
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
              <span className="ml-2 text-slate-600">({Math.round((totalSpent / totalBudget) * 100)}%)</span>
            </p>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-1000', getProgressColor(Math.min((totalSpent / totalBudget) * 100, 100)).bar)}
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget list */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/50 flex items-center justify-between">
          <h3 className="font-semibold text-white">
            {getMonthName(month)} {year} Budgets
          </h3>
          <span className="text-xs text-slate-500">{budgets.length} categories</span>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <span className="text-5xl block mb-3">🎯</span>
            <p>No budgets set for {getMonthName(month)} {year}</p>
            <button onClick={() => setShowModal(true)} className="text-violet-400 hover:text-violet-300 text-sm mt-2">
              Add your first budget →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {budgets.map((budget) => {
              const pct = budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0
              const colors = getProgressColor(pct)
              const isOver = budget.spent > budget.amount

              return (
                <div key={budget._id} className="px-6 py-5 group hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryEmoji(budget.category)}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{budget.category}</p>
                        <p className={cn('text-xs mt-0.5', isOver ? 'text-red-400' : 'text-slate-500')}>
                          {isOver
                            ? `Over budget by ${formatCurrency(budget.spent - budget.amount)}`
                            : `${formatCurrency(budget.amount - budget.spent)} remaining`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={cn('text-sm font-semibold', colors.text)}>
                          {formatCurrency(budget.spent)}
                        </p>
                        <p className="text-xs text-slate-600">of {formatCurrency(budget.amount)}</p>
                      </div>
                      <span className="text-sm font-medium text-slate-400">{Math.round(pct)}%</span>
                      <button
                        onClick={() => handleDelete(budget._id!)}
                        disabled={deletingId === budget._id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-1000', colors.bar)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Budget Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Budget" size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
          )}
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Input
            label={`Monthly Budget (${getMonthName(month)} ${year})`}
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter amount..."
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            icon="₹"
            required
          />
          <p className="text-xs text-slate-500">
            If a budget already exists for this category and month, it will be updated.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>Save Budget</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Food & Dining': '🍔', Shopping: '🛍️', Transport: '🚗', Utilities: '⚡',
    Healthcare: '💊', Entertainment: '🎬', Groceries: '🛒', Others: '💰',
  }
  return map[category] || '💰'
}
