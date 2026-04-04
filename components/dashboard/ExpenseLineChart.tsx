'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartDataPoint, Period } from '@/types'
import { formatCurrency } from '@/lib/utils'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl p-3 border border-slate-700/50 shadow-xl">
        <p className="text-sm font-medium text-slate-300 mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-400 capitalize">{entry.dataKey}:</span>
            <span className="text-white font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

interface ExpenseLineChartProps {
  period?: Period
}

export default function ExpenseLineChart({ period: initialPeriod = 'daily' }: ExpenseLineChartProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/dashboard/chart?period=${period}`)
        const json = await res.json()
        setData(json.chartData || [])
      } catch (err) {
        console.error('Failed to fetch chart data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  const periods: { value: Period; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ]

  // Show every Nth label to avoid overcrowding
  const tickInterval = period === 'daily' ? 4 : 1

  const ChartComponent = chartType === 'line' ? LineChart : BarChart

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">Spending Overview</h3>
          <p className="text-xs text-slate-500 mt-0.5">Income vs Expenses</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Chart type toggle */}
          <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs">
            {(['bar', 'line'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-2.5 py-1.5 capitalize transition-colors ${
                  chartType === type
                    ? 'bg-violet-600 text-white'
                    : 'bg-navy-800 text-slate-400 hover:text-white'
                }`}
              >
                {type === 'bar' ? '📊' : '📈'} {type}
              </button>
            ))}
          </div>
          {/* Period tabs */}
          <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 transition-colors ${
                  period === p.value
                    ? 'bg-violet-600 text-white'
                    : 'bg-navy-800 text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500">
          <span className="text-4xl mb-2">📭</span>
          <p>No transaction data available</p>
          <p className="text-xs mt-1">Add some transactions to see the chart</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          {chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }} />
              <Legend
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
              />
              <Bar dataKey="credit" fill="#10b981" radius={[4, 4, 0, 0]} name="Credit" maxBarSize={40} />
              <Bar dataKey="debit" fill="#ef4444" radius={[4, 4, 0, 0]} name="Debit" maxBarSize={40} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="credit"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#10b981' }}
                name="Credit"
              />
              <Line
                type="monotone"
                dataKey="debit"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#ef4444' }}
                name="Debit"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  )
}
