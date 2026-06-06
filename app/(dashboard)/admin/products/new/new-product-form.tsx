'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, createVariant } from '@/lib/actions/products'
import { Plus, Trash2, Upload, Image, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const LETTER_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const NUMBER_SIZES = ['28', '30', '32', '34', '36', '38', '40']

interface VariantRow {
  id: string
  color: string; size_type: string; size_value: string
  quality: string; reference: string; barcode: string
  purchase_price: string; sale_price: string; min_stock: string; initial_stock: string
}

function newRow(): VariantRow {
  return {
    id: crypto.randomUUID(),
    color: '', size_type: 'letter', size_value: '',
    quality: '', reference: '', barcode: '',
    purchase_price: '', sale_price: '', min_stock: '3', initial_stock: '0',
  }
}

interface Props {
  categories: { id: string; name: string }[]
  brands: { id: string; name: string }[]
  suppliers: { id: string; name: string }[]
}

export function NewProductForm({ categories, brands, suppliers }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [variants, setVariants] = useState<VariantRow[]>([newRow()])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('La imagen no puede superar 2MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function updateVariant(id: string, field: keyof VariantRow, value: string) {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  function addVariant() { setVariants(prev => [...prev, newRow()]) }
  function removeVariant(id: string) {
    if (variants.length === 1) return
    setVariants(prev => prev.filter(v => v.id !== id))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError('')

    const form = e.currentTarget
    const fd = new FormData(form)
    if (imageFile) fd.set('image', imageFile)

    const result = await createProduct(fd)

    if (!result.success || !result.productId) {
      setError(result.error ?? 'Error al crear el producto')
      setLoading(false); return
    }

    // Crear variantes
    for (const v of variants) {
      if (!v.sale_price) continue
      await createVariant(result.productId, {
        color:          v.color   || undefined,
        size_type:      v.size_type || undefined,
        size_value:     v.size_value || undefined,
        quality:        v.quality   || undefined,
        reference:      v.reference || undefined,
        barcode:        v.barcode   || undefined,
        purchase_price: Number(v.purchase_price) || 0,
        sale_price:     Number(v.sale_price),
        min_stock:      Number(v.min_stock) || 3,
        initial_stock:  Number(v.initial_stock) || 0,
        initial_cost:   Number(v.purchase_price) || 0,
      })
    }

    router.push(`/admin/products/${result.productId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos del producto */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Datos del producto</h2>

        {/* Foto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foto del producto <span className="text-red-500">*</span>
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl cursor-pointer
                       hover:border-gray-400 transition-colors overflow-hidden"
          >
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 flex items-center justify-center
                                bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Cambiar foto
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Image className="w-10 h-10 mb-3" />
                <p className="text-sm font-medium text-gray-600">Click para subir foto</p>
                <p className="text-xs mt-1">JPG, PNG o WEBP · máx 2MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input name="name" required placeholder="Ej: Jean Clásico"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select name="category_id" required
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="">Seleccionar...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Marca</label>
            <select name="brand_id"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="">Sin marca</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
            <textarea name="description" rows={2} placeholder="Descripción opcional..."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>
      </div>

      {/* Variantes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Variantes</h2>
          <button type="button" onClick={addVariant}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600
                       hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
            <Plus className="w-4 h-4" /> Agregar variante
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((v, i) => (
            <div key={v.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Variante {i + 1}</p>
                {variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(v.id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                  <input value={v.color} onChange={e => updateVariant(v.id, 'color', e.target.value)}
                    placeholder="Azul, Negro..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo talla</label>
                  <select value={v.size_type} onChange={e => updateVariant(v.id, 'size_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                               focus:outline-none focus:ring-1 focus:ring-gray-900">
                    <option value="letter">Letra (S/M/L...)</option>
                    <option value="number">Número (28/30...)</option>
                    <option value="one_size">Talla única</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Talla</label>
                  {v.size_type === 'one_size' ? (
                    <input value="" disabled placeholder="Talla única"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400" />
                  ) : (
                    <select value={v.size_value} onChange={e => updateVariant(v.id, 'size_value', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                                 focus:outline-none focus:ring-1 focus:ring-gray-900">
                      <option value="">Seleccionar...</option>
                      {(v.size_type === 'letter' ? LETTER_SIZES : NUMBER_SIZES).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Precio compra
                  </label>
                  <input type="number" min={0} value={v.purchase_price}
                    onChange={e => updateVariant(v.id, 'purchase_price', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Precio venta <span className="text-red-500">*</span>
                  </label>
                  <input type="number" min={0} value={v.sale_price}
                    onChange={e => updateVariant(v.id, 'sale_price', e.target.value)}
                    placeholder="0" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock mínimo</label>
                  <input type="number" min={0} value={v.min_stock}
                    onChange={e => updateVariant(v.id, 'min_stock', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Cantidad inicial
                  </label>
                  <input type="number" min={0} value={v.initial_stock}
                    onChange={e => updateVariant(v.id, 'initial_stock', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Referencia</label>
                  <input value={v.reference}
                    onChange={e => updateVariant(v.id, 'reference', e.target.value)}
                    placeholder="Ref. proveedor..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Código de barras</label>
                  <input value={v.barcode}
                    onChange={e => updateVariant(v.id, 'barcode', e.target.value)}
                    placeholder="Opcional..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-1 focus:ring-gray-900" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-3">
        <Link href="/admin/products"
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4" /> Cancelar
        </Link>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-800
                     disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Guardando...' : 'Guardar producto'}
        </button>
      </div>
    </form>
  )
}
