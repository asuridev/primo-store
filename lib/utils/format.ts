import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy 'a las' HH:mm", { locale: es })
}

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function formatConsecutive(n: number): string {
  return `#${String(n).padStart(6, '0')}`
}

export function formatVariantDescription(
  color: string | null,
  sizeType: string | null,
  sizeValue: string | null
): string {
  const parts: string[] = []
  if (color) parts.push(color)
  if (sizeValue) parts.push(`Talla ${sizeValue}`)
  return parts.join(' / ') || 'Talla única'
}
