'use client'

import { useEffect, useState } from 'react'
import { Bell, Package } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { LowStockAlert } from '@/types/database'

interface TopbarProps {
  userName: string
  userEmail: string
}

export function Topbar({ userName, userEmail }: TopbarProps) {
  const supabase = createClient()
  const [alerts, setAlerts] = useState<LowStockAlert[]>([])
  const [showAlerts, setShowAlerts] = useState(false)

  useEffect(() => {
    fetchAlerts()

    const channel = supabase
      .channel('inventory-alerts')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'product_variants',
      }, () => fetchAlerts())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchAlerts() {
    const { data } = await supabase
      .from('v_low_stock_alerts')
      .select('*')
      .order('stock', { ascending: true })
      .limit(20)
    setAlerts(data ?? [])
  }

  const outOfStock = alerts.filter(a => a.alert_type === 'out_of_stock').length
  const lowStock   = alerts.filter(a => a.alert_type === 'low_stock').length
  const total      = alerts.length

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Breadcrumb placeholder (filled by each page via title) */}
      <div />

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {total > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center
                               w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">
                {total > 9 ? '9+' : total}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200
                             rounded-xl shadow-lg z-50 max-h-[420px] overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Alertas de inventario</p>
                <div className="flex items-center gap-2 text-xs">
                  {outOfStock > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                      {outOfStock} agotados
                    </span>
                  )}
                  {lowStock > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                      {lowStock} bajos
                    </span>
                  )}
                </div>
              </div>

              {alerts.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-gray-400">
                  <Package className="w-8 h-8 mb-2" />
                  <p className="text-sm">Todo el inventario está bien</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        alert.alert_type === 'out_of_stock' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {alert.product_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {[alert.color, alert.size_value ? `T. ${alert.size_value}` : null]
                            .filter(Boolean).join(' / ')
                          } — {alert.stock === 0 ? 'Sin stock' : `${alert.stock} uds`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-4 py-3 border-t border-gray-100">
                <Link
                  href="/inventory"
                  onClick={() => setShowAlerts(false)}
                  className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                >
                  Ver inventario completo →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 bg-gray-900 rounded-full">
            <span className="text-xs font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">{userName}</p>
            <p className="text-xs text-gray-500 leading-tight">{userEmail}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
