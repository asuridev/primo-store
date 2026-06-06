'use client'

import { useState, useRef } from 'react'
import { MoreVertical, Edit, Power, Loader2, Upload } from 'lucide-react'
import { updateProduct, toggleProductStatus } from '@/lib/actions/products'
import { useRouter } from 'next/navigation'

interface Props {
  productId: string; isActive: boolean; productName: string
  categoryId: string; brandId: string; description: string
  categories: { id: string; name: string }[]
  brands: { id: string; name: string }[]
  currentImageUrl: string | null
}

export function ProductActions({ productId, isActive, productName, categoryId, brandId, description, categories, brands, currentImageUrl }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(currentImageUrl)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleToggle() {
    setLoading(true)
    await toggleProductStatus(productId, isActive)
    setLoading(false); setMenuOpen(false)
    router.refresh()
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError('')
    const form = e.currentTarget
    const fd = new FormData(form)
    if (imageFile) fd.set('image', imageFile)

    const result = await updateProduct(productId, fd)
    if (!result.success) { setError(result.error ?? 'Error'); setLoading(false); return }
    setEditOpen(false); setLoading(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button onClick={() => setMenuOpen(!menuOpen)}
        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
        <MoreVertical className="w-5 h-5" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
          <button onClick={() => { setMenuOpen(false); setEditOpen(true) }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl">
            <Edit className="w-4 h-4" /> Editar producto
          </button>
          <button onClick={handleToggle} disabled={loading}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-b-xl border-t border-gray-100">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            {isActive ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-5">Editar producto</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              {/* Foto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto</label>
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 overflow-hidden">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-6 text-gray-400">
                      <Upload className="w-6 h-6 mr-2" />
                      <span className="text-sm">Subir foto</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)) } }} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
                <input name="name" defaultValue={productName} required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría *</label>
                  <select name="category_id" defaultValue={categoryId} required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Marca</label>
                  <select name="brand_id" defaultValue={brandId}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                    <option value="">Sin marca</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
                <textarea name="description" rows={2} defaultValue={description}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>

              {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
