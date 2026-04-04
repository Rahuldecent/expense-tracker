'use client'

import { useEffect, useState, useCallback } from 'react'
import TransactionTable from '@/components/transactions/TransactionTable'
import TransactionFiltersComponent from '@/components/transactions/TransactionFilters'
import AddTransactionModal from '@/components/transactions/AddTransactionModal'
import Button from '@/components/ui/Button'
import { ITransaction, PaginationMeta, TransactionFilters } from '@/types'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchTransactions = useCallback(async (f: TransactionFilters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(f).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== 'all') {
          params.set(k, String(v))
        }
      })

      const res = await fetch(`/api/transactions?${params}`)
      const data = await res.json()
      setTransactions(data.transactions || [])
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 })
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions(filters)
  }, [filters, fetchTransactions])

  const handleFiltersChange = (newFilters: TransactionFilters) => {
    setFilters({ ...newFilters, page: 1, limit: 20 })
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t._id !== id))
    setPagination((prev) => ({ ...prev, total: prev.total - 1 }))
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-sm text-slate-400 mt-1">
            {pagination.total} total transactions
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon="➕">
          Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <TransactionFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Table */}
      <TransactionTable
        transactions={transactions}
        pagination={pagination}
        loading={loading}
        onPageChange={handlePageChange}
        onDelete={handleDelete}
        onRefresh={() => fetchTransactions(filters)}
      />

      {/* Add modal */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => fetchTransactions(filters)}
      />
    </div>
  )
}
