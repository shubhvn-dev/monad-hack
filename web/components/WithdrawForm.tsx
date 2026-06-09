'use client'

import { useState } from 'react'
import { useAccount, useReadContract, usePublicClient, useWriteContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ADDRESSES, ERC20_ABI, TRACK_FUND_ABI } from '@/lib/contracts'
import { useMonadGuard, MONAD_TESTNET_ID } from '@/lib/useMonadGuard'

export function WithdrawForm({ compact = false }: { compact?: boolean }) {
  const { address } = useAccount()
  const { isCorrectChain, ensureMonad } = useMonadGuard()
  const publicClient = usePublicClient({ chainId: MONAD_TESTNET_ID })
  const [shareAmount, setShareAmount] = useState('')
  const [step, setStep] = useState<'idle' | 'withdrawing' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: trackBalance, refetch } = useReadContract({
    address: ADDRESSES.trackToken, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined, chainId: MONAD_TESTNET_ID, query: { enabled: !!address },
  })

  const { writeContractAsync } = useWriteContract()

  async function handleWithdraw() {
    if (!shareAmount || !address) return
    setErrorMsg('')
    try {
      await ensureMonad()
      setStep('withdrawing')
      const hash = await writeContractAsync({
        address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'withdraw',
        args: [parseUnits(shareAmount, 18)], chainId: MONAD_TESTNET_ID,
      })
      await publicClient!.waitForTransactionReceipt({ hash })
      await refetch()
      setStep('done')
    } catch (e: any) {
      setErrorMsg(e?.shortMessage ?? e?.cause?.message ?? e?.message ?? 'Withdraw failed')
      setStep('error')
    }
  }

  if (!address) return null

  const busy = step === 'withdrawing'

  const inner = (
    <div className="space-y-3">
      {!compact && (
        <p className="text-sm text-muted-foreground">
          TrackTokens: {trackBalance !== undefined ? formatUnits(trackBalance, 18) : '—'}
        </p>
      )}
      <div className={compact ? 'flex gap-2' : 'space-y-2'}>
        {!compact && <Label htmlFor="withdraw-amount">TrackTokens to burn</Label>}
        <Input
          id="withdraw-amount" type="number"
          placeholder={compact ? 'TrackTokens' : '100'}
          value={shareAmount}
          onChange={e => { setShareAmount(e.target.value); setStep('idle') }}
          className={compact ? 'flex-1' : ''}
        />
        <Button
          onClick={handleWithdraw} disabled={!shareAmount || busy} variant="outline" size="sm"
          className={compact ? '' : 'w-full'}
        >
          {busy ? 'Withdrawing…' : 'Withdraw'}
        </Button>
      </div>
      {!isCorrectChain && <p className="text-xs text-yellow-600">Will switch to Monad Testnet.</p>}
      {step === 'done' && <p className="text-xs text-green-600">Withdrawn!</p>}
      {step === 'error' && <p className="text-xs text-red-600">{errorMsg}</p>}
    </div>
  )

  if (compact) return inner

  return (
    <Card>
      <CardHeader><CardTitle>Withdraw</CardTitle></CardHeader>
      <CardContent>{inner}</CardContent>
    </Card>
  )
}
