'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props { config: Record<string, string> }

const FIELDS: { key: string; label: string; placeholder: string; type?: string }[] = [
  { key: 'store_name',          label: 'Nombre de la tienda',       placeholder: 'Ej: Primos Store' },
  { key: 'store_address',       label: 'Dirección',                  placeholder: 'Calle 123 # 45-67' },
  { key: 'store_phone',         label: 'Teléfono',                   placeholder: '300 000 0000' },
  { key: 'store_email',         label: 'Correo de contacto',         placeholder: 'contacto@tienda.co' },
  { key: 'max_discount_pct',    label: '% Máx. descuento (sin auth)', placeholder: '20', type: 'number' },
  { key: 'receipt_footer_text', label: 'Pie del comprobante',        placeholder: '¡Gracias por su compra!' },
]

export function SettingsForm({ config }: Props) {
  const [values, setValues] = useState<Record<string, string>>(config)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSaved(false)
    const supabase = createClient()

    for (const { key } of FIELDS) {
      const { error: err } = await supabase
        .from('app_config')
        .update({ value: values[key] ?? '' })
        .eq('key', key)
      if (err) { setError(err.message); setLoading(false); return }
    }

    setSaved(true); setLoading(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const input = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-5">Datos de la tienda</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {FIELDS.map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <input
              type={type ?? 'text'}
              value={values[key] ?? ''}
              onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className={input}
            />
          </div>
        ))}

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">{error}</div>}

        <div className="pt-1">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4 text-green-400" /> : null}
            {saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
