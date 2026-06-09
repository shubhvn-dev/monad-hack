'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, usePublicClient, useWriteContract } from 'wagmi'
import { formatUnits, parseUnits, isAddress } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { OrgAvatar } from '@/components/OrgAvatar'
import { MilestoneGraph } from '@/components/MilestoneProgress'
import { ADDRESSES, TRACK_FUND_ABI, ERC20_ABI, formatStatus } from '@/lib/contracts'
import { useMonadGuard, MONAD_TESTNET_ID } from '@/lib/useMonadGuard'
import type { Org, ShowcaseProject, ProjectMeta, Milestone } from '@/lib/store'
import { Calendar, MapPin, Users, Globe, ChevronDown, ChevronUp } from 'lucide-react'

// ── Org setup form ────────────────────────────────────────────────────
function OrgSetup({ address, onSaved }: { address: string; onSaved: (org: Org) => void }) {
  const [f, setF] = useState({ name: '', tagline: '', description: '', category: '', sector: '', founded: '', location: '', teamSize: '', website: '' })

  function set(k: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(prev => ({ ...prev, [k]: e.target.value })) }

  async function save() {
    if (!f.name) return
    const org: Org = { wallet: address, name: f.name, tagline: f.tagline, description: f.description, category: f.category || 'AI Research', sector: f.sector || 'Research', founded: f.founded || new Date().getFullYear().toString(), location: f.location || 'Remote', teamSize: Number(f.teamSize) || 1, website: f.website || undefined }
    await fetch('/api/orgs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(org) })
    onSaved(org)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Set up your org</h1>
        <p className="text-muted-foreground mt-1">Tell investors about your organisation.</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Name *</Label><Input placeholder="OpenMind Labs" value={f.name} onChange={set('name')} /></div>
            <div className="space-y-1"><Label>Sector</Label><Input placeholder="AI Research" value={f.sector} onChange={set('sector')} /></div>
          </div>
          <div className="space-y-1"><Label>Tagline</Label><Input placeholder="One-line mission" value={f.tagline} onChange={set('tagline')} /></div>
          <div className="space-y-1"><Label>About</Label><Textarea placeholder="What does your org do?" value={f.description} onChange={set('description')} rows={3} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1"><Label>Founded</Label><Input placeholder="2023" value={f.founded} onChange={set('founded')} /></div>
            <div className="space-y-1"><Label>Location</Label><Input placeholder="SF, CA" value={f.location} onChange={set('location')} /></div>
            <div className="space-y-1"><Label>Team size</Label><Input type="number" placeholder="8" value={f.teamSize} onChange={set('teamSize')} /></div>
          </div>
          <div className="space-y-1"><Label>Website</Label><Input placeholder="yourorg.xyz" value={f.website} onChange={set('website')} /></div>
          <Button onClick={save} disabled={!f.name} className="w-full">Create Org</Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Add project form ──────────────────────────────────────────────────
function AddProjectForm({ address, nextId, onSubmitted }: { address: string; nextId: number; onSubmitted: () => void }) {
  const { ensureMonad } = useMonadGuard()
  const publicClient = usePublicClient({ chainId: MONAD_TESTNET_ID })
  const { writeContractAsync } = useWriteContract()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ title: '', description: '', amount: '', milestones: '', tags: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function set(k: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(prev => ({ ...prev, [k]: e.target.value })) }

  async function submit() {
    if (!f.title || !f.description || !f.amount) return
    setBusy(true); setError('')
    try {
      await ensureMonad()
      const res = await fetch('/api/propose', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: f.title, description: f.description, requestedAmount: f.amount, orgWallet: address, proposalId: nextId }),
      })
      const { metadataHash } = await res.json()
      if (f.milestones.trim()) {
        for (const title of f.milestones.split('\n').map(s => s.trim()).filter(Boolean)) {
          await fetch(`/api/projects/${nextId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) })
        }
      }
      const hash = await writeContractAsync({
        address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'propose',
        args: [parseUnits(f.amount, 18), metadataHash as `0x${string}`], chainId: MONAD_TESTNET_ID,
      })
      await publicClient!.waitForTransactionReceipt({ hash })
      setF({ title: '', description: '', amount: '', milestones: '', tags: '' })
      setOpen(false)
      onSubmitted()
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? 'Failed')
    } finally { setBusy(false) }
  }

  if (!open) return <Button size="sm" onClick={() => setOpen(true)}>+ Add Project</Button>

  return (
    <Card>
      <CardHeader><CardTitle>New Project</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1"><Label>Title *</Label><Input placeholder="Autonomous Agent v2" value={f.title} onChange={set('title')} /></div>
        <div className="space-y-1"><Label>Description *</Label><Textarea placeholder="What will you build?" value={f.description} onChange={set('description')} rows={3} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>Funding (MUSD) *</Label><Input type="number" placeholder="5000" value={f.amount} onChange={set('amount')} /></div>
          <div className="space-y-1"><Label>Tags</Label><Input placeholder="agents, reasoning" value={f.tags} onChange={set('tags')} /></div>
        </div>
        <div className="space-y-1"><Label>Milestones (one per line)</Label><Textarea placeholder={"Prototype\nBeta\nRelease"} value={f.milestones} onChange={set('milestones')} rows={3} /></div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={submit} disabled={busy || !f.title || !f.amount}>{busy ? 'Submitting…' : 'Submit'}</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Project card (org view) ───────────────────────────────────────────
function OrgProjectCard({ project, onUpdate }: { project: ShowcaseProject; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [newMs, setNewMs] = useState('')
  const [localProject, setLocalProject] = useState(project)

  async function addMilestone() {
    if (!newMs.trim()) return
    const newMilestone: Milestone = { id: localProject.milestones.length, title: newMs.trim() }
    setLocalProject(p => ({ ...p, milestones: [...p.milestones, newMilestone] }))
    setNewMs('')
    // persist to any on-chain linked project
    onUpdate()
  }

  async function completeMilestone(id: number) {
    setLocalProject(p => ({
      ...p,
      milestones: p.milestones.map(m => m.id === id ? { ...m, completedAt: new Date().toISOString() } : m)
    }))
    onUpdate()
  }

  const done = localProject.milestones.filter(m => m.completedAt).length
  const total = localProject.milestones.length
  const isCompleted = localProject.status === 'completed'

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{localProject.title}</h3>
            <Badge variant={isCompleted ? 'outline' : 'secondary'} className="text-xs">
              {isCompleted ? '✓ Completed' : 'Active'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{localProject.description}</p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {localProject.tags.map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">{t}</span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono font-bold text-sm tabular-nums">{localProject.fundingAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">MUSD</p>
        </div>
      </div>

      {/* Milestone graph */}
      <div className="px-5 pb-4">
        <MilestoneGraph milestones={localProject.milestones} />
      </div>

      {/* Expand for management */}
      <div className="border-t">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full px-5 py-2.5 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Manage milestones</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {expanded && (
          <div className="px-5 pb-4 space-y-2">
            {localProject.milestones.map(m => (
              <div key={m.id} className="flex items-center justify-between gap-2">
                <span className={`text-sm ${m.completedAt ? 'line-through text-muted-foreground' : ''}`}>{m.title}</span>
                {!m.completedAt && (
                  <Button size="sm" variant="ghost" className="h-6 text-xs px-2 shrink-0" style={{ color: 'var(--primary)' }} onClick={() => completeMilestone(m.id)}>
                    Mark done
                  </Button>
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Input className="text-sm h-8 flex-1" placeholder="New milestone…" value={newMs} onChange={e => setNewMs(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMilestone()} />
              <Button size="sm" variant="outline" className="h-8" onClick={addMilestone}>Add</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── On-chain project row (proposals submitted) ─────────────────────────
function OnChainProjectRow({ id, orgAddress, onUpdate }: { id: number; orgAddress: string; onUpdate: () => void }) {
  const { ensureMonad } = useMonadGuard()
  const publicClient = usePublicClient({ chainId: MONAD_TESTNET_ID })
  const { writeContractAsync } = useWriteContract()
  const [fundWallet, setFundWallet] = useState(orgAddress)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const { data } = useReadContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'proposals', args: [BigInt(id)], chainId: MONAD_TESTNET_ID,
  })

  if (!data) return null
  const [pid, requestedAmount, , statusNum] = data
  const status = formatStatus(Number(statusNum))

  async function fund() {
    if (!isAddress(fundWallet)) { setError('Invalid address'); return }
    setBusy(true); setError('')
    try {
      await ensureMonad()
      const hash = await writeContractAsync({
        address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'approveAndFund',
        args: [BigInt(id), fundWallet as `0x${string}`], chainId: MONAD_TESTNET_ID,
      })
      await publicClient!.waitForTransactionReceipt({ hash })
      onUpdate()
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.cause?.shortMessage ?? e?.message ?? 'Failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium">On-chain Proposal #{pid.toString()}</p>
        <Badge variant={status === 'PENDING' ? 'secondary' : status === 'FUNDED' ? 'outline' : 'default'}>{status}</Badge>
      </div>
      <p className="text-sm font-mono text-muted-foreground">{formatUnits(requestedAmount, 18)} MUSD requested</p>
      {status === 'PENDING' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input className="font-mono text-sm flex-1" value={fundWallet} onChange={e => setFundWallet(e.target.value)} placeholder="Receiving wallet" />
            <Button size="sm" onClick={fund} disabled={busy}>{busy ? 'Funding…' : 'Fund'}</Button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}

// ── Main org dashboard ────────────────────────────────────────────────
export function OrgDashboard() {
  const { address } = useAccount()
  const [org, setOrg] = useState<(Org & { projects: ShowcaseProject[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const { data: totalAssets } = useReadContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'totalAssets', chainId: MONAD_TESTNET_ID,
  })
  const { data: totalSupply } = useReadContract({
    address: ADDRESSES.trackToken, abi: ERC20_ABI, functionName: 'totalSupply', chainId: MONAD_TESTNET_ID,
  })
  const { data: proposalCount, refetch: refetchCount } = useReadContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'proposalCount', chainId: MONAD_TESTNET_ID,
  })

  useEffect(() => {
    if (!address) { setLoading(false); return }
    fetch(`/api/orgs?wallet=${address}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setOrg(d))
      .finally(() => setLoading(false))
  }, [address])

  if (!address) return (
    <div className="text-center py-20">
      <p className="font-display text-2xl font-semibold mb-2">Org Dashboard</p>
      <p className="text-muted-foreground">Connect your wallet to manage your organisation.</p>
    </div>
  )
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!org) return <OrgSetup address={address} onSaved={o => setOrg({ ...o, projects: [] })} />

  const ids = proposalCount ? Array.from({ length: Number(proposalCount) }, (_, i) => i) : []
  const completedProjects = org.projects.filter(p => p.status === 'completed').length

  return (
    <div className="space-y-8">
      {/* Org hero */}
      <div className="flex items-start gap-5">
        <OrgAvatar name={org.name} size="lg" />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold">{org.name}</h1>
          {org.tagline && <p className="text-muted-foreground mt-1">{org.tagline}</p>}

          {/* Metadata pills */}
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
            {org.founded && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Est. {org.founded}
              </span>
            )}
            {org.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {org.location}
              </span>
            )}
            {org.teamSize > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {org.teamSize} people
              </span>
            )}
            {org.website && (
              <a href={`https://${org.website}`} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Globe className="w-3 h-3" />
                {org.website}
              </a>
            )}
          </div>

          {org.description && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-lg">{org.description}</p>
          )}
        </div>
      </div>

      {/* Pool stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pool available', value: totalAssets !== undefined ? `${Number(formatUnits(totalAssets, 18)).toLocaleString()} MUSD` : '—' },
          { label: 'Total invested', value: totalSupply !== undefined ? `${Number(formatUnits(totalSupply, 18)).toLocaleString()} tokens` : '—' },
          { label: 'Projects completed', value: completedProjects.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="font-mono font-bold text-lg mt-1 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Showcase projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Projects</h2>
          <AddProjectForm address={address} nextId={Number(proposalCount ?? 0)} onSubmitted={() => { refetchCount(); setTick(t => t + 1) }} />
        </div>
        {org.projects.length === 0 && ids.length === 0 && (
          <p className="text-sm text-muted-foreground">No projects yet. Add your first one.</p>
        )}
        {org.projects.map(p => <OrgProjectCard key={p.id} project={p} onUpdate={() => setTick(t => t + 1)} />)}
      </div>

      {/* On-chain proposals */}
      {ids.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Funding Proposals</h2>
          {ids.map(id => <OnChainProjectRow key={`${id}-${tick}`} id={id} orgAddress={address} onUpdate={() => refetchCount()} />)}
        </div>
      )}
    </div>
  )
}
