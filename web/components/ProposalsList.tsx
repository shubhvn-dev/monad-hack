'use client'

import { useEffect, useState } from 'react'
import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ADDRESSES, TRACK_FUND_ABI, formatStatus } from '@/lib/contracts'
import { MONAD_TESTNET_ID } from '@/lib/useMonadGuard'

type ProposalMeta = { title?: string; description?: string }

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  APPROVED: 'default',
  FUNDED: 'outline',
}

function ProposalRow({ id }: { id: number }) {
  const { data } = useReadContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'proposals', args: [BigInt(id)], chainId: MONAD_TESTNET_ID,
  })
  const [meta, setMeta] = useState<ProposalMeta>({})

  useEffect(() => {
    if (!data) return
    const hash = data[2] as string
    fetch(`/api/propose?hash=${hash}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setMeta(d))
      .catch(() => {})
  }, [data])

  if (!data) return null
  const [pid, requestedAmount, , statusNum] = data
  const status = formatStatus(Number(statusNum))

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">#{pid.toString()} {meta.title ?? 'Proposal'}</span>
        <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
      </div>
      {meta.description && <p className="text-sm text-muted-foreground">{meta.description}</p>}
      <p className="text-sm">Requested: <span className="font-mono">{formatUnits(requestedAmount, 18)} MUSD</span></p>
    </div>
  )
}

export function ProposalsList() {
  const { data: count } = useReadContract({ address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'proposalCount', chainId: MONAD_TESTNET_ID })
  const ids = count ? Array.from({ length: Number(count) }, (_, i) => i) : []

  return (
    <Card>
      <CardHeader><CardTitle>Proposals ({count?.toString() ?? 0})</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {ids.length === 0 && <p className="text-sm text-muted-foreground">No proposals yet.</p>}
        {ids.map(id => <ProposalRow key={id} id={id} />)}
      </CardContent>
    </Card>
  )
}
