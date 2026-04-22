'use client'

import { useEffect, useState } from 'react'
import StatsCard from './StatsCard'

interface Averages {
  dailyAvg: number
  weeklyAvg: number
  monthlyAvg: number
  yearlyAvg: number
}

export default function AverageSpend() {
  const [data, setData] = useState<Averages | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/averages')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Average Spend</h2>
        <div className="flex-1 h-px bg-slate-700/50" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Avg per Day"
          value={data?.dailyAvg || 0}
          icon="☀️"
          variant="red"
          trendLabel="Last 30 days"
          loading={loading}
        />
        <StatsCard
          title="Avg per Week"
          value={data?.weeklyAvg || 0}
          icon="📅"
          variant="blue"
          trendLabel="Last 12 weeks"
          loading={loading}
        />
        <StatsCard
          title="Avg per Month"
          value={data?.monthlyAvg || 0}
          icon="🗓️"
          variant="purple"
          trendLabel="Last 12 months"
          loading={loading}
        />
        <StatsCard
          title="Avg per Year"
          value={data?.yearlyAvg || 0}
          icon="📆"
          variant="green"
          trendLabel="All time"
          loading={loading}
        />
      </div>
    </div>
  )
}
