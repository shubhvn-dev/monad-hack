'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import type { Org, ShowcaseProject } from '@/lib/store'

type OrgWithProjects = Org & { projects: ShowcaseProject[] }
type ProjectWithOrg  = ShowcaseProject & { orgName: string; orgWallet: string }

// ── News ──────────────────────────────────────────────────────────────

const NEWS = [
  {
    id: 1, category: 'Infrastructure', date: '2026-06-07', source: 'Monad Labs',
    title: 'Monad Testnet Sustains 10,000 TPS Under Adversarial Load',
    summary: "10,000 TPS through a 6-hour adversarial stress test. Finality latency under 500ms throughout.",
  },
  {
    id: 2, category: 'Portfolio', date: '2026-06-05', source: 'OpenMind Labs',
    title: 'OpenMind Labs Paper Accepted to NeurIPS 2026',
    summary: 'The Autonomous Research Agent introduces a closed-loop framework — hypothesis to result, no human intervention.',
  },
  {
    id: 3, category: 'Platform', date: '2026-06-04', source: 'TrackFund',
    title: 'TrackFund Pool Crosses 50,000 MUSD in Deposits',
    summary: 'Active funding for 8 projects across 4 orgs. Governance handled by Safe multisig + on-chain agent.',
  },
  {
    id: 4, category: 'Portfolio', date: '2026-06-01', source: 'NeuralStack',
    title: 'NeuralStack SDK v2 Ships Zero-Config Distributed Training',
    summary: 'Automatic cluster topology discovery, fault-tolerant checkpointing, communication scheduling optimizer.',
  },
  {
    id: 5, category: 'Research', date: '2026-05-28', source: 'Axiom AI',
    title: 'Axiom AI Proves Formal Safety Bounds for Transformer Attention',
    summary: 'SMT-based verification of hard input-output safety bounds on production-scale transformer models.',
  },
  {
    id: 6, category: 'Platform', date: '2026-05-25', source: 'TrackFund',
    title: 'TrackFund Governance Agent Live on Monad Testnet',
    summary: 'Polls ProposalCreated events, evaluates funding rules, routes qualified proposals to Safe co-signers.',
  },
] as const

