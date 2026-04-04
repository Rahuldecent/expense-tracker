'use client'

import { useState } from 'react'
import Input, { Select } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { CATEGORIES } from '@/types'
import { TransactionFilters } from '@/types'

interface TransactionFiltersProps {
  filters: TransactionFilters
  onFiltersChange: (filters: TransactionFilters) => void
}

export default function TransactionFiltersComponent({ filters, onFiltersChange }: TransactionFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters)
  const [expanded, setExpanded] = useState(false)

  const handleChange = (key: keyof TransactionFilters, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
  }

  const handleReset = () => {
    const reset: TransactionFilters = { page: 1 }
    setLocalFilters(reset)
    onFiltersChange(reset)
  }

  const hasActiveFilters =
    localFilters.startDate ||
    localFilters.endDate ||
    (localFilters.category && localFilters.category !== 'all') ||
    (localFilters.type && localFilters.type !== 'all') ||
    localFilters.search

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-48">
          <Input
            icon="🔍"
            placeholder="Search merchant, description..."
            value={localFilters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
        </div>

        {/* Type filter */}
        <div className="w-36">
          <Select
            value={localFilters.type || 'all'}
            onChange={(e) => handleChange('type', e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'debit', label: '↓ Debit' },
              { value: 'credit', label: '↑ Credit' },
            ]}
          />
        </div>

        {/* Toggle more filters */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setExpanded((prev) => !prev)}
          icon={expanded ? '▲' : '▼'}
        >
          Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-violet-500" />}
        </Button>

        <Button size="sm" onClick={handleApply}>
          Apply
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Clear
          </Button>
        )}
      </div>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700/50">
          <Input
            label="From Date"
            type="date"
            value={localFilters.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
          <Input
            label="To Date"
            type="date"
            value={localFilters.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
          <Select
            label="Category"
            value={localFilters.category || 'all'}
            onChange={(e) => handleChange('category', e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...CATEGORIES.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>
      )}
    </div>
  )
}
