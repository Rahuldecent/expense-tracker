'use client'

import Link from 'next/link'
import { ITransaction } from '@/types'
import { formatCurrency, formatDate, getCategoryColor } from '@/lib/utils'
import { CategoryBadge } from '@/components/ui/Badge'

interface RecentTransactionsProps {
  transactions: ITransaction[]
  loading?: boolean
}

export default function RecentTransactions({ transactions, loading = false }: RecentTransactionsProps) {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton w-40 h-5 rounded" />
          <div className="skeleton w-20 h-5 rounded" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-800/50 last:border-0">
            <div className="skeleton w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <div className="skeleton w-32 h-4 rounded mb-1.5" />
              <div className="skeleton w-20 h-3 rounded" />
            </div>
            <div className="skeleton w-20 h-5 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">Recent Transactions</h3>
          <p className="text-xs text-slate-500 mt-0.5">Latest activity</p>
        </div>
        <Link
          href="/dashboard/transactions"
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
        >
          View all →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="py-10 text-center text-slate-500">
          <span className="text-4xl block mb-2">📭</span>
          <p className="text-sm">No transactions yet</p>
          <Link
            href="/dashboard/expenses"
            className="text-xs text-violet-400 hover:text-violet-300 mt-2 inline-block"
          >
            Add your first transaction →
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {transactions.map((txn) => (
            <div
              key={txn._id}
              className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-800/30 transition-colors group"
            >
              {/* Category icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: getCategoryColor(txn.category) + '20' }}
              >
                {getCategoryEmoji(txn.category)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {txn.merchant || txn.description || 'Unknown'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">{formatDate(txn.date, 'dd MMM')}</span>
                  <CategoryBadge category={txn.category} />
                </div>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    txn.type === 'credit' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                </p>
                <p className="text-xs text-slate-600 capitalize">{txn.source}</p>
              </div>
            </div>
          ))}
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
