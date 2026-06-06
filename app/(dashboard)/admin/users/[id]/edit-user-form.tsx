'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUser, toggleUserStatus } from '@/lib/actions/users'
import { Loader2, Eye, EyeOff, Power } from 'lucide-react'

interface Props {
  userId: string; fullName: string; email: string
  phone: string; currentRole: string; isActive: boolean
}

export function EditUserForm({ userId, fullName, email, phone, currentRole, isActive }: Props) {
  const router  = useRouter()
  const [loading, setLoading]     = useState(false)
  const [toggling, setToggling]   = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const input = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    const fd = new FormData(e.currentTarget)
    const result = await updateUser(userId, fd)
    if (!result.success) { setError(result.error ?? 'Error'); setLoading(false); return }
    setSuccess('Cambios guardados correctamente')
    setLoading(false)
  }

  async function handleToggle() {
    setToggling(true); setError(''); setSuccess('')
    const result = await toggleUserStatus(userId, isActive)
    if (!result.success) { setError(result.error ?? 'Error'); setToggling(false); return }
    setToggling(false); setConfirmDeactivate(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Datos del usuario</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input name="full_name" defaultValue={fullName} required className={input} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <input name="email" type="email" defaultValue={email} required className={input} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
            <input name="phone" type="tel" defaultValue={phone} placeholder="Opcional" className={input} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rol <span className="text-red-500">*</span>
            </label>
            <select name="role" defaultValue={currentRole} required
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="seller">Vendedor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nueva contraseña <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <input name="password" type={showPw ? 'text' : 'password'} minLength={6}
                placeholder="Dejar vacío para no cambiar" className={`${input} pr-10`} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error   && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-sm text-green-700">{success}</div>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => router.back()}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>

      {/* Estado del usuario */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Estado de la cuenta</h2>
        <p className="text-sm text-gray-500 mb-4">
          {isActive
            ? 'Este usuario puede iniciar sesión normalmente.'
            : 'Este usuario está desactivado y no puede iniciar sesión.'}
        </p>

        {!confirmDeactivate ? (
          <button onClick={() => setConfirmDeactivate(true)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors
              ${isActive
                ? 'border-red-200 text-red-700 hover:bg-red-50'
                : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
            <Power className="w-4 h-4" />
            {isActive ? 'Desactivar usuario' : 'Reactivar usuario'}
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-red-800">
              {isActive
                ? '¿Confirmar desactivación? El usuario no podrá iniciar sesión.'
                : '¿Confirmar reactivación? El usuario podrá volver a iniciar sesión.'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeactivate(false)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white">
                Cancelar
              </button>
              <button onClick={handleToggle} disabled={toggling}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50">
                {toggling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
