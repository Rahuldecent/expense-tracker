'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  icon: string
  trend?: number
  trendLabel?: string
  variant?: 'purple' | 'green' | 'red' | 'blue'
  loading?: boolean
}

function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number>()
  const startTimeRef = useRef<number>()

  useEffect(() => {
    startTimeRef.current = undefined
    const start = 0
    const end = target

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // cubic ease out
      setCount(Math.floor(start + (end - start) * eased))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setCount(end)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return count
}

export default function StatsCard({
  title,
  value,
  prefix = '₹',
  suffix = '',
  icon,
  trend,
  trendLabel,
  variant = 'purple',
  loading = false,
}: StatsCardProps) {
  const animatedValue = useCountUp(value, 1200)

  const variantConfig = {
    purple: {
      iconBg: 'from-violet-600 to-violet-800',
      iconShadow: 'shadow-violet-500/30',
      glow: 'hover:shadow-violet-500/10',
      accent: 'text-violet-400',
    },
    green: {
      iconBg: 'from-emerald-600 to-emerald-800',
      iconShadow: 'shadow-emerald-500/30',
      glow: 'hover:shadow-emerald-500/10',
      accent: 'text-emerald-400',
    },
    red: {
      iconBg: 'from-red-600 to-red-800',
      iconShadow: 'shadow-red-500/30',
      glow: 'hover:shadow-red-500/10',
      accent: 'text-red-400',
    },
    blue: {
      iconBg: 'from-blue-600 to-blue-800',
      iconShadow: 'shadow-blue-500/30',
      glow: 'hover:shadow-blue-500/10',
      accent: 'text-blue-400',
    },
  }

  const config = variantConfig[variant]

  const formatDisplayValue = (v: number) => {
    if (Math.abs(v) >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`
    if (Math.abs(v) >= 100000) return `${(v / 100000).toFixed(1)}L`
    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}K`
    return v.toFixed(0)
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton w-16 h-5 rounded-full" />
        </div>
        <div className="skeleton w-24 h-7 rounded mb-2" />
        <div className="skeleton w-20 h-4 rounded" />
      </div>
    )
  }

  return (
    <div className={cn('glass rounded-2xl p-6 card-hover hover:shadow-lg', config.glow)}>
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-lg',
            config.iconBg,
            config.iconShadow
          )}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              trend >= 0
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-red-400 bg-red-500/10'
            )}
          >
            <span>{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="animate-count">
        <p className="text-2xl font-bold text-white tabular-nums">
          {value < 0 ? '-' : ''}{prefix}{formatDisplayValue(Math.abs(animatedValue))}{suffix}
        </p>
        <p className="text-sm text-slate-400 mt-1">{title}</p>
        {trendLabel && (
          <p className={cn('text-xs mt-1', config.accent)}>{trendLabel}</p>
        )}
      </div>
    </div>
  )
}
