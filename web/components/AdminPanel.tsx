'use client'

import { useState } from 'react'
import { useAccount, useReadContract, usePublicClient, useWriteContract } from 'wagmi'
import { formatUnits, isAddress } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ADDRESSES, TRACK_FUND_ABI, formatStatus } from '@/lib/contracts'
import { useMonadGuard, MONAD_TESTNET_ID } from '@/lib/useMonadGuard'

const ADMIN_ADDRESS = '0xE3FE175f63074033Adaf65e01A5417aAE852C721'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  PENDING: 'secondary', APPROVED: 'default', FUNDED: 'outline',
}

function ProposalAdminRow({ id, onDone }: { id: number; onDone: () => void }) {
  const { ensureMonad } = useMonadGuard()
  const publicClient = usePublicClient({ chainId: MONAD_TESTNET_ID })
  const { writeContractAsync } = useWriteContract()
  const [wallet, setWallet] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [addingMilestone, setAddingMilestone] = useState(false)

  const { data } = useReadContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'proposals',
    args: [BigInt(id)], chainId: MONAD_TESTNET_ID,
  })

  const [milestones, setMilestones] = useState<{ id: number; title: string; completedAt?: string }[]>([])
  const [milestonesLoaded, setMilestonesLoaded] = useState(false)

  async function loadMilestones() {
    if (milestonesLoaded) return
    const r = await fetch(`/api/projects/${id}`)
    if (r.ok) {
      const d = await r.json()
      setMilestones(d.milestones ?? [])
    }
    setMilestonesLoaded(true)
  }

  if (!data) return null
  const [pid, requestedAmount, , statusNum] = data
  const status = formatStatus(Number(statusNum))

  async function handleApproveAndFund() {
    if (!isAddress(wallet)) { setError('Invalid address'); return }
    setError(''); setBusy(true)
    try {
      await ensureMonad()
      const hash = await writeContractAsync({
        address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'approveAndFund',
        args: [BigInt(id), wallet as `0x${string}`], chainId: MONAD_TESTNET_ID,
      })
      await publicClient!.waitForTransactionReceipt({ hash })
      onDone()
    } catch (e: any) {
      console.error('[AdminPanel]', e)
      setError(e?.shortMessage ?? e?.cause?.shortMessage ?? e?.message ?? 'Failed')
    } finally { setBusy(false) }
  }

  async function handleAddMilestone() {
    if (!milestoneTitle.trim()) return
    setAddingMilestone(true)
    await fetch(`/api/projects/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: milestoneTitle }),
    })
    setMilestoneTitle('')
    const r = await fetch(`/api/projects/${id}`)
    if (r.ok) { const d = await r.json(); setMilestones(d.milestones ?? []) }
    setAddingMilestone(false)
  }

  async function handleComplete(milestoneId: number) {
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestoneId }),
    })
    const r = await fetch(`/api/projects/${id}`)
    if (r.ok) { const d = await r.json(); setMilestones(d.milestones ?? []) }
  }

  return (
    <div className="border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">Proposal #{pid.toString()}</span>
        <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground font-mono">{formatUnits(requestedAmount, 18)} MUSD requested</p>

      {status === 'PENDING' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Project wallet (0x…)" value={wallet} onChange={e => setWallet(e.target.value)} className="font-mono text-sm flex-1" />
            <Button onClick={handleApproveAndFund} disabled={busy || !wallet} size="sm">
              {busy ? 'Processing…' : 'Approve & Fund'}
            </Button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}

      {/* Milestone management */}
      <div className="space-y-2">
        <button onClick={loadMilestones} className="text-xs text-muted-foreground underline">
          {milestonesLoaded ? 'Milestones' : 'Load milestones'}
        </button>
        {milestonesLoaded && (
          <div className="space-y-2 pl-2">
            {milestones.map(m => (
              <div key={m.id} className="flex items-center justify-between gap-2">
                <span className={`text-sm ${m.completedAt ? 'line-through text-muted-foreground' : ''}`}>{m.title}</span>
                {!m.completedAt && (
                  <Button size="sm" variant="outline" onClick={() => handleComplete(m.id)} className="h-6 text-xs px-2">
                    Complete
                  </Button>
                )}
                {m.completedAt && <span className="text-xs text-green-600">✓</span>}
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="New milestone…" value={milestoneTitle}
                onChange={e => setMilestoneTitle(e.target.value)}
                className="text-sm h-8" onKeyDown={e => e.key === 'Enter' && handleAddMilestone()}
              />
              <Button size="sm" variant="outline" onClick={handleAddMilestone} disabled={addingMilestone} className="h-8">
                Add
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function AdminPanel() {
  const { address } = useAccount()
  const { data: count, refetch } = useReadContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'proposalCount', chainId: MONAD_TESTNET_ID,
  })
  const { data: totalAssets } = useReadContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'totalAssets', chainId: MONAD_TESTNET_ID,
  })

  // Org registration
  const [orgName, setOrgName] = useState('')
  const [orgTagline, setOrgTagline] = useState('')
  const [orgDesc, setOrgDesc] = useState('')
  const [orgCategory, setOrgCategory] = useState('')
  const [orgSaved, setOrgSaved] = useState(false)

  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()

  async function saveOrg() {
    if (!address || !orgName) return
    await fetch('/api/orgs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: address, name: orgName, tagline: orgTagline, description: orgDesc, category: orgCategory }),
    })
    setOrgSaved(true)
  }

  if (!address) return <p className="text-sm text-muted-foreground">Connect wallet.</p>
  if (!isAdmin) return (
    <Card><CardContent className="pt-6">
      <p className="text-sm text-red-600">Not admin. Connect {ADMIN_ADDRESS.slice(0, 6)}…{ADMIN_ADDRESS.slice(-4)}.</p>
    </CardContent></Card>
  )

  const ids = count ? Array.from({ length: Number(count) }, (_, i) => i) : []

  return (
    <div className="space-y-6">
      {/* Org identity */}
      <Card>
        <CardHeader><CardTitle>Org Identity</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Org Name</Label>
              <Input placeholder="OpenMind Labs" value={orgName} onChange={e => setOrgName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Input placeholder="AI Research" value={orgCategory} onChange={e => setOrgCategory(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Tagline</Label>
            <Input placeholder="Building autonomous AI agents" value={orgTagline} onChange={e => setOrgTagline(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea placeholder="About your org…" value={orgDesc} onChange={e => setOrgDesc(e.target.value)} rows={3} />
          </div>
          <Button onClick={saveOrg} size="sm" disabled={!orgName}>Save Org</Button>
          {orgSaved && <p className="text-xs text-green-600">Saved.</p>}
        </CardContent>
      </Card>

      {/* Fund stats */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Pool: <span className="font-mono font-medium">{totalAssets !== undefined ? formatUnits(totalAssets, 18) : '—'} MUSD</span>
          </p>
        </CardContent>
      </Card>

      {/* Proposals */}
      <Card>
        <CardHeader><CardTitle>Projects ({count?.toString() ?? 0})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {ids.length === 0 && <p className="text-sm text-muted-foreground">No proposals yet.</p>}
          {ids.map(id => <ProposalAdminRow key={id} id={id} onDone={() => refetch()} />)}
        </CardContent>
      </Card>
    </div>
  )
}
