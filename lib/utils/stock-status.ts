export type StockStatus = 'ok' | 'low' | 'out'

export function getStockStatus(stock: number, minStock: number): StockStatus {
  if (stock === 0) return 'out'
  if (stock <= minStock) return 'low'
  return 'ok'
}

export const stockStatusConfig = {
  ok:  { label: 'Disponible', color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200', dot: 'bg-emerald-500' },
  low: { label: 'Stock bajo', color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',   dot: 'bg-amber-500'   },
  out: { label: 'Agotado',    color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200',     dot: 'bg-red-500'     },
} as const
