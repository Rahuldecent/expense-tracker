'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { CategoryData } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface CategoryPieChartProps {
  data: CategoryData[]
  loading?: boolean
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0]
    return (
      <div className="glass rounded-xl p-3 border border-slate-700/50 shadow-xl">
        <p className="text-sm font-medium text-white">{entry.name}</p>
        <p className="text-sm text-slate-300 mt-1">{formatCurrency(entry.value)}</p>
        <p className="text-xs text-slate-500">{entry.payload.percent.toFixed(1)}% of total</p>
      </div>
    )
  }
  return null
}

const CustomLegend = ({ payload }: any) => {
  if (!payload) return null
  return (
    <div className="grid grid-cols-2 gap-1.5 mt-4">
      {payload.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-1.5 text-xs">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400 truncate">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function CategoryPieChart({ data, loading = false }: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const dataWithPercent = data.map((item) => ({
    ...item,
    percent: total > 0 ? (item.value / total) * 100 : 0,
  }))

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">Category Breakdown</h3>
        <p className="text-xs text-slate-500 mt-0.5">Spending by category this month</p>
      </div>

      {loading ? (
        <div className="h-56 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-slate-500">
          <span className="text-4xl mb-2">🥧</span>
          <p className="text-sm">No expense data</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={dataWithPercent}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {dataWithPercent.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center stat */}
          <div className="text-center -mt-2">
            <p className="text-xs text-slate-500">Total Spent</p>
            <p className="text-lg font-bold text-white">{formatCurrency(total)}</p>
          </div>
        </>
      )}
    </div>
  )
}
