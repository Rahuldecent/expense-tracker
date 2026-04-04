import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'purple'
  className?: string
}

const variantStyles = {
  default: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  danger: 'bg-red-500/15 text-red-400 border-red-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  purple: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function CategoryBadge({ category }: { category: string }) {
  const categoryVariants: Record<string, BadgeProps['variant']> = {
    'Food & Dining': 'warning',
    Shopping: 'info',
    Transport: 'success',
    Utilities: 'purple',
    Healthcare: 'danger',
    Entertainment: 'purple',
    Groceries: 'info',
    Others: 'default',
  }

  return (
    <Badge variant={categoryVariants[category] || 'default'}>
      {category}
    </Badge>
  )
}

export function TypeBadge({ type }: { type: 'debit' | 'credit' }) {
  return (
    <Badge variant={type === 'credit' ? 'success' : 'danger'}>
      {type === 'credit' ? '↑ Credit' : '↓ Debit'}
    </Badge>
  )
}
