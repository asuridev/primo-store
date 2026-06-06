'use client'

import { useState } from 'react'
import { Plus, Loader2, Power } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Brand { id: string; name: string; is_active: boolean }

export function BrandsManager({ initialBrands }: { initialBrands: Brand[] }) {
  const [items, setItems]     = useState(initialBrands)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('brands').insert({ name: newName.trim() }).select('id, name, is_active').single()
    if (err) { setError(err.message); setLoading(false); return }
    setItems(prev => [...prev, data]); setNewName(''); setLoading(false)
  }

  async function handleToggle(id: string, isActive: boolean) {
    const supabase = createClient()
    await supabase.from('brands').update({ is_active: !isActive }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: !isActive } : i))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Marcas</h2>
      <div className="space-y-2 mb-4">
        {items.length === 0 && <p className="text-sm text-gray-400">Sin marcas registradas</p>}
        {items.map(brand => (
          <div key={brand.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 bg-gray-50">
            <span className={`text-sm ${!brand.is_active ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{brand.name}</span>
            <button onClick={() => handleToggle(brand.id, brand.is_active)}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
              <Power className="w-3.5 h-3.5" />
              {brand.is_active ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nueva marca..."
          className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        <button type="submit" disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Agregar
        </button>
      </form>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}
