'use client'

import { useEffect, useRef, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useModal } from '@getpara/react-sdk'
import { ADDRESSES, TRACK_FUND_ABI } from '@/lib/contracts'
import { MONAD_TESTNET_ID } from '@/lib/useMonadGuard'
import {
  ArrowRight, ArrowUpRight, TrendingUp, Shield, Zap, Globe, Users, BarChart3,
  ChevronRight, Star, Check, Play, Layers, Lock, Activity
} from 'lucide-react'

// ── Scroll reveal hook ────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.section-reveal')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view') }),
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ── Active section tracker ────────────────────────────────────────────
function useActiveSection() {
  const [active, setActive] = useState('hero')
  useEffect(() => {
    const ids = ['hero', 'trust', 'benefits', 'product', 'features', 'testimonials', 'cta']
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
      },
      { threshold: 0.3 }
    )
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])
  return active
}

// ── Floating bottom nav ───────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'hero',         label: 'Home' },
  { id: 'benefits',     label: 'Benefits' },
  { id: 'product',      label: 'Product' },
  { id: 'features',     label: 'Features' },
  { id: 'testimonials', label: 'About' },
]

function FloatingNav({ isConnected, openModal }: { isConnected: boolean; openModal: () => void }) {
  const active = useActiveSection()
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      setVisible(y < 80 || y < lastY.current)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div
      style={{
        position: 'fixed', bottom: 28, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : 100}px)`,
        zIndex: 100, transition: 'transform 400ms cubic-bezier(0.25,0.46,0.45,0.94)',
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(17,17,17,0.85)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 9999, padding: '8px 10px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {/* Logo mark */}
      <button
        onClick={() => scrollTo('hero')}
        style={{
          width: 32, height: 32, background: 'var(--primary)', borderRadius: 9999,
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: 4, transition: 'transform 200ms',
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <TrendingUp size={14} color="white" />
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', marginRight: 2 }} />

      {/* Nav items */}
      {NAV_ITEMS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => scrollTo(id)}
          style={{
            padding: '6px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, transition: 'all 200ms',
            background: active === id ? 'rgba(99,102,241,0.2)' : 'transparent',
            color: active === id ? '#818cf8' : 'rgba(255,255,255,0.5)',
            position: 'relative',
          }}
          onMouseEnter={e => { if (active !== id) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'white' } }}
          onMouseLeave={e => { if (active !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' } }}
        >
          {label}
          {active === id && (
            <span style={{
              position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
              width: 4, height: 4, background: 'var(--primary)', borderRadius: '50%',
            }} />
          )}
        </button>
      ))}

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', marginLeft: 2, marginRight: 4 }} />

      {/* CTA */}
      {isConnected ? (
        <Link
          href="/profile"
          style={{
            padding: '8px 18px', background: 'var(--primary)', color: 'white', borderRadius: 9999,
            fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'background 200ms, transform 200ms',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.transform = 'scale(1.03)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'scale(1)' }}
        >
          Dashboard <ArrowRight size={12} />
        </Link>
      ) : (
        <button
          onClick={() => openModal()}
          style={{
            padding: '8px 18px', background: 'var(--primary)', color: 'white', borderRadius: 9999,
            fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background 200ms, transform 200ms',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.transform = 'scale(1.03)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'scale(1)' }}
        >
          Connect <ArrowRight size={12} />
        </button>
      )}
    </div>
  )
}

// ── Mock product dashboard ────────────────────────────────────────────
function MockDashboard() {
  return (
    <div style={{
      background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, overflow: 'hidden', width: '100%',
    }}>
      {/* Title bar */}
      <div style={{ height: 36, background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-jetbrains)' }}>
          trackfund — dashboard
        </div>
      </div>
      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { label: 'Pool Balance', value: '50,000', unit: 'MUSD' },
          { label: 'Active Orgs', value: '4', unit: 'labs' },
          { label: 'Projects', value: '12', unit: 'funded' },
          { label: 'Milestones', value: '8/24', unit: 'done' },
        ].map((m, i) => (
          <div key={i} style={{ padding: '14px 14px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, fontFamily: 'var(--font-jetbrains)' }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'white', lineHeight: 1, letterSpacing: '-0.02em' }}>{m.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontFamily: 'var(--font-jetbrains)' }}>{m.unit}</div>
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div style={{ padding: '16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, fontFamily: 'var(--font-jetbrains)' }}>Pool Performance</div>
        <svg width="100%" height="60" viewBox="0 0 400 60" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 50 C40 48, 60 42, 100 38 C140 34, 160 36, 200 30 C240 24, 260 22, 300 14 C340 6, 360 8, 400 4" fill="none" stroke="#6366f1" strokeWidth="2" />
          <path d="M0 50 C40 48, 60 42, 100 38 C140 34, 160 36, 200 30 C240 24, 260 22, 300 14 C340 6, 360 8, 400 4 L400 60 L0 60 Z" fill="url(#lineGrad)" />
          {/* Grid lines */}
          {[15, 30, 45].map(y => (
            <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
        </svg>
      </div>
      {/* Project rows */}
      <div style={{ padding: '0 0 4px' }}>
        {[
          { name: 'Autonomous Research Agent', org: 'OpenMind Labs', progress: 75, funded: '8,000' },
          { name: 'Distributed Training v2', org: 'NeuralStack', progress: 50, funded: '12,000' },
          { name: 'Formal Safety Verification', org: 'Axiom AI', progress: 33, funded: '6,500' },
        ].map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'white', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-jetbrains)' }}>{p.org}</div>
            </div>
            <div style={{ width: 80 }}>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p.progress}%`, background: 'var(--primary)', borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-jetbrains)', width: 70, textAlign: 'right' }}>{p.funded}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const { isConnected } = useAccount()
  const { openModal } = useModal()
  const router = useRouter()
  const prevConnected = useRef(false)

  const { data: totalAssets } = useReadContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI,
    functionName: 'totalAssets', chainId: MONAD_TESTNET_ID,
  })

  useReveal()

  useEffect(() => {
    if (isConnected && !prevConnected.current) router.push('/profile')
    prevConnected.current = isConnected
  }, [isConnected, router])

  const poolStr = totalAssets !== undefined
    ? `${Number(formatUnits(totalAssets, 18)).toLocaleString()} MUSD`
    : null

  const BENEFITS = [
    {
      label: 'Transparency',
      title: 'Every allocation is onchain.',
      body: 'All funding decisions go through a Safe multisig and are permanently recorded on Monad. No black boxes, no gatekeepers.',
      icon: <Shield size={20} />,
      accent: '#6366f1',
    },
    {
      label: 'AI Governance',
      title: 'An agent watches the fund.',
      body: 'A Node.js governance agent continuously monitors proposals. When criteria are met, it routes calldata to Safe co-signers automatically.',
      icon: <Activity size={20} />,
      accent: '#8b5cf6',
    },
    {
      label: 'Liquidity',
      title: 'In and out, instantly.',
      body: 'Deposit MUSD and receive TRACK tokens 1:1. Redeem your shares at any time for proportional pool assets. No lockups.',
      icon: <Zap size={20} />,
      accent: '#06b6d4',
    },
    {
      label: 'Exposure',
      title: 'Back the labs building the future.',
      body: 'Your capital funds real AI research — distributed training, safety verification, autonomous agents — tracked through milestones onchain.',
      icon: <TrendingUp size={20} />,
      accent: '#10b981',
    },
  ]

  const FEATURES = [
    { icon: <Layers size={18} />, title: 'Proposal Lifecycle', desc: 'PENDING → APPROVED → FUNDED lifecycle enforced by smart contract. No shortcuts.' },
    { icon: <Lock size={18} />, title: 'Safe Multisig', desc: '3-of-5 multisig controls all fund disbursements. Human oversight at every step.' },
    { icon: <BarChart3 size={18} />, title: 'Milestone Tracking', desc: 'Every funded project is broken into milestones. Progress is recorded and visible to all investors.' },
    { icon: <Globe size={18} />, title: 'Monad Testnet', desc: 'Built on Monad — 10,000 TPS, EVM-compatible, sub-500ms finality. Built for scale.' },
    { icon: <Users size={18} />, title: 'Para Wallet', desc: 'Social login via Google, Apple, Discord. No seed phrases. Embedded wallet for seamless UX.' },
    { icon: <Activity size={18} />, title: 'Agent Monitoring', desc: 'The governance agent polls events in real time and surfaces qualifying proposals to the multisig.' },
  ]

  const LABS = [
    { name: 'OpenMind Labs', sector: 'Autonomous AI', funded: '8,000', projects: 3, pct: 75 },
    { name: 'NeuralStack', sector: 'Distributed Training', funded: '12,000', projects: 2, pct: 50 },
    { name: 'Axiom AI', sector: 'AI Safety', funded: '6,500', projects: 4, pct: 33 },
    { name: 'Cipher Research', sector: 'Privacy AI', funded: '5,200', projects: 2, pct: 60 },
  ]

  return (
    <div style={{ background: '#050505', color: '#FFFFFF', overflowX: 'hidden' }}>
      <FloatingNav isConnected={isConnected} openModal={openModal} />

      {/* ─────────────────── HERO ─────────────────── */}
      <section
        id="hero"
        style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          padding: '120px 24px 80px',
        }}
      >
        {/* Ambient background */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', width: '70vw', height: '70vw', maxWidth: 900,
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
            top: '-20%', left: '50%', transform: 'translateX(-50%)',
          }} />
          <div style={{
            position: 'absolute', width: '40vw', height: '40vw',
            background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)',
            bottom: '0%', right: '-10%',
          }} />
          <div style={{
            position: 'absolute', width: '30vw', height: '30vw',
            background: 'radial-gradient(ellipse, rgba(37,99,235,0.1) 0%, transparent 70%)',
            bottom: '10%', left: '-5%',
          }} />
          {/* Noise */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
            opacity: 0.4,
          }} />
        </div>

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 900, width: '100%' }}>
          {/* Eyebrow */}
          <div className="reveal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 14px', borderRadius: 9999,
              border: '1px solid rgba(99,102,241,0.3)',
              background: 'rgba(99,102,241,0.08)',
              fontSize: 12, color: '#818cf8',
              fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              <span style={{ width: 5, height: 5, background: '#6366f1', borderRadius: '50%', animation: 'glow-pulse 2s infinite' }} />
              Agentic Research Investment · Monad Testnet
            </span>
          </div>

          {/* Headline */}
          <h1
            className="reveal reveal-delay-1"
            style={{
              fontSize: 'clamp(3rem, 10vw, 9rem)',
              lineHeight: 0.9,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            <span style={{ display: 'block', color: 'white' }}>Fund the</span>
            <span
              style={{
                display: 'block',
                background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #6366f1 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}
            >
              future of AI
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="reveal reveal-delay-2"
            style={{
              marginTop: 28, fontSize: 'clamp(16px, 2.5vw, 20px)',
              color: '#888', lineHeight: 1.6, maxWidth: 540, margin: '28px auto 0',
            }}
          >
            The first onchain investment pool for AI research. Back the labs building tomorrow's intelligence — transparent, liquid, governed by code.
          </p>

          {/* Pool stat */}
          {poolStr && (
            <p
              className="reveal reveal-delay-3"
              style={{
                marginTop: 20, fontSize: 13,
                color: '#555', fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.1em',
              }}
            >
              {poolStr} in the pool · Monad Testnet
            </p>
          )}

          {/* CTA row */}
          <div
            className="reveal reveal-delay-4"
            style={{ marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            {isConnected ? (
              <Link href="/profile" className="btn-primary-lg">
                Open Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <button onClick={() => openModal()} className="btn-primary-lg">
                Connect Wallet <ArrowRight size={16} />
              </button>
            )}
            <Link href="/explore" className="btn-ghost-lg">
              View Portfolio <ArrowUpRight size={15} />
            </Link>
          </div>

          {/* Sub-links */}
          <div
            className="reveal reveal-delay-5"
            style={{ marginTop: 32, display: 'flex', gap: 24, justifyContent: 'center' }}
          >
            {[
              { href: '/researcher', label: 'Submit Research' },
              { href: '/agent', label: 'Governance Agent' },
              { href: '/explore', label: 'Browse Labs' },
            ].map(({ href, label }) => (
              <Link
                key={href} href={href}
                style={{
                  fontSize: 13, color: '#444', textDecoration: 'none',
                  transition: 'color 200ms',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#888')}
                onMouseLeave={e => (e.currentTarget.style.color = '#444')}
              >
                {label} <ChevronRight size={12} />
              </Link>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}
        >
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.15))', animation: 'float-slow 3s ease-in-out infinite' }} />
        </div>
      </section>

      {/* ─────────────────── TRUST ─────────────────── */}
      <section id="trust" style={{ padding: '60px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Metrics */}
          <div
            className="section-reveal"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}
          >
            {[
              { value: '50K+', label: 'MUSD in Pool', sub: 'total deposits' },
              { value: '4',    label: 'Research Orgs', sub: 'funded labs' },
              { value: '12',   label: 'Active Projects', sub: 'in progress' },
              { value: '8',    label: 'Milestones Completed', sub: 'delivered' },
            ].map((m, i) => (
              <div
                key={i}
                style={{
                  padding: '32px 28px',
                  borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 15, color: '#888', marginTop: 8, fontWeight: 500 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: '#444', marginTop: 4, fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.06em' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Scrolling lab logos */}
          <div style={{ marginTop: 48, overflow: 'hidden', position: 'relative' }}>
            <div style={{ fontSize: 11, textAlign: 'center', color: '#444', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-jetbrains)', marginBottom: 20 }}>
              Funded Research Organizations
            </div>
            <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
              <div className="marquee-track" style={{ gap: 0 }}>
                {['OpenMind Labs', 'NeuralStack', 'Axiom AI', 'Cipher Research', 'QuantumMind', 'SynthLab', 'VeritasAI', 'Cognition Systems',
                  'OpenMind Labs', 'NeuralStack', 'Axiom AI', 'Cipher Research', 'QuantumMind', 'SynthLab', 'VeritasAI', 'Cognition Systems'].map((name, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 32px', whiteSpace: 'nowrap',
                      fontSize: 14, fontWeight: 600, color: '#333',
                      borderRight: '1px solid rgba(255,255,255,0.06)',
                      transition: 'color 200ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#666')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#333')}
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── BENEFITS ─────────────────── */}
      <section id="benefits" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="section-reveal" style={{ marginBottom: 64 }}>
            <div className="section-label" style={{ marginBottom: 20 }}>Why TrackFund</div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: 600, margin: 0 }}>
              Built different.<br />
              <span style={{ color: '#555' }}>On purpose.</span>
            </h2>
          </div>

          <div className="section-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="card-lift"
                style={{
                  background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20, padding: '32px',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${b.accent}18`, border: `1px solid ${b.accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: b.accent, marginBottom: 20,
                }}>
                  {b.icon}
                </div>
                <div style={{ fontSize: 11, color: b.accent, fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
                  {b.label}
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.2 }}>
                  {b.title}
                </h3>
                <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7, margin: 0 }}>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── PRODUCT ─────────────────── */}
      <section id="product" style={{ padding: '120px 24px', background: '#080808', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* First showcase: text left, dashboard right */}
          <div className="section-reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 80, alignItems: 'center', marginBottom: 100 }}>
            <div>
              <div className="section-label" style={{ marginBottom: 20 }}>Product</div>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
                A dashboard that thinks with you.
              </h2>
              <p style={{ fontSize: 16, color: '#666', lineHeight: 1.7, marginBottom: 28 }}>
                Track your portfolio, monitor pool performance, and manage your position — all from a single interface backed by live onchain data.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Real-time pool analytics', 'Deposit and withdraw instantly', 'Track funded project milestones'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#888' }}>
                    <span style={{ width: 18, height: 18, background: 'rgba(99,102,241,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={10} color="#818cf8" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 32 }}>
                <Link href="/profile" className="btn-primary-lg" style={{ fontSize: 14, padding: '11px 22px' }}>
                  Open Dashboard <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: -24,
                background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <MockDashboard />
            </div>
          </div>

          {/* Second showcase: explore right, text left */}
          <div className="section-reveal" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 80, alignItems: 'center' }}>
            {/* Explore mock */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: -24,
                background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, overflow: 'hidden',
              }}>
                <div style={{ height: 36, background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                  <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-jetbrains)' }}>
                    trackfund — explore
                  </div>
                </div>
                <div style={{ padding: '14px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, fontFamily: 'var(--font-jetbrains)' }}>Labs to Watch</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {LABS.slice(0, 4).map((lab, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `hsl(${i * 60 + 220}, 60%, 20%)`, border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: `hsl(${i * 60 + 220}, 80%, 70%)` }}>
                          {lab.name[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: 'white', marginBottom: 2 }}>{lab.name}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-jetbrains)' }}>{lab.sector}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, color: '#818cf8', fontFamily: 'var(--font-jetbrains)' }}>{lab.funded}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>MUSD</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '14px', display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, height: 32, background: 'rgba(99,102,241,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#818cf8', fontWeight: 600 }}>
                    Propose Funding
                  </div>
                  <div style={{ height: 32, padding: '0 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', fontSize: 12, color: '#888' }}>
                    View All
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="section-label" style={{ marginBottom: 20 }}>Research Discovery</div>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
                Find what's worth funding.
              </h2>
              <p style={{ fontSize: 16, color: '#666', lineHeight: 1.7, marginBottom: 28 }}>
                Browse labs and projects not yet in the portfolio. Identify promising research, evaluate milestones, and propose funding directly onchain.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Explore unfunded research orgs', 'Submit funding proposals onchain', 'Track news and developments'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#888' }}>
                    <span style={{ width: 18, height: 18, background: 'rgba(124,58,237,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={10} color="#a78bfa" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 32 }}>
                <Link href="/explore" className="btn-ghost-lg" style={{ fontSize: 14, padding: '11px 22px' }}>
                  Explore Labs <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── FEATURES ─────────────────── */}
      <section id="features" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="section-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="section-label" style={{ justifyContent: 'center', marginBottom: 20 }}>Features</div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Everything you need.<br />
              <span style={{ color: '#555' }}>Nothing you don't.</span>
            </h2>
          </div>

          <div
            className="section-reveal"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: '32px 28px', background: '#050505',
                  transition: 'background 300ms',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0d0d0d')}
                onMouseLeave={e => (e.currentTarget.style.background = '#050505')}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#818cf8', marginBottom: 16,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── TESTIMONIALS ─────────────────── */}
      <section id="testimonials" style={{ padding: '120px 24px', background: '#080808', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div className="section-reveal">
            <div className="section-label" style={{ justifyContent: 'center', marginBottom: 32 }}>From the Community</div>
            <div style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.3, color: 'white', marginBottom: 40 }}>
              "TrackFund is what research funding should have always been — transparent, liquid, and governed by code rather than committee."
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white' }}>
                A
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>Dr. Alex Chen</div>
                <div style={{ fontSize: 13, color: '#555' }}>Principal Researcher, OpenMind Labs</div>
              </div>
            </div>

            {/* Stars */}
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 28 }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="#6366f1" color="#6366f1" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── CTA ─────────────────── */}
      <section id="cta" style={{ padding: '140px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: '80vw', height: '80vw', maxWidth: 800,
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 65%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />
        <div className="section-reveal" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.92, marginBottom: 28 }}>
            Start investing
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #6366f1 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              in AI research.
            </span>
          </h2>
          <p style={{ fontSize: 18, color: '#555', marginBottom: 44, lineHeight: 1.6 }}>
            Connect your wallet and back the labs building tomorrow's intelligence. Transparent, liquid, onchain.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isConnected ? (
              <Link href="/profile" className="btn-primary-lg" style={{ fontSize: 16, padding: '16px 32px' }}>
                Open Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <button onClick={() => openModal()} className="btn-primary-lg" style={{ fontSize: 16, padding: '16px 32px' }}>
                Connect Wallet <ArrowRight size={16} />
              </button>
            )}
            <Link href="/explore" className="btn-ghost-lg" style={{ fontSize: 16, padding: '15px 28px' }}>
              Explore Labs
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────── FOOTER ─────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '60px 24px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} color="white" />
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>TrackFund</span>
              </div>
              <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, maxWidth: 280, margin: '0 0 16px' }}>
                Onchain AI research investment pools on Monad testnet. Back the labs building tomorrow's intelligence.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%' }} />
                <span style={{ fontSize: 12, color: '#444', fontFamily: 'var(--font-jetbrains)' }}>Monad Testnet · Chain 10143</span>
              </div>
            </div>

            {/* Links */}
            {[
              { title: 'Product', links: [{ href: '/profile', label: 'Dashboard' }, { href: '/explore', label: 'Explore' }, { href: '/researcher', label: 'Submit Research' }, { href: '/agent', label: 'Agent' }] },
              { title: 'Invest', links: [{ href: '/profile', label: 'Deposit' }, { href: '/profile', label: 'Withdraw' }, { href: '/profile', label: 'Mint MUSD' }, { href: '/profile', label: 'Track Position' }] },
              { title: 'Platform', links: [{ href: '/admin', label: 'Admin' }, { href: '/org', label: 'Organizations' }, { href: '/explore', label: 'Projects' }, { href: '/agent', label: 'Governance' }] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 12, color: '#444', fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>
                  {col.title}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(({ href, label }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        style={{ fontSize: 14, color: '#444', textDecoration: 'none', transition: 'color 200ms' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#888')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#444')}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#333', fontFamily: 'var(--font-jetbrains)' }}>
              © 2026 TrackFund · All rights reserved
            </span>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Privacy', 'Terms', 'Contact'].map(label => (
                <span key={label} style={{ fontSize: 13, color: '#333', cursor: 'pointer', transition: 'color 200ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#666')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#333')}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom nav spacer */}
      <div style={{ height: 80 }} />
    </div>
  )
}
