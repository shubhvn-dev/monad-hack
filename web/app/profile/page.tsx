'use client'

import { useEffect, useState } from 'react'
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { DepositForm } from '@/components/DepositForm'
import { WithdrawForm } from '@/components/WithdrawForm'
import { ADDRESSES, ERC20_ABI, TRACK_FUND_ABI } from '@/lib/contracts'
import { useMonadGuard, MONAD_TESTNET_ID } from '@/lib/useMonadGuard'
import { useModal } from '@getpara/react-sdk'
import { ArrowRight, ArrowUpRight, TrendingUp, Wallet, Coins, PieChart, DollarSign } from 'lucide-react'
import type { Org, ShowcaseProject } from '@/lib/store'

type OrgWithProjects = Org & { projects: ShowcaseProject[] }
type ProjectWithOrg  = ShowcaseProject & { orgName: string }

// ── Chart ─────────────────────────────────────────────────────────────

const PERIODS = ['1H', '1D', '1W', '1M'] as const
type Period = typeof PERIODS[number]

function mockData(n: number) {
  let v = 10000
  return Array.from({ length: n }, (_, i) => {
    v += Math.sin(i * 0.42) * 900 + Math.cos(i * 0.19) * 600 + 160
    return Math.max(5000, v)
  })
}

const CHART: Record<Period, number[]> = {
  '1H': mockData(60), '1D': mockData(24), '1W': mockData(42), '1M': mockData(30),
}

