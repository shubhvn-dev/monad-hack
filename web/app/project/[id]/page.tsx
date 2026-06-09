'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { ArrowLeft, Calendar, CheckCircle2, Circle, ArrowUpRight } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { OrgAvatar } from '@/components/OrgAvatar'
import { MilestoneGraph } from '@/components/MilestoneProgress'
import { DepositForm } from '@/components/DepositForm'
import { ADDRESSES, TRACK_FUND_ABI, formatStatus } from '@/lib/contracts'
import { MONAD_TESTNET_ID } from '@/lib/useMonadGuard'
import type { Org, Milestone } from '@/lib/store'

type ProjectData = {
  type: 'showcase' | 'onchain'
  id: string
  title: string
  description?: string
  tags?: string[]
  status?: string
  fundingAmount?: number
  milestones: Milestone[]
  orgWallet: string
  org: Org | null
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const isNumeric = /^\d+$/.test(id)
  const [project, setProject] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)

  const { data: chainData } = useReadContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI,
    functionName: 'proposals', args: [BigInt(Math.max(0, isNumeric ? Number(id) : 0))],
    chainId: MONAD_TESTNET_ID, query: { enabled: isNumeric },
  })
  const { data: totalAssets } = useReadContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'totalAssets', chainId: MONAD_TESTNET_ID,
  })

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setProject(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const org = project?.org
  const milestones = project?.milestones ?? []
  const done = milestones.filter(m => m.completedAt).length
  const total = milestones.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const isCompleted = project?.status === 'completed'

  const displayAmount = project?.fundingAmount
    ?? (chainData ? Number(formatUnits(chainData[1], 18)) : null)
  const poolTotal = totalAssets !== undefined ? Number(formatUnits(totalAssets, 18)) : null
  const poolPct = displayAmount && poolTotal ? ((displayAmount / poolTotal) * 100).toFixed(1) : null

  if (loading) return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-8 pt-32">
        <p className="font-label text-[11px] text-muted-foreground" style={{ letterSpacing: '0.4em' }}>Loading…</p>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      {/* Dark hero */}
      <div className="relative overflow-hidden" style={{ background: 'var(--hero-dark)', paddingTop: '5rem' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="mesh-blob mesh-blob-1" style={{ opacity: 0.18, width: '35vw', height: '35vw' }} />
          <div className="mesh-blob mesh-blob-2" style={{ opacity: 0.12, width: '25vw', height: '25vw' }} />
        </div>

        <div className="relative max-w-3xl mx-auto px-8 pt-12 pb-20">
          <Link href="/" className="inline-flex items-center gap-2 font-label text-[11px] text-white/40 hover:text-white/70 mb-10 transition-colors" style={{ letterSpacing: '0.3em' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>

          {/* Org breadcrumb */}
          {org && (
            <Link href={`/org/${org.wallet}`} className="inline-flex items-center gap-2 mb-4 group">
              <OrgAvatar name={org.name} size="sm" />
              <span className="font-label text-[10px] text-white/40 group-hover:text-white/60 transition-colors" style={{ letterSpacing: '0.3em' }}>
                {org.name}
              </span>
              <ArrowUpRight className="w-3 h-3 text-white/30 group-hover:text-white/50 transition-colors" />
            </Link>
          )}

          {/* Title */}
          <h1 className="font-display font-bold text-white" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', lineHeight: 1.05 }}>
            {project?.title ?? `Project #${id}`}
          </h1>

          {/* Big number */}
          {displayAmount !== null && displayAmount !== undefined && (
            <div className="mt-6">
              <div className="flex items-end gap-3">
                <span className="font-display font-bold text-white tabular-nums" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 0.9 }}>
                  {displayAmount.toLocaleString()}
                </span>
                <div className="mb-2 space-y-0.5">
                  <p className="font-label text-[10px] text-white/40" style={{ letterSpacing: '0.4em' }}>MUSD Funded</p>
                  {poolPct && <p className="font-label text-[10px] text-white/30" style={{ letterSpacing: '0.3em' }}>{poolPct}% of pool</p>}
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {project?.tags && project.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-5">
              {project.tags.map(t => (
                <span key={t} className="font-label text-[9px] px-3 py-1 rounded-full border border-white/10 text-white/40" style={{ letterSpacing: '0.25em' }}>{t}</span>
              ))}
            </div>
          )}

          {/* Status badge */}
          <div className="mt-5 flex items-center gap-3">
            <span
              className="font-label text-[9px] px-3 py-1.5 rounded-full"
              style={{
                letterSpacing: '0.3em',
                background: isCompleted ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                color: isCompleted ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
              }}
            >
              {isCompleted ? '✓ Completed' : 'Active'}
            </span>
            <span className="font-label text-[9px] text-white/25" style={{ letterSpacing: '0.3em' }}>
              {done}/{total} milestones
            </span>
          </div>
        </div>

        {/* Wave */}
        <div className="relative w-full overflow-hidden" style={{ height: '6rem' }}>
          <div style={{ position: 'absolute', width: '120%', height: '400%', background: 'var(--wave-color)', borderRadius: '50% 50% 0 0', transform: 'translate(-10%, 30%)', bottom: 0 }} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 pb-24 space-y-12 -mt-2">

        {/* Progress stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Complete', value: `${pct}%`, accent: true },
            { label: 'Done', value: `${done}` },
            { label: 'Remaining', value: `${total - done}` },
          ].map(s => (
            <div key={s.label} className="rounded-xl border bg-card p-5 text-center">
              <p className="font-display font-bold text-3xl tabular-nums" style={s.accent ? { color: 'var(--primary)' } : {}}>
                {s.value}
              </p>
              <p className="font-label text-[10px] text-muted-foreground mt-1" style={{ letterSpacing: '0.35em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Milestone graph */}
        {milestones.length > 0 && (
          <div className="rounded-2xl border bg-card p-6 space-y-6">
            <p className="font-label text-[11px] text-muted-foreground" style={{ letterSpacing: '0.4em' }}>Progress</p>
            <MilestoneGraph milestones={milestones} />

            {/* Checklist */}
            <div className="pt-4 border-t border-border space-y-3">
              {milestones.map((m, i) => (
                <div key={m.id} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {m.completedAt
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                      : <Circle className="w-4 h-4 text-muted-foreground/40" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${m.completedAt ? 'text-foreground' : 'text-muted-foreground'}`}>{m.title}</p>
                    {m.completedAt && (
                      <p className="font-label text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1" style={{ letterSpacing: '0.25em' }}>
                        <Calendar className="w-3 h-3" />{fmt(m.completedAt)}
                      </p>
                    )}
                  </div>
                  <span className="font-label text-[9px] text-muted-foreground/40 shrink-0" style={{ letterSpacing: '0.2em' }}>0{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {project?.description && (
          <div className="space-y-3">
            <p className="font-label text-[11px] text-muted-foreground" style={{ letterSpacing: '0.4em' }}>About</p>
            <p className="text-sm leading-relaxed text-foreground/80">{project.description}</p>
          </div>
        )}

        {/* Org card */}
        {org && (
          <Link href={`/org/${org.wallet}`} className="group flex items-start gap-4 rounded-2xl border bg-card p-5 card-lift block">
            <OrgAvatar name={org.name} size="md" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-display font-bold text-lg group-hover:text-primary transition-colors" style={{ transitionTimingFunction: 'var(--ease-premium)' }}>
                  {org.name}
                </p>
                <span className="font-label text-[9px] px-2 py-0.5 rounded border border-border text-muted-foreground" style={{ letterSpacing: '0.25em' }}>{org.sector}</span>
              </div>
              {org.tagline && <p className="text-sm text-muted-foreground mt-1">{org.tagline}</p>}
              <div className="flex items-center gap-4 mt-2">
                {org.founded && <span className="font-label text-[9px] text-muted-foreground flex items-center gap-1" style={{ letterSpacing: '0.25em' }}><Calendar className="w-3 h-3" />Est. {org.founded}</span>}
                {org.teamSize > 0 && <span className="font-label text-[9px] text-muted-foreground" style={{ letterSpacing: '0.25em' }}>{org.teamSize} People</span>}
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
          </Link>
        )}

        {/* Invest */}
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <div>
            <p className="font-label text-[11px] text-muted-foreground" style={{ letterSpacing: '0.4em' }}>Back This Track</p>
            <h3 className="font-display text-2xl font-bold mt-1">Invest</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Your deposit backs all active research{org ? `, including ${org.name}` : ''}.
            </p>
          </div>
          <DepositForm compact />
        </div>
      </div>
    </AppShell>
  )
}
