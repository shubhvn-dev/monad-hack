'use client'

import { useState } from 'react'
import { useAccount, useReadContract, usePublicClient, useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ADDRESSES, TRACK_FUND_ABI } from '@/lib/contracts'
import { useMonadGuard, MONAD_TESTNET_ID } from '@/lib/useMonadGuard'

export function SubmitProposal() {
  const { address } = useAccount()
  const { ensureMonad } = useMonadGuard()
  const publicClient = usePublicClient({ chainId: MONAD_TESTNET_ID })
  const { writeContractAsync } = useWriteContract()

  // Org fields
  const [orgName, setOrgName] = useState('')
  const [orgTagline, setOrgTagline] = useState('')
  const [orgDesc, setOrgDesc] = useState('')
  const [orgCategory, setOrgCategory] = useState('')

  // Project fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requestedAmount, setRequestedAmount] = useState('')

  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')

  // Read current proposal count so we know the next ID
  const { data: proposalCount } = useReadContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'proposalCount', chainId: MONAD_TESTNET_ID,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !description || !requestedAmount || !address) return
    setStatus('submitting')
    try {
      await ensureMonad()

      // Register org
      if (orgName) {
        await fetch('/api/orgs', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: address, name: orgName, tagline: orgTagline, description: orgDesc, category: orgCategory }),
        })
      }

      const nextId = Number(proposalCount ?? 0)

      // Store proposal text + link to org
      const res = await fetch('/api/propose', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, requestedAmount, orgWallet: address, proposalId: nextId }),
      })
      const { metadataHash } = await res.json()

      // Submit on-chain
      const hash = await writeContractAsync({
        address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'propose',
        args: [parseUnits(requestedAmount, 18), metadataHash as `0x${string}`],
        chainId: MONAD_TESTNET_ID,
      })
      await publicClient!.waitForTransactionReceipt({ hash })

      setStatus('done')
      setTitle(''); setDescription(''); setRequestedAmount('')
    } catch {
      setStatus('error')
    }
  }

  if (!address) return <p className="text-sm text-muted-foreground">Connect wallet to submit.</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Org section */}
      <Card>
        <CardHeader><CardTitle>Your Organisation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input placeholder="OpenMind Labs" value={orgName} onChange={e => setOrgName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Input placeholder="AI Research" value={orgCategory} onChange={e => setOrgCategory(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Tagline</Label>
            <Input placeholder="One-line mission statement" value={orgTagline} onChange={e => setOrgTagline(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>About</Label>
            <Textarea placeholder="What does your org do?" value={orgDesc} onChange={e => setOrgDesc(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Project section */}
      <Card>
        <CardHeader><CardTitle>Project Proposal</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Project Title *</Label>
            <Input placeholder="Autonomous Agent Research v2" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Description *</Label>
            <Textarea placeholder="What will you build? What's the outcome?" value={description} onChange={e => setDescription(e.target.value)} rows={4} required />
          </div>
          <div className="space-y-1">
            <Label>Funding Request (MUSD) *</Label>
            <Input type="number" placeholder="5000" value={requestedAmount} onChange={e => setRequestedAmount(e.target.value)} required />
          </div>
          <Button type="submit" disabled={status === 'submitting'} className="w-full">
            {status === 'submitting' ? 'Submitting…' : 'Submit Proposal'}
          </Button>
          {status === 'done' && <p className="text-sm text-green-600 text-center">Proposal submitted on-chain!</p>}
          {status === 'error' && <p className="text-sm text-red-600 text-center">Submission failed. Try again.</p>}
        </CardContent>
      </Card>
    </form>
  )
}
