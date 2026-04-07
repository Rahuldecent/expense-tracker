'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/dashboard/transactions', label: 'Transactions', icon: '💳', exact: false },
  { href: '/dashboard/expenses', label: 'Expenses', icon: '📝', exact: false },
  { href: '/dashboard/budget', label: 'Budget', icon: '🎯', exact: false },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️', exact: false },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [todayStr, setTodayStr] = useState('')

  useEffect(() => {
    setTodayStr(new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'short',
    }))
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose()
  }, [pathname])

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Backdrop — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'w-64 min-h-screen sidebar-gradient border-r border-slate-800/50 flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-transform duration-300',
          // Mobile: slide in/out; Desktop: always visible
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg group-hover:shadow-violet-500/30 transition-shadow">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">
                Expense<span className="gradient-text">Tracker</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Personal Finance</p>
            </div>
          </Link>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  active
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-lg shadow-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <span
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all',
                    active
                      ? 'bg-violet-600 shadow-md shadow-violet-500/30'
                      : 'bg-slate-800/50 group-hover:bg-slate-700/50'
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Quick Stats */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="glass rounded-xl p-3 mb-4">
            <p className="text-xs text-slate-500 mb-1">Today</p>
            <p className="text-sm font-medium text-white">
              {todayStr || '\u00A0'}
            </p>
          </div>

          {/* User info + sign out */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm group"
          >
            <span className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center group-hover:bg-red-500/20">
              🚪
            </span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
