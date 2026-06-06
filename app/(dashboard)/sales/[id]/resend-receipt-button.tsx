'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle } from 'lucide-react'
import { resendReceipt } from '@/lib/actions/sales'

export function ResendReceiptButton({ saleId }: { saleId: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function handle() {
    setLoading(true); setError(''); setSent(false)
    const result = await resendReceipt(saleId)
    if (!result.success) { setError(result.error ?? 'Error'); setLoading(false); return }
    setSent(true); setLoading(false)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div>
      <button onClick={handle} disabled={loading}
        className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-sm rounded-xl hover:bg-gray-50 disabled:opacity-50">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : sent ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Send className="w-4 h-4" />}
        {sent ? 'Enviado' : 'Reenviar'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
