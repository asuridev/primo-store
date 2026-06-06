'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Loader2, Power } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Supplier { id: string; name: string; contact_name: string | null; phone: string | null; email: string | null; is_active: boolean }

export function SuppliersManager({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [items, setItems]    = useState(initialSuppliers)
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ name: '', contact_name: '', phone: '', email: '' })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('suppliers')
      .insert({
        name:         form.name.trim(),
        contact_name: form.contact_name.trim() || null,
        phone:        form.phone.trim() || null,
        email:        form.email.trim() || null,
      })
      .select('id, name, contact_name, phone, email, is_active')
      .single()
    if (err) { setError(err.message); setLoading(false); return }
    setItems(prev => [...prev, data])
    setForm({ name: '', contact_name: '', phone: '', email: '' })
    setShowAdd(false); setLoading(false)
  }

  async function handleToggle(id: string, isActive: boolean) {
    const supabase = createClient()
    await supabase.from('suppliers').update({ is_active: !isActive }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: !isActive } : i))
  }

  const input = 'w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Proveedores</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
          {showAdd ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'Cancelar' : 'Agregar'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-5 p-4 bg-gray-50 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contacto</label>
              <input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={input} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Correo</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={input} />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar proveedor
          </button>
        </form>
      )}

      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-gray-400">Sin proveedores registrados</p>}
        {items.map(s => (
          <div key={s.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50">
            <div>
              <p className={`text-sm font-medium ${!s.is_active ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{s.name}</p>
              {(s.contact_name || s.phone) && (
                <p className="text-xs text-gray-500">{[s.contact_name, s.phone].filter(Boolean).join(' · ')}</p>
              )}
            </div>
            <button onClick={() => handleToggle(s.id, s.is_active)}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
              <Power className="w-3.5 h-3.5" />
              {s.is_active ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