const CAT: Record<string, string> = {
  Infrastructure: '#06b6d4',
  Portfolio:      '#818cf8',
  Platform:       '#f59e0b',
  Research:       '#10b981',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Page ──────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [orgs, setOrgs] = useState<OrgWithProjects[]>([])

  useEffect(() => {
    fetch('/api/discover').then(r => r.json()).then(setOrgs).catch(() => {})
  }, [])

  const projects: ProjectWithOrg[] = orgs
    .flatMap(o => o.projects.map(p => ({ ...p, orgName: o.name, orgWallet: o.wallet })))
    .sort((a, b) => {
      const ra = a.milestones.filter(m => m.completedAt).length / Math.max(a.milestones.length, 1)
      const rb = b.milestones.filter(m => m.completedAt).length / Math.max(b.milestones.length, 1)
      return rb - ra
    })

  return (
    <AppShell>
      <div style={{ padding: '40px 32px 80px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 52 }}>
          <div style={{
            fontSize: 11, color: '#6366f1', fontFamily: 'var(--font-jetbrains)',
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 5, height: 5, background: '#6366f1', borderRadius: '50%', display: 'inline-block' }} />
            Discover
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.95, marginBottom: 16 }}>
            What's out there.
          </h1>
          <p style={{ fontSize: 17, color: '#555', lineHeight: 1.6, maxWidth: 520 }}>
            Labs and projects seeking funding — not yet in the portfolio. Propose funding to bring them onchain.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 48 }}>
          {[
            { label: 'Labs to Watch',    value: orgs.length.toString() },
            { label: 'Unfunded Projects',value: projects.length.toString() },
            { label: 'Research Areas',   value: [...new Set(orgs.map(o => o.sector))].length.toString() },
            { label: 'News Items',       value: NEWS.length.toString() },
          ].map((s, i) => (
            <div key={i} style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 20px' }}>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#444' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Projects section */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Projects You'd Fund</h2>
            <span style={{ fontSize: 13, color: '#444' }}>{projects.length} unfunded</span>
          </div>

          {projects.length === 0 ? (
            <div style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 40, textAlign: 'center', color: '#444', fontSize: 14 }}>
              Loading projects…
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {projects.map(p => {
                const done  = p.milestones.filter(m => m.completedAt).length
                const total = p.milestones.length
                const pct   = total > 0 ? (done / total) * 100 : 0
                return (
                  <div
                    key={p.id}
                    className="card-lift"
                    style={{
                      background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 20, padding: 28,
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4, lineHeight: 1.3 }}>{p.title}</h3>
                        <span style={{ fontSize: 12, color: '#555' }}>{p.orgName}</span>
                      </div>
                      <span style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 9999,
                        background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                        fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.08em',
                        textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        Unfunded
                      </span>
                    </div>

                    <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 16 }}>
                      {p.description.slice(0, 100)}{p.description.length > 100 ? '…' : ''}
                    </p>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                      {p.tags.slice(0, 3).map(t => (
                        <span key={t} style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 9999,
                          border: '1px solid rgba(255,255,255,0.08)', color: '#555',
                        }}>
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#444', marginBottom: 5 }}>{done}/{total} milestones</div>
                        <div style={{ height: 3, width: 80, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#6366f1', borderRadius: 2 }} />
                        </div>
                      </div>
                      <Link
                        href="/researcher"
                        className="btn-primary"
                        style={{ fontSize: 12, padding: '7px 14px' }}
                      >
                        Propose <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Orgs section */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Labs to Watch</h2>
            <span style={{ fontSize: 13, color: '#444' }}>{orgs.length} orgs</span>
          </div>

          {orgs.length === 0 ? (
            <div style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 40, textAlign: 'center', color: '#444', fontSize: 14 }}>
              Loading labs…
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {orgs.map(org => (
                <div
                  key={org.wallet}
                  className="card-lift"
                  style={{
                    background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 20, padding: 28,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: `hsl(${org.name.charCodeAt(0) * 17 % 360}, 50%, 15%)`,
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700,
                      color: `hsl(${org.name.charCodeAt(0) * 17 % 360}, 70%, 65%)`,
                    }}>
                      {org.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>{org.name}</div>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 9999,
                        border: '1px solid rgba(255,255,255,0.08)', color: '#555',
                      }}>
                        {org.sector}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{org.teamSize}</div>
                      <div style={{ fontSize: 11, color: '#444' }}>team</div>
                    </div>
                  </div>

                  <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 16 }}>
                    {org.tagline}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 12, color: '#444' }}>
                      Est. {org.founded} · {org.location} · {org.projects.length} projects
                    </span>
                    <Link
                      href="/researcher"
                      className="btn-ghost"
                      style={{ fontSize: 12, padding: '6px 12px' }}
                    >
                      Propose Funding <ArrowUpRight size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* News section */}
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>News & Developments</h2>
            <span style={{ fontSize: 13, color: '#444' }}>{NEWS.length} recent</span>
          </div>

          <div style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
            {NEWS.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', gap: 20, padding: '22px 28px',
                  borderBottom: i < NEWS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Date */}
                <div style={{ flexShrink: 0, width: 48, paddingTop: 2 }}>
                  <div style={{ fontSize: 11, color: '#444', fontFamily: 'var(--font-jetbrains)', lineHeight: 1.4 }}>
                    {fmt(item.date)}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 9999,
                      border: `1px solid ${CAT[item.category]}30`,
                      color: CAT[item.category], fontFamily: 'var(--font-jetbrains)',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: 12, color: '#444' }}>{item.source}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, letterSpacing: '-0.01em', lineHeight: 1.4 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{item.summary}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </AppShell>
  )
}
