import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/format'
import { Users, UserPlus, Shield, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_active, created_at, roles(name)')
    .order('created_at', { ascending: false })

  const total   = users?.length ?? 0
  const admins  = users?.filter(u => (u.roles as any)?.name === 'admin').length ?? 0
  const sellers = users?.filter(u => (u.roles as any)?.name === 'seller').length ?? 0
  const active  = users?.filter(u => u.is_active).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de cuentas de acceso al sistema</p>
        </div>
        <Link href="/admin/users/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors">
          <UserPlus className="w-4 h-4" /> Nuevo usuario
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total usuarios', value: total, icon: Users, color: 'text-gray-600', bg: 'bg-gray-100' },
          { label: 'Activos', value: active, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Administradores', value: admins, icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Vendedores', value: sellers, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={`${bg} ${color} p-3 rounded-xl`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Todos los usuarios</h2>
        </div>

        {!users || users.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Users className="w-10 h-10 mb-3" />
            <p className="text-sm">No hay usuarios registrados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Correo</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user: any) => {
                const roleName = (user.roles as any)?.name
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/users/${user.id}`}
                        className="font-medium text-gray-900 hover:text-gray-600 hover:underline">
                        {user.full_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${roleName === 'admin' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'}`}>
                        {roleName === 'admin' ? <Shield className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                        {roleName === 'admin' ? 'Administrador' : 'Vendedor'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium
                        ${user.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(user.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
