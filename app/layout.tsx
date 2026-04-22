import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ExpenseTracker - Personal Finance Dashboard',
  description: 'Track your expenses, manage budgets, and analyze spending patterns',
}

// node-cron only runs in local dev (not on Vercel — use vercel.json crons instead)
console.log('[Layout] Checking environment for cron jobs...',typeof window,"window", process.env.NODE_ENV)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  import('@/lib/cron').then(({ startCronJobs }) => {
    startCronJobs()
  }).catch(console.error)
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
