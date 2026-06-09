'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { OrgAvatar } from '@/components/OrgAvatar'
import { MilestoneBar } from '@/components/MilestoneProgress'
import { ArrowLeft, Calendar, MapPin, Users, Globe, ArrowUpRight } from 'lucide-react'
import type { Org, ShowcaseProject } from '@/lib/store'

type OrgData = Org & { projects: ShowcaseProject[] }

function ProjectCard({ project }: { project: ShowcaseProject }) {
  const done = project.milestones.filter(m => m.completedAt).length
  const total = project.milestones.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const isCompleted = project.status === 'completed'

  return (
    <Link
      href={`/project/${project.id}`}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card card-lift block"
    >
      {/* Hover bg orb */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(67,56,202,0.06) 0%, transparent 60%)' }}
      />
      <div className="relative p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors" style={{ transitionTimingFunction: 'var(--ease-premium)' }}>
                {project.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
          </div>
          <div className="action-pill flex items-center gap-1 bg-foreground text-background text-xs font-bold uppercase px-2.5 py-1.5 rounded-full shrink-0" style={{ fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.1em', fontSize: '10px' }}>
            Open <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {project.tags.map(t => (
            <span key={t} className="font-label text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
          ))}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <MilestoneBar milestones={project.milestones} />
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <div className="text-right">
                <p className="font-label text-[9px] text-muted-foreground">Funded</p>
                <p className="font-mono text-sm font-bold tabular-nums">{project.fundingAmount.toLocaleString()}</p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{
                  background: isCompleted ? 'var(--primary)' : `conic-gradient(var(--primary) ${pct * 3.6}deg, var(--border) 0deg)`,
                  fontSize: '10px',
                  fontFamily: 'var(--font-jetbrains)',
                }}
              >
                {isCompleted ? '✓' : `${pct}%`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function OrgProfilePage({ params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = use(params)
  const [org, setOrg] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/orgs?wallet=${wallet}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setOrg(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [wallet])

  if (loading) return <AppShell><div className="max-w-4xl mx-auto px-8 pt-32 pb-12"><p className="font-label text-[11px] text-muted-foreground" style={{ letterSpacing: '0.4em' }}>Loading…</p></div></AppShell>

  if (!org) return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-8 pt-32 pb-12">
        <Link href="/" className="inline-flex items-center gap-2 font-label text-[11px] text-muted-foreground hover:text-foreground mb-8 transition-colors" style={{ letterSpacing: '0.3em' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <p className="text-muted-foreground">Organisation not found.</p>
      </div>
    </AppShell>
  )

  const active = org.projects.filter(p => p.status === 'active')
  const completed = org.projects.filter(p => p.status === 'completed')
  const totalFunded = org.projects.reduce((s, p) => s + p.fundingAmount, 0)
  const allMs = org.projects.flatMap(p => p.milestones)
  const doneMs = allMs.filter(m => m.completedAt).length

  return (
    <AppShell>
      {/* Dark hero header */}
      <div className="relative overflow-hidden" style={{ background: 'var(--hero-dark)', paddingTop: '5rem' }}>
        {/* Mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="mesh-blob mesh-blob-1" style={{ opacity: 0.2, width: '40vw', height: '40vw' }} />
          <div className="mesh-blob mesh-blob-2" style={{ opacity: 0.15, width: '30vw', height: '30vw' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-8 pb-20 pt-12">
          <Link href="/" className="inline-flex items-center gap-2 font-label text-[11px] text-white/40 hover:text-white/70 mb-10 transition-colors" style={{ letterSpacing: '0.3em' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Portfolio
          </Link>

          <div className="flex items-start gap-6">
            <OrgAvatar name={org.name} size="lg" />
            <div className="flex-1">
              <p className="font-label text-[11px] text-white/40 mb-2" style={{ letterSpacing: '0.4em' }}>{org.sector}</p>
              <h1 className="font-display text-white font-bold" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1 }}>{org.name}</h1>
              {org.tagline && <p className="text-white/60 mt-3 text-lg leading-relaxed max-w-lg">{org.tagline}</p>}

              {/* Meta pills */}
              <div className="flex flex-wrap gap-4 mt-4 font-label text-[11px] text-white/40" style={{ letterSpacing: '0.3em' }}>
                {org.founded && <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />Est. {org.founded}</span>}
                {org.location && <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{org.location}</span>}
                {org.teamSize > 0 && <span className="flex items-center gap-1.5"><Users className="w-3 h-3" />{org.teamSize} People</span>}
                {org.website && <a href={`https://${org.website}`} target="_blank" rel="noopener" className="flex items-center gap-1.5 hover:text-white/60 transition-colors"><Globe className="w-3 h-3" />{org.website}</a>}
              </div>
            </div>
          </div>
        </div>

        {/* Wave to cream */}
        <div className="relative w-full overflow-hidden" style={{ height: '6rem' }}>
          <div style={{ position: 'absolute', width: '120%', height: '400%', background: 'var(--wave-color)', borderRadius: '50% 50% 0 0', transform: 'translate(-10%, 30%)', bottom: 0 }} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 pb-24 space-y-16 -mt-2">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Funded', value: `${totalFunded.toLocaleString()}`, sub: 'MUSD' },
            { label: 'Active', value: active.length.toString(), sub: 'Projects' },
            { label: 'Completed', value: completed.length.toString(), sub: 'Projects', accent: true },
            { label: 'Milestones', value: `${doneMs}/${allMs.length}`, sub: 'Done' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border bg-card p-5">
              <p className="font-label text-[10px] text-muted-foreground" style={{ letterSpacing: '0.35em' }}>{s.label}</p>
              <p className="font-display text-3xl font-bold mt-2 tabular-nums" style={s.accent ? { color: 'var(--primary)' } : {}}>{s.value}</p>
              <p className="font-label text-[10px] text-muted-foreground mt-0.5" style={{ letterSpacing: '0.3em' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* About */}
        {org.description && (
          <div className="max-w-2xl space-y-3">
            <p className="font-label text-[11px] text-muted-foreground" style={{ letterSpacing: '0.4em' }}>About</p>
            <p className="text-base leading-relaxed">{org.description}</p>
          </div>
        )}

        {/* Active projects */}
        {active.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-end justify-between pb-3 border-b border-border">
              <div>
                <p className="font-label text-[11px] text-muted-foreground" style={{ letterSpacing: '0.4em' }}>In Progress</p>
                <h2 className="font-display text-3xl font-bold mt-1">Active Projects</h2>
              </div>
              <p className="font-label text-[10px] text-muted-foreground" style={{ letterSpacing: '0.3em' }}>{active.length} ongoing</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {active.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>
        )}

        {/* Completed projects */}
        {completed.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-end justify-between pb-3 border-b border-border">
              <div>
                <p className="font-label text-[11px] text-muted-foreground" style={{ letterSpacing: '0.4em' }}>Delivered</p>
                <h2 className="font-display text-3xl font-bold mt-1">Completed</h2>
              </div>
              <span className="font-label text-[10px] px-3 py-1 rounded-full" style={{ background: 'var(--accent)', color: 'var(--primary)', letterSpacing: '0.3em' }}>
                {completed.length} Finished
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completed.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
