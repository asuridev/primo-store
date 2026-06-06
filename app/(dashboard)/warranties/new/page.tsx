import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { NewWarrantyForm } from './new-warranty-form'

export default function NewWarrantyPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/warranties" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Registrar garantía o cambio</h1>
          <p className="text-sm text-gray-500">Válido dentro de los 30 días de la compra</p>
        </div>
      </div>
      <NewWarrantyForm />
    </div>
  )
}
