'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Leaf,
  BarChart3,
  Settings,
  LogOut,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin',            label: 'Overview',   icon: LayoutDashboard },
  { href: '/admin/orders',     label: 'Orders',     icon: ShoppingBag },
  { href: '/admin/products',   label: 'Products',   icon: Package },
  { href: '/admin/users',      label: 'Users',      icon: Users },
  { href: '/admin/hub',        label: 'Hub Stats',  icon: Leaf },
  { href: '/admin/analytics',  label: 'Analytics',  icon: BarChart3 },
  { href: '/admin/system',     label: 'System',     icon: Settings },
]

interface AdminSidebarProps {
  email: string
}

export default function AdminSidebar({ email }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-60 z-40 border-r"
        style={{
          background: '#06080a',
          borderColor: 'rgba(240,168,48,0.15)',
        }}
      >
        {/* Brand */}
        <div className="px-4 pt-6 pb-4 border-b" style={{ borderColor: 'rgba(240,168,48,0.12)' }}>
          <span
            className="text-xs tracking-[0.25em] font-semibold"
            style={{ fontFamily: 'var(--font-orbitron)', color: '#f0a830' }}
          >
            ADMIN
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors',
                  active
                    ? 'text-[#f0a830] bg-[rgba(240,168,48,0.08)]'
                    : 'text-[#4a6066] hover:text-[#e8f0ef] hover:bg-[rgba(255,255,255,0.04)]'
                )}
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-4 py-4 border-t space-y-3"
          style={{ borderColor: 'rgba(240,168,48,0.12)' }}
        >
          <p className="text-xs truncate" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-mono)' }}>
            {email}
          </p>
          <Link
            href="/shop"
            className="flex items-center gap-2 text-xs transition-colors"
            style={{ color: '#4a6066', fontFamily: 'var(--font-dm-sans)' }}
          >
            <ArrowLeft size={13} />
            Back to Shop
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex items-center gap-2 text-xs transition-colors hover:text-red-400 w-full"
            style={{ color: '#4a6066', fontFamily: 'var(--font-dm-sans)' }}
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile icon-only sidebar */}
      <aside
        className="flex md:hidden flex-col fixed top-0 left-0 h-screen w-12 z-40 border-r items-center"
        style={{ background: '#06080a', borderColor: 'rgba(240,168,48,0.15)' }}
      >
        <div className="pt-4 pb-3 border-b w-full flex justify-center" style={{ borderColor: 'rgba(240,168,48,0.12)' }}>
          <span style={{ color: '#f0a830', fontSize: 10, fontFamily: 'var(--font-orbitron)' }}>A</span>
        </div>
        <nav className="flex-1 flex flex-col items-center py-3 gap-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={cn(
                  'p-2 rounded transition-colors',
                  active ? 'text-[#f0a830]' : 'text-[#4a6066] hover:text-[#e8f0ef]'
                )}
              >
                <Icon size={18} />
              </Link>
            )
          })}
        </nav>
        <div className="pb-4 flex flex-col items-center gap-2">
          <Link href="/shop" title="Back to Shop" className="p-2 text-[#4a6066] hover:text-[#e8f0ef]">
            <ArrowLeft size={16} />
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            title="Logout"
            className="p-2 text-[#4a6066] hover:text-red-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  )
}
