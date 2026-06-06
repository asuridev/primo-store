import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { NewUserForm } from './new-user-form'

export default function NewUserPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nuevo usuario</h1>
          <p className="text-sm text-gray-500">Crear una cuenta de acceso al sistema</p>
        </div>
      </div>
      <NewUserForm />
    </div>
  )
}
