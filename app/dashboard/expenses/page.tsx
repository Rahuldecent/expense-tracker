'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Input, { Select } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { CategoryBadge, TypeBadge } from '@/components/ui/Badge'
import { ITransaction, CATEGORIES } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { format } from 'date-fns'
import UploadExpensesModal from '@/components/expenses/UploadExpensesModal'

const getInitialForm = () => ({
  amount: '',
  type: 'debit' as 'debit' | 'credit',
  category: '',
  merchant: '',
  description: '',
  date: format(new Date(), 'yyyy-MM-dd'),
})

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ITransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(getInitialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showUpload, setShowUpload] = useState(false)
  const limit = 15

  const fetchExpenses = async (p = page) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/expenses?page=${p}&limit=${limit}`)
      const data = await res.json()
      setExpenses(data.expenses || [])
      setTotal(data.pagination?.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [page])

  const openAdd = () => {
    setEditingId(null)
    setForm(getInitialForm())
    setError('')
    setShowModal(true)
  }

  const openEdit = (expense: ITransaction) => {
    setEditingId(expense._id || null)
    setForm({
      amount: String(expense.amount),
      type: expense.type,
      category: expense.category,
      merchant: expense.merchant,
      description: expense.description,
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Enter a valid amount')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      let res
      if (editingId) {
        res = await fetch(`/api/transactions/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      if (!res.ok) throw new Error((await res.json()).error)
      setShowModal(false)
      fetchExpenses(1)
      setPage(1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      fetchExpenses()
    } catch (err) {
      console.error(err)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manual Expenses</h1>
          <p className="text-sm text-slate-400 mt-1">{total} manually entered expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowUpload(true)} icon="⬆">Upload File</Button>
          <Button onClick={openAdd} icon="➕">Add Expense</Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-800/50 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">Merchant</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1 text-right">Amount</div>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <span className="text-5xl block mb-3">📝</span>
            <p>No manual expenses yet</p>
            <button onClick={openAdd} className="text-violet-400 hover:text-violet-300 text-sm mt-2">
              Add your first expense →
            </button>
          </div>
        ) : (
          expenses.map((exp) => (
            <div
              key={exp._id}
              className="relative grid grid-cols-12 gap-4 items-center px-6 py-3.5 border-b border-slate-800/30 table-row-hover group"
            >
              <div className="col-span-3 flex items-center gap-2">
                <span className="text-lg">{getCategoryEmoji(exp.category)}</span>
                <span className="text-sm text-white truncate">{exp.merchant || '—'}</span>
              </div>
              <div className="col-span-2">
                <CategoryBadge category={exp.category} />
              </div>
              <div className="col-span-3">
                <p className="text-sm text-slate-400 truncate">{exp.description || '—'}</p>
              </div>
              <div className="col-span-1">
                <TypeBadge type={exp.type} />
              </div>
              <div className="col-span-2">
                <p className="text-sm text-slate-300">{formatDate(exp.date, 'dd MMM yyyy')}</p>
              </div>
              <div className="col-span-1 flex items-center justify-end gap-2">
                <p className={`text-sm font-semibold ${exp.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {exp.type === 'credit' ? '+' : '-'}{formatCurrency(exp.amount)}
                </p>
              </div>
              {/* Hover actions */}
              <div className="col-span-12 md:col-span-0 flex justify-end gap-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-6">
                <button
                  onClick={() => openEdit(exp)}
                  className="text-xs px-2 py-1 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/40 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(exp._id!)}
                  className="text-xs px-2 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/50">
            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
              <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadExpensesModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={() => { fetchExpenses(1); setPage(1) }}
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Expense' : 'Add Expense'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
              <div className="flex rounded-xl overflow-hidden border border-slate-700">
                {(['debit', 'credit'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${form.type === t ? (t === 'debit' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white') : 'bg-navy-800 text-slate-400 hover:text-white'}`}>
                    {t === 'debit' ? '↓ Debit' : '↑ Credit'}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Amount (₹)" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} icon="₹" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Merchant" placeholder="Zomato, Amazon..." value={form.merchant} onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))} icon="🏪" />
            <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              options={[{ value: '', label: 'Auto-detect' }, ...CATEGORIES.map(c => ({ value: c, label: c }))]} />
          </div>
          <Input label="Description" placeholder="Optional notes..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} icon="📝" />
          <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>{editingId ? 'Update' : 'Add'} Expense</Button>
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
