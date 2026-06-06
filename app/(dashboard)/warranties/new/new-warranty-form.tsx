'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Search } from 'lucide-react'

function pad(n: number) { return String(n).padStart(6, '0') }

const DAYS_LIMIT = 30

export function NewWarrantyForm() {
  const router = useRouter()
  const [searchQuery, setSearchQuery]   = useState('')
  const [foundSale, setFoundSale]       = useState<any>(null)
  const [searchError, setSearchError]   = useState('')
  const [searching, setSearching]       = useState(false)
  const [type, setType]                 = useState<'warranty' | 'exchange'>('warranty')
  const [reason, setReason]             = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true); setSearchError(''); setFoundSale(null)

    const supabase = createClient()
    const queryNum = parseInt(searchQuery.replace(/\D/g, ''))

    const { data } = await supabase
      .from('sales')
      .select('id, consecutive_number, customer_name, customer_email, total, created_at, status')
      .or(queryNum
        ? `consecutive_number.eq.${queryNum},customer_name.ilike.%${searchQuery}%`
        : `customer_name.ilike.%${searchQuery}%`)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5)

    setSearching(false)
    if (!data || data.length === 0) {
      setSearchError('No se encontró ninguna venta. Verifique el número o nombre del cliente.')
      return
    }
    setFoundSale(data[0])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!foundSale) { setError('Busca y selecciona una venta primero'); return }
    if (!reason.trim()) { setError('El motivo es obligatorio'); return }

    // Validate 30 days
    const saleDate   = new Date(foundSale.created_at)
    const diffDays   = (Date.now() - saleDate.getTime()) / 86400000
    if (diffDays > DAYS_LIMIT) {
      setError(`Esta venta tiene ${Math.floor(diffDays)} días. Solo se aceptan garantías dentro de los ${DAYS_LIMIT} días de la compra.`)
      return
    }

    setLoading(true); setError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('No autorizado'); setLoading(false); return }

    const { error: insertError } = await supabase
      .from('warranties_exchanges')
      .insert({
        original_sale_id: foundSale.id,
        handled_by: session.user.id,
        type,
        reason: reason.trim(),
        status: 'pending',
      })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    router.push('/warranties')
  }

  const input = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

  return (
    <div className="space-y-5">
      {/* Search sale */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Buscar venta original</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="N° de comprobante o nombre del cliente"
            className={`${input} flex-1`}
          />
          <button type="submit" disabled={searching}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>
        </form>
        {searchError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{searchError}</p>
        )}
        {foundSale && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-green-900 mb-1">
              Comprobante #{pad(foundSale.consecutive_number)} — {foundSale.customer_name}
            </p>
            <p className="text-xs text-green-700">
              {new Date(foundSale.created_at).toLocaleDateString('es-CO', {
                day: '2-digit', month: 'long', year: 'numeric'
              })} · {foundSale.customer_email}
            </p>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Detalles</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tipo <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {(['warranty', 'exchange'] as const).map(t => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors
                    ${type === t
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}`}>
                  {t === 'warranty' ? 'Garantía' : 'Cambio'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Describe el motivo de la garantía o cambio..."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => router.back()}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !foundSale}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
