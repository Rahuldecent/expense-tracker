import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: 'purple' | 'green' | 'red' | 'none'
  onClick?: () => void
}

export default function Card({ children, className, hover = false, glow = 'none', onClick }: CardProps) {
  const glowStyles = {
    purple: 'hover:shadow-violet-500/20 hover:border-violet-500/30',
    green: 'hover:shadow-emerald-500/20 hover:border-emerald-500/30',
    red: 'hover:shadow-red-500/20 hover:border-red-500/30',
    none: '',
  }

  return (
    <div
      className={cn(
        'glass rounded-2xl',
        hover && 'card-hover cursor-pointer',
        glow !== 'none' && `hover:shadow-lg ${glowStyles[glow]}`,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between p-6 pb-4', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 pb-6', className)}>{children}</div>
}
