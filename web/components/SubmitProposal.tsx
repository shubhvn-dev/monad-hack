'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ADDRESSES, TRACK_FUND_ABI } from '@/lib/contracts'

export function SubmitProposal() {
  const { address } = useAccount()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requestedAmount, setRequestedAmount] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')

  const { writeContract, data: txHash } = useWriteContract()
  const { isLoading: isTxPending, isSuccess: isTxDone } = useWaitForTransactionReceipt({ hash: txHash })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !description || !requestedAmount || !address) return
    setStatus('submitting')
    try {
      // Store text offchain, get hash
      const res = await fetch('/api/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, requestedAmount }),
      })
      const { metadataHash } = await res.json()

      writeContract({
        address: ADDRESSES.trackFund,
        abi: TRACK_FUND_ABI,
        functionName: 'propose',
        args: [parseUnits(requestedAmount, 18), metadataHash as `0x${string}`],
      })
      setStatus('done')
      setTitle(''); setDescription(''); setRequestedAmount('')
    } catch {
      setStatus('error')
    }
  }

  if (!address) return <p className="text-sm text-muted-foreground">Connect wallet to submit a proposal.</p>

  return (
    <Card>
      <CardHeader><CardTitle>Submit Proposal</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="My AI Research Project" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="Brief description of the research" value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Requested Amount (MUSD)</Label>
            <Input id="amount" type="number" placeholder="500" value={requestedAmount} onChange={e => setRequestedAmount(e.target.value)} required />
          </div>
          <Button type="submit" disabled={status === 'submitting' || isTxPending}>
            {status === 'submitting' || isTxPending ? 'Submitting…' : 'Submit Proposal'}
          </Button>
          {isTxDone && <p className="text-sm text-green-600">Proposal submitted on-chain!</p>}
          {status === 'error' && <p className="text-sm text-red-600">Submission failed. Try again.</p>}
        </form>
      </CardContent>
    </Card>
  )
}
