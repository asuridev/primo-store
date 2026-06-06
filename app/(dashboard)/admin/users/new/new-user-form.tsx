'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUser } from '@/lib/actions/users'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export function NewUserForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showPw, setShowPw]   = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError('')
    const fd = new FormData(e.currentTarget)
    const result = await createUser(fd)
    if (!result.success) { setError(result.error ?? 'Error'); setLoading(false); return }
    router.push('/admin/users')
  }

  const input = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input name="full_name" required placeholder="Ej: María Rodríguez" className={input} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Correo electrónico <span className="text-red-500">*</span>
          </label>
          <input name="email" type="email" required placeholder="correo@ejemplo.com" className={input} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
          <input name="phone" type="tel" placeholder="Opcional" className={input} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Rol <span className="text-red-500">*</span>
          </label>
          <select name="role" required defaultValue="seller"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="seller">Vendedor</option>
            <option value="admin">Administrador</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">El administrador tiene acceso completo al sistema.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Contraseña inicial <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input name="password" type={showPw ? 'text' : 'password'} required minLength={6}
              placeholder="Mínimo 6 caracteres" className={`${input} pr-10`} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">El usuario podrá cambiarla desde su perfil.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => router.back()}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear usuario
          </button>
        </div>
      </form>
    </div>
  )
}
