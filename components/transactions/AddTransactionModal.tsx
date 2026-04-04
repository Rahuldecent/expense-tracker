'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Input, { Select } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { CATEGORIES } from '@/types'
import { format } from 'date-fns'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  amount: string
  type: 'debit' | 'credit'
  category: string
  merchant: string
  description: string
  date: string
  bankName: string
  referenceNo: string
}

const getInitialForm = (): FormData => ({
  amount: '',
  type: 'debit',
  category: '',
  merchant: '',
  description: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  bankName: '',
  referenceNo: '',
})

export default function AddTransactionModal({ isOpen, onClose, onSuccess }: AddTransactionModalProps) {
  const [form, setForm] = useState<FormData>(getInitialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create transaction')
      }

      setForm(getInitialForm())
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setForm(getInitialForm())
    setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Transaction" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
            <div className="flex rounded-xl overflow-hidden border border-slate-700">
              {(['debit', 'credit'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleChange('type', t)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    form.type === t
                      ? t === 'debit'
                        ? 'bg-red-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'bg-navy-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {t === 'debit' ? '↓ Debit' : '↑ Credit'}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Amount (₹)"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            icon="₹"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Merchant / Payee"
            placeholder="e.g. Zomato, Amazon"
            value={form.merchant}
            onChange={(e) => handleChange('merchant', e.target.value)}
            icon="🏪"
          />
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={[
              { value: '', label: 'Auto-detect' },
              ...CATEGORIES.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>

        <Input
          label="Description"
          placeholder="Optional notes"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          icon="📝"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
            required
          />
          <Input
            label="Bank Name"
            placeholder="e.g. HDFC, SBI"
            value={form.bankName}
            onChange={(e) => handleChange('bankName', e.target.value)}
            icon="🏦"
          />
        </div>

        <Input
          label="Reference No."
          placeholder="Transaction reference (optional)"
          value={form.referenceNo}
          onChange={(e) => handleChange('referenceNo', e.target.value)}
          icon="#"
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={loading}>
            Add Transaction
          </Button>
        </div>
      </form>
    </Modal>
  )
}
