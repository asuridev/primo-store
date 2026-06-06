import { getStockStatus, stockStatusConfig } from '@/lib/utils/stock-status'
import { cn } from '@/lib/utils/cn'

interface StockBadgeProps {
  stock: number
  minStock: number
  showCount?: boolean
  size?: 'sm' | 'md'
}

export function StockBadge({ stock, minStock, showCount = true, size = 'md' }: StockBadgeProps) {
  const status = getStockStatus(stock, minStock)
  const cfg = stockStatusConfig[status]

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-medium rounded-full border',
      cfg.bg, cfg.color, cfg.border,
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
    )}>
      <span className={cn('rounded-full flex-shrink-0', cfg.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      {cfg.label}
      {showCount && stock > 0 && ` (${stock})`}
    </span>
  )
}
