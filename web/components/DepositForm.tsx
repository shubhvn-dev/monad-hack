'use client'

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ADDRESSES, ERC20_ABI, TRACK_FUND_ABI } from '@/lib/contracts'

export function DepositForm() {
  const { address } = useAccount()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing' | 'done'>('idle')

  const { data: musdBalance, refetch: refetchMUSD } = useReadContract({
    address: ADDRESSES.mockUSD, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined, query: { enabled: !!address },
  })
  const { data: trackBalance, refetch: refetchTrack } = useReadContract({
    address: ADDRESSES.trackToken, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined, query: { enabled: !!address },
  })

  const { writeContract, data: txHash } = useWriteContract()
  const { isLoading: isTxPending, isSuccess: isTxDone } = useWaitForTransactionReceipt({ hash: txHash })

  async function handleMint() {
    if (!address || !amount) return
    writeContract({ address: ADDRESSES.mockUSD, abi: ERC20_ABI, functionName: 'mint', args: [address, parseUnits(amount, 18)] })
  }

  async function handleApprove() {
    if (!address || !amount) return
    setStep('approving')
    writeContract({ address: ADDRESSES.mockUSD, abi: ERC20_ABI, functionName: 'approve', args: [ADDRESSES.trackFund, parseUnits(amount, 18)] })
  }

  async function handleDeposit() {
    if (!amount) return
    setStep('depositing')
    writeContract({ address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'deposit', args: [parseUnits(amount, 18)] })
    setStep('done')
    refetchMUSD()
    refetchTrack()
  }

  if (!address) return null

  return (
    <Card>
      <CardHeader><CardTitle>Deposit</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>MUSD balance: {musdBalance !== undefined ? formatUnits(musdBalance, 18) : '—'}</p>
          <p>TrackToken balance: {trackBalance !== undefined ? formatUnits(trackBalance, 18) : '—'}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="deposit-amount">Amount (MUSD)</Label>
          <Input id="deposit-amount" type="number" placeholder="100" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleMint} disabled={!amount || isTxPending}>
            Mint MUSD (demo)
          </Button>
          <Button variant="outline" onClick={handleApprove} disabled={!amount || isTxPending}>
            {step === 'approving' && isTxPending ? 'Approving…' : 'Approve'}
          </Button>
          <Button onClick={handleDeposit} disabled={!amount || isTxPending}>
            {step === 'depositing' && isTxPending ? 'Depositing…' : 'Deposit'}
          </Button>
        </div>
        {isTxDone && <p className="text-sm text-green-600">Transaction confirmed!</p>}
      </CardContent>
    </Card>
  )
}
