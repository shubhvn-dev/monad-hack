'use client'

import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ADDRESSES, TRACK_FUND_ABI } from '@/lib/contracts'
import { MONAD_TESTNET_ID } from '@/lib/useMonadGuard'

export function TrackInfo() {
  const { data: name } = useReadContract({ address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'name', chainId: MONAD_TESTNET_ID })
  const { data: totalAssets } = useReadContract({ address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'totalAssets', chainId: MONAD_TESTNET_ID })
  const { data: proposalCount } = useReadContract({ address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'proposalCount', chainId: MONAD_TESTNET_ID })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name ?? 'Loading…'}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Assets</p>
          <p className="text-2xl font-bold">
            {totalAssets !== undefined ? formatUnits(totalAssets, 18) : '—'} MUSD
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Proposals</p>
          <p className="text-2xl font-bold">{proposalCount?.toString() ?? '—'}</p>
        </div>
      </CardContent>
    </Card>
  )
}
