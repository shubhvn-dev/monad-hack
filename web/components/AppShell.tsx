'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount, useDisconnect } from 'wagmi'
import { useModal } from '@getpara/react-sdk'
import { TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'

const NAV = [
  { href: '/explore',    label: 'Explore' },
  { href: '/agent',      label: 'Agent' },
]

function HeaderNav() {
  const path = usePathname()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { openModal } = useModal()

  return (
    <div className="max-w-6xl mx-auto px-8 h-full flex items-center gap-10">
      {/* Logo */}
      <Link href="/" className="shrink-0 flex items-center gap-2.5 select-none">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
          <TrendingUp className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-display font-bold text-base tracking-tight text-white">TrackFund</span>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-1 flex-1">
        {NAV.map(({ href, label }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link
              key={href} href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-white/8 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          )
        })}
        {isConnected && (
          <Link
            href="/profile"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              path === '/profile'
                ? 'bg-white/8 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Dashboard
          </Link>
        )}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3 shrink-0">
        {isConnected && address ? (
          <>
            <span className="font-mono text-xs text-white/40">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
            <button
              onClick={() => disconnect()}
              className="text-xs text-white/30 hover:text-white/60 transition-colors font-medium"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={() => openModal()}
            className="btn-primary"
            style={{ fontSize: 13, padding: '8px 16px' }}
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header
        className="fixed top-0 inset-x-0 z-50 h-16 glass"
        style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
      >
        <HeaderNav />
      </header>
      <main className="pt-16">{children}</main>
    </div>
  )
}
