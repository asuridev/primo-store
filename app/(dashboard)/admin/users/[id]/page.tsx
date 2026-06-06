import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils/format'
import { ArrowLeft, Shield, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { EditUserForm } from './edit-user-form'

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_active, created_at, roles(id, name)')
    .eq('id', id)
    .single()

  if (!user) notFound()

  const roleName = (user.roles as any)?.name

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{user.full_name}</h1>
            {!user.is_active && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inactivo</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center gap-1 text-xs font-medium
              ${roleName === 'admin' ? 'text-violet-700' : 'text-blue-700'}`}>
              {roleName === 'admin' ? <Shield className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
              {roleName === 'admin' ? 'Administrador' : 'Vendedor'}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500">Creado {formatDate(user.created_at)}</span>
          </div>
        </div>
      </div>

      <EditUserForm
        userId={user.id}
        fullName={user.full_name}
        email={user.email}
        phone={user.phone ?? ''}
        currentRole={roleName ?? 'seller'}
        isActive={user.is_active}
      />
    </div>
  )
}
