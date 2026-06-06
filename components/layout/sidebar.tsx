'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShoppingBag, ShoppingCart, Package, LayoutDashboard,
  Settings, Users, BarChart3, RefreshCw, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
  exact?: boolean
}

const navItems: NavItem[] = [
  { href: '/',            label: 'Dashboard',   icon: LayoutDashboard, exact: true },
  { href: '/sales',       label: 'Ventas',       icon: ShoppingCart },
  { href: '/inventory',   label: 'Inventario',   icon: Package },
]

const adminItems: NavItem[] = [
  { href: '/admin/products', label: 'Productos',      icon: ShoppingBag,  adminOnly: true },
  { href: '/admin/users',    label: 'Usuarios',        icon: Users,         adminOnly: true },
  { href: '/admin/reports',  label: 'Reportes',        icon: BarChart3,     adminOnly: true },
  { href: '/admin/settings', label: 'Configuración',   icon: Settings,      adminOnly: true },
]

interface SidebarProps {
  role: string
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isAdmin = role === 'admin'

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="flex items-center justify-center w-9 h-9 bg-white rounded-lg">
          <ShoppingBag className="w-5 h-5 text-gray-900" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">Primos Store</p>
          <p className="text-xs text-gray-400 capitalize">{role}</p>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => (
          <NavLink key={item.href} item={item} active={isActive(item.href, item.exact)} />
        ))}

        {/* Sección admin */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Administración
              </p>
            </div>
            {adminItems.map(item => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400
                     hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        active
          ? 'bg-gray-800 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {item.label}
    </Link>
  )
}
