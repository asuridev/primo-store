import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Primos Store',
  description: 'Sistema de inventario y ventas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
