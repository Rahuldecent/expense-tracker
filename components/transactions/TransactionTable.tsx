'use client'

import { useState } from 'react'
import { ITransaction, PaginationMeta } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CategoryBadge, TypeBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface TransactionTableProps {
  transactions: ITransaction[]
  pagination: PaginationMeta
  loading?: boolean
  onPageChange: (page: number) => void
  onDelete?: (id: string) => void
  onRefresh?: () => void
}

export default function TransactionTable({
  transactions,
  pagination,
  loading,
  onPageChange,
  onDelete,
  onRefresh,
}: TransactionTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      onDelete?.(id)
      onRefresh?.()
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800/50">
          <div className="skeleton w-40 h-5 rounded" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-800/30">
            <div className="skeleton w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <div className="skeleton w-32 h-4 rounded mb-2" />
              <div className="skeleton w-24 h-3 rounded" />
            </div>
            <div className="skeleton w-20 h-5 rounded" />
            <div className="skeleton w-16 h-6 rounded-full" />
            <div className="skeleton w-20 h-8 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  const sourceEmoji = (source: string) => (source === 'email' ? '📧' : '✏️')

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Table header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-800/50 text-xs font-medium text-slate-500 uppercase tracking-wider">
        <div className="col-span-4">Transaction</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-1">Type</div>
        <div className="col-span-2 text-right">Amount</div>
        <div className="col-span-1" />
      </div>

      {/* Rows */}
      {transactions.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          <span className="text-5xl block mb-3">📭</span>
          <p className="text-base">No transactions found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        transactions.map((txn) => (
          <div key={txn._id}>
            <div
              className="flex md:grid md:grid-cols-12 gap-3 md:gap-4 items-center px-4 md:px-6 py-3.5 border-b border-slate-800/30 table-row-hover cursor-pointer"
              onClick={() => setExpandedId(expandedId === txn._id ? null : (txn._id || null))}
            >
              {/* Transaction info */}
              <div className="col-span-4 flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 bg-slate-800/50">
                  {getCategoryEmoji(txn.category)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {txn.merchant || txn.description || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {txn.bankName && <span className="mr-1">{txn.bankName}</span>}
                    {txn.referenceNo && <span className="opacity-60">#{txn.referenceNo}</span>}
                    {!txn.bankName && !txn.referenceNo && txn.description}
                  </p>
                </div>
              </div>

              {/* Category */}
              <div className="col-span-2 hidden md:flex">
                <CategoryBadge category={txn.category} />
              </div>

              {/* Date */}
              <div className="col-span-2 hidden md:block">
                <p className="text-sm text-slate-300">{formatDate(txn.date, 'dd MMM yyyy')}</p>
                <p className="text-xs text-slate-600">{sourceEmoji(txn.source)} {txn.source}</p>
              </div>

              {/* Type */}
              <div className="col-span-1 hidden md:flex">
                <TypeBadge type={txn.type} />
              </div>

              {/* Amount */}
              <div className="col-span-2 text-right flex-shrink-0">
                <p className={`text-sm font-semibold tabular-nums ${txn.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                </p>
                <p className="text-xs text-slate-600 md:hidden">{formatDate(txn.date, 'dd MMM')}</p>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(txn._id!)
                  }}
                  disabled={deletingId === txn._id}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete"
                >
                  {deletingId === txn._id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    '🗑️'
                  )}
                </button>
              </div>
            </div>

            {/* Expanded row */}
            {expandedId === txn._id && (
              <div className="px-6 py-4 bg-slate-800/20 border-b border-slate-800/30 text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Merchant</p>
                    <p className="text-slate-200">{txn.merchant || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Category</p>
                    <CategoryBadge category={txn.category} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Date</p>
                    <p className="text-slate-200">{formatDate(txn.date, 'dd MMM yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Source</p>
                    <p className="text-slate-200">{sourceEmoji(txn.source)} {txn.source}</p>
                  </div>
                  {txn.description && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 mb-1">Description</p>
                      <p className="text-slate-200">{txn.description}</p>
                    </div>
                  )}
                  {txn.referenceNo && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Reference No.</p>
                      <p className="text-slate-200 font-mono text-xs">{txn.referenceNo}</p>
                    </div>
                  )}
                  {txn.bankName && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Bank</p>
                      <p className="text-slate-200">{txn.bankName}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(txn._id!)}
                    loading={deletingId === txn._id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/50">
          <p className="text-sm text-slate-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              ←
            </Button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let page = i + 1
              if (pagination.totalPages > 5) {
                if (pagination.page <= 3) page = i + 1
                else if (pagination.page >= pagination.totalPages - 2) page = pagination.totalPages - 4 + i
                else page = pagination.page - 2 + i
              }
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                    page === pagination.page
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              )
            })}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Food & Dining': '🍔',
    Shopping: '🛍️',
    Transport: '🚗',
    Utilities: '⚡',
    Healthcare: '💊',
    Entertainment: '🎬',
    Groceries: '🛒',
    Others: '💰',
  }
  return map[category] || '💰'
}
