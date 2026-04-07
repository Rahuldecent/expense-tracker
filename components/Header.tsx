'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your finances' },
  '/dashboard/transactions': { title: 'Transactions', subtitle: 'All your transactions' },
  '/dashboard/expenses': { title: 'Expenses', subtitle: 'Manual expense management' },
  '/dashboard/budget': { title: 'Budget', subtitle: 'Monthly budget tracking' },
  '/dashboard/settings': { title: 'Settings', subtitle: 'App configuration' },
}

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTimeStr(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
      setDateStr(now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))
      const hour = now.getHours()
      setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening')
    }
    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [])

  const pageInfo = PAGE_TITLES[pathname] || { title: 'Dashboard', subtitle: '' }

  return (
    <header className="h-16 glass border-b border-slate-800/50 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      {/* Hamburger + Page title */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          aria-label="Open sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect y="3" width="20" height="2" rx="1" />
            <rect y="9" width="20" height="2" rx="1" />
            <rect y="15" width="20" height="2" rx="1" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-semibold text-white leading-none">{pageInfo.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{pageInfo.subtitle}</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Date/Time */}
        <div className="hidden md:block text-right">
          <p className="text-xs text-slate-400">{dateStr}</p>
          <p className="text-xs text-slate-600">{timeStr}</p>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-8 bg-slate-700/50" />

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">
              {greeting}, Admin
            </p>
            <p className="text-xs text-slate-500">{session?.user?.email}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-white text-sm font-bold shadow-lg">
            A
          </div>
        </div>
      </div>
    </header>
  )
}