function PoolChart({ period }: { period: Period }) {
  const W = 560, H = 160
  const PL = 54, PR = 12, PT = 10, PB = 24
  const data = CHART[period]
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1

  const pts = data.map((v, i) => {
    const x = PL + (i / (data.length - 1)) * (W - PL - PR)
    const y = PT + (1 - (v - min) / rng) * (H - PT - PB)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const fillPts = pts + ` ${(PL + (W - PL - PR)).toFixed(1)},${(H - PB).toFixed(1)} ${PL},${(H - PB).toFixed(1)}`

  const gridY = [0, 0.25, 0.5, 0.75, 1].map(p => ({
    y: PT + p * (H - PT - PB),
    v: max - p * rng,
  }))

  const xLabels = [0, 1, 2, 3, 4].map(k => {
    const i = Math.round(k * (data.length - 1) / 4)
    const x = PL + (i / (data.length - 1)) * (W - PL - PR)
    const label = period === '1H' ? `${60 - i}m` : period === '1D' ? `${24 - i}h` : period === '1W' ? `${42 - i}h` : `d${i + 1}`
    return { x, label }
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map(({ y, v }) => (
        <g key={y}>
          <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
          <text x={PL - 6} y={y + 4} fill="#444" fontSize={9} textAnchor="end" fontFamily="var(--font-jetbrains)">
            {(v / 1000).toFixed(1)}K
          </text>
        </g>
      ))}
      {xLabels.map(({ x, label }) => (
        <text key={label} x={x} y={H} fill="#444" fontSize={9} textAnchor="middle" fontFamily="var(--font-jetbrains)">{label}</text>
      ))}
      <polygon points={fillPts} fill="url(#chartFill)" />
      <polyline points={pts} fill="none" stroke="#6366f1" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <circle
        cx={PL + (W - PL - PR)} cy={PT + (1 - (data[data.length - 1] - min) / rng) * (H - PT - PB)}
        r={4} fill="#6366f1" vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

// ── Mint panel ────────────────────────────────────────────────────────

function MintPanel({ address }: { address: string }) {
  const { ensureMonad } = useMonadGuard()
  const publicClient = usePublicClient({ chainId: MONAD_TESTNET_ID })
  const { writeContractAsync } = useWriteContract()
  const [amount, setAmount] = useState('1000')
  const [step, setStep] = useState<'idle' | 'pending' | 'done' | 'error'>('idle')
  const [err, setErr] = useState('')

  async function mint() {
    if (!amount || Number(amount) <= 0) return
    setStep('pending'); setErr('')
    try {
      await ensureMonad()
      const hash = await writeContractAsync({
        address: ADDRESSES.mockUSD, abi: ERC20_ABI, functionName: 'mint',
        args: [address as `0x${string}`, parseUnits(amount, 18)], chainId: MONAD_TESTNET_ID,
      })
      await publicClient!.waitForTransactionReceipt({ hash })
      setStep('done'); setTimeout(() => setStep('idle'), 2500)
    } catch (e: any) {
      setErr(e?.shortMessage ?? e?.message ?? 'Failed'); setStep('error')
    }
  }

  return (
    <div>
      <p style={{ fontSize: 14, color: '#555', marginBottom: 14, lineHeight: 1.6 }}>
        MockUSD is a free test token. Mint any amount, then invest in the research track.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="1000"
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, color: 'white', fontSize: 14, padding: '10px 14px', outline: 'none',
            fontFamily: 'var(--font-jetbrains)',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
        />
        <button
          onClick={mint}
          disabled={step === 'pending' || !amount}
          className="btn-primary"
          style={{ flexShrink: 0 }}
        >
          {step === 'pending' ? 'Minting…' : step === 'done' ? '✓ Done' : 'Mint'}
        </button>
      </div>
      {err && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 8 }}>{err}</p>}
    </div>
  )
}

// ── Card wrapper ──────────────────────────────────────────────────────

function ActionCard({ icon, label, title, children }: {
  icon: React.ReactNode; label: string; title: string; children: React.ReactNode
}) {
  return (
    <div style={{
      flex: 1, background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#818cf8', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6366f1', fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{title}</h3>
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Not connected ─────────────────────────────────────────────────────

function NotConnected() {
  const { openModal } = useModal()
  return (
    <AppShell>
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px', color: '#818cf8',
          }}>
            <Wallet size={28} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 12 }}>Connect your wallet</h1>
          <p style={{ fontSize: 16, color: '#555', lineHeight: 1.7, marginBottom: 32 }}>
            View your position, manage deposits, and track funded research.
          </p>
          <button onClick={() => openModal()} className="btn-primary-lg">
            Connect Wallet <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </AppShell>
  )
}

// ── Page ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const [orgs, setOrgs] = useState<OrgWithProjects[]>([])
  const [period, setPeriod] = useState<Period>('1W')

  const { data: musdBalance } = useReadContract({
    address: ADDRESSES.mockUSD, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined, chainId: MONAD_TESTNET_ID, query: { enabled: !!address },
  })
  const { data: trackBalance } = useReadContract({
    address: ADDRESSES.trackToken, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined, chainId: MONAD_TESTNET_ID, query: { enabled: !!address },
  })
  const { data: totalSupply } = useReadContract({
    address: ADDRESSES.trackToken, abi: ERC20_ABI, functionName: 'totalSupply', chainId: MONAD_TESTNET_ID,
  })
  const { data: totalAssets } = useReadContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'totalAssets', chainId: MONAD_TESTNET_ID,
  })

  useEffect(() => {
    fetch('/api/orgs').then(r => r.json()).then(setOrgs).catch(() => {})
  }, [])

  if (!isConnected) return <NotConnected />

  const fmtN = (v: bigint | undefined) =>
    v !== undefined ? Number(formatUnits(v, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'

  const pctNum = trackBalance && totalSupply && totalSupply > 0n
    ? (Number(trackBalance) / Number(totalSupply)) * 100 : null
  const pct = pctNum !== null ? `${pctNum.toFixed(2)}%` : '—'

  const positionValue = trackBalance && totalAssets && totalSupply && totalSupply > 0n
    ? Number(((Number(trackBalance) / Number(totalSupply)) * Number(formatUnits(totalAssets, 18))).toFixed(2)).toLocaleString()
    : '—'

  const poolTotal = totalAssets !== undefined
    ? Number(formatUnits(totalAssets, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : '—'

  const hasPosition = trackBalance !== undefined && trackBalance > 0n

  const watchlist: ProjectWithOrg[] = orgs
    .flatMap(o => o.projects.map(p => ({ ...p, orgName: o.name })))
    .filter(p => p.status === 'active')
    .sort((a, b) => {
      const ra = a.milestones.filter(m => m.completedAt).length / Math.max(a.milestones.length, 1)
      const rb = b.milestones.filter(m => m.completedAt).length / Math.max(b.milestones.length, 1)
      return rb - ra
    })
    .slice(0, 6)

  const METRICS = [
    { icon: <DollarSign size={18} />, label: 'MUSD Balance',   value: fmtN(musdBalance),  sub: 'available to invest' },
    { icon: <Coins size={18} />,      label: 'TRACK Tokens',   value: fmtN(trackBalance), sub: 'pool share tokens' },
    { icon: <PieChart size={18} />,   label: 'Pool Share',     value: pct,                sub: 'of total supply' },
    { icon: <TrendingUp size={18} />, label: 'Position Value', value: positionValue,      sub: 'MUSD equivalent' },
  ]

  return (
    <AppShell>
      <div style={{ padding: '40px 32px 80px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: '#6366f1', fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5, height: 5, background: '#6366f1', borderRadius: '50%', display: 'inline-block' }} />
            Dashboard
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.1 }}>
            Your Portfolio
          </h1>
          <p style={{ fontSize: 14, color: '#444', fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.04em' }}>
            {address?.slice(0, 14)}…{address?.slice(-10)}
          </p>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {METRICS.map((m, i) => (
            <div key={i} style={{
              background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: '22px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ color: '#444' }}>{m.icon}</span>
                <span style={{ fontSize: 11, color: '#444', fontFamily: 'var(--font-jetbrains)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>
                {m.value}
              </div>
              <div style={{ fontSize: 12, color: '#444' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Chart + watchlist */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12, marginBottom: 20 }}>

          {/* Chart */}
          <div style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: '#444', fontFamily: 'var(--font-jetbrains)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Pool Performance</div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{poolTotal} <span style={{ fontSize: 14, color: '#555', fontWeight: 400 }}>MUSD</span></div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {PERIODS.map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    style={{
                      padding: '5px 10px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, transition: 'all 200ms',
                      background: p === period ? 'rgba(99,102,241,0.2)' : 'transparent',
                      color: p === period ? '#818cf8' : '#444',
                    }}
                  >{p}</button>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 16px 12px' }}>
              <PoolChart period={period} />
            </div>
            {hasPosition && (
              <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 28 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#444', marginBottom: 2 }}>Your share</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#818cf8' }}>{pct}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#444', marginBottom: 2 }}>Position value</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{positionValue} MUSD</div>
                </div>
              </div>
            )}
          </div>

          {/* Watchlist */}
          <div style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Funded Projects</div>
              <div style={{ fontSize: 12, color: '#444' }}>{watchlist.length}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {watchlist.length === 0 ? (
                <div style={{ padding: '20px 18px', fontSize: 13, color: '#444' }}>Loading…</div>
              ) : watchlist.map((p, i) => {
                const done = p.milestones.filter(m => m.completedAt).length
                const total = p.milestones.length
                const pctVal = total > 0 ? (done / total) * 100 : 0
                return (
                  <Link key={p.id} href={`/project/${p.id}`} style={{ display: 'block', textDecoration: 'none', padding: '12px 18px', borderBottom: i < watchlist.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 150ms' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, color: 'white', fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: '#444', flexShrink: 0, marginLeft: 8 }}>{done}/{total}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#444', marginBottom: 6 }}>{p.orgName}</div>
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pctVal}%`, background: '#6366f1', borderRadius: 1, transition: 'width 400ms' }} />
                    </div>
                  </Link>
                )
              })}
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Link href="/explore" style={{ fontSize: 13, color: '#444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 200ms' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#888')}
                onMouseLeave={e => (e.currentTarget.style.color = '#444')}
              >
                Explore more <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* Action cards */}
        <div style={{ display: 'flex', gap: 12 }}>
          <ActionCard icon={<TrendingUp size={18} />} label="Research Track" title="Invest">
            <DepositForm compact />
          </ActionCard>

          <ActionCard icon={<Coins size={18} />} label="Exit Position" title="Withdraw">
            {hasPosition
              ? <WithdrawForm compact />
              : <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7 }}>No position yet. Deposit MUSD to start investing.</p>
            }
          </ActionCard>

          <ActionCard icon={<DollarSign size={18} />} label="Test Tokens" title="Mint MUSD">
            <MintPanel address={address!} />
          </ActionCard>
        </div>

      </div>
    </AppShell>
  )
}
