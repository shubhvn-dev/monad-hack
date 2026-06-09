'use client'

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ADDRESSES, ERC20_ABI, TRACK_FUND_ABI } from '@/lib/contracts'

export function WithdrawForm() {
  const { address } = useAccount()
  const [shareAmount, setShareAmount] = useState('')

  const { data: trackBalance, refetch } = useReadContract({
    address: ADDRESSES.trackToken, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined, query: { enabled: !!address },
  })

  const { writeContract, data: txHash } = useWriteContract()
  const { isLoading: isTxPending, isSuccess: isTxDone } = useWaitForTransactionReceipt({ hash: txHash })

  async function handleWithdraw() {
    if (!shareAmount) return
    writeContract({ address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'withdraw', args: [parseUnits(shareAmount, 18)] })
    refetch()
  }

  if (!address) return null

  return (
    <Card>
      <CardHeader><CardTitle>Withdraw</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          TrackToken balance: {trackBalance !== undefined ? formatUnits(trackBalance, 18) : '—'}
        </p>
        <div className="space-y-2">
          <Label htmlFor="withdraw-amount">TrackTokens to burn</Label>
          <Input id="withdraw-amount" type="number" placeholder="100" value={shareAmount} onChange={e => setShareAmount(e.target.value)} />
        </div>
        <Button onClick={handleWithdraw} disabled={!shareAmount || isTxPending} variant="destructive">
          {isTxPending ? 'Withdrawing…' : 'Withdraw'}
        </Button>
        {isTxDone && <p className="text-sm text-green-600">Withdrawn successfully!</p>}
      </CardContent>
    </Card>
  )
}
