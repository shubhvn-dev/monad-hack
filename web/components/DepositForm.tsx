'use client'

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ADDRESSES, ERC20_ABI, TRACK_FUND_ABI } from '@/lib/contracts'
import { useMonadGuard, MONAD_TESTNET_ID } from '@/lib/useMonadGuard'

export function DepositForm({ compact = false }: { compact?: boolean }) {
  const { address } = useAccount()
  const { isCorrectChain, ensureMonad } = useMonadGuard()
  const publicClient = usePublicClient({ chainId: MONAD_TESTNET_ID })
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: musdBalance, refetch: refetchMUSD } = useReadContract({
    address: ADDRESSES.mockUSD, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined, chainId: MONAD_TESTNET_ID, query: { enabled: !!address },
  })
  const { data: trackBalance, refetch: refetchTrack } = useReadContract({
    address: ADDRESSES.trackToken, abi: ERC20_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined, chainId: MONAD_TESTNET_ID, query: { enabled: !!address },
  })
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: ADDRESSES.mockUSD, abi: ERC20_ABI, functionName: 'allowance',
    args: address ? [address, ADDRESSES.trackFund] : undefined, chainId: MONAD_TESTNET_ID, query: { enabled: !!address },
  })

  const { writeContractAsync } = useWriteContract()

  async function handleDeposit() {
    if (!address || !amount) return
    const amountWei = parseUnits(amount, 18)
    setErrorMsg('')
    if (musdBalance !== undefined && musdBalance < amountWei) {
      setErrorMsg(`Need ${amount} MUSD, have ${formatUnits(musdBalance, 18)}.`)
      setStep('error')
      return
    }
    try {
      await ensureMonad()
      if (!allowance || allowance < amountWei) {
        setStep('approving')
        const approveTx = await writeContractAsync({
          address: ADDRESSES.mockUSD, abi: ERC20_ABI, functionName: 'approve',
          args: [ADDRESSES.trackFund, amountWei], chainId: MONAD_TESTNET_ID,
        })
        await publicClient!.waitForTransactionReceipt({ hash: approveTx })
        await refetchAllowance()
      }
      setStep('depositing')
      const depositTx = await writeContractAsync({
        address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'deposit',
        args: [amountWei], chainId: MONAD_TESTNET_ID,
      })
      await publicClient!.waitForTransactionReceipt({ hash: depositTx })
      refetchMUSD()
      refetchTrack()
      setStep('done')
    } catch (e: any) {
      console.error('[DepositForm]', e)
      setErrorMsg(e?.shortMessage ?? e?.cause?.shortMessage ?? e?.cause?.message ?? e?.message ?? 'Deposit failed')
      setStep('error')
    }
  }

  if (!address) return compact ? null : null

  const busy = step === 'approving' || step === 'depositing'

  const inner = (
    <div className="space-y-3">
      {!compact && (
        <div className="text-sm text-muted-foreground space-y-0.5">
          <p>MUSD: {musdBalance !== undefined ? formatUnits(musdBalance, 18) : '—'}</p>
          <p>TrackTokens: {trackBalance !== undefined ? formatUnits(trackBalance, 18) : '—'}</p>
        </div>
      )}
      <div className={compact ? 'flex gap-2' : 'space-y-2'}>
        {!compact && <Label htmlFor="deposit-amount">Amount (MUSD)</Label>}
        <Input
          id="deposit-amount" type="number"
          placeholder={compact ? 'Amount (MUSD)' : '100'}
          value={amount}
          onChange={e => { setAmount(e.target.value); setStep('idle') }}
          className={compact ? 'flex-1' : ''}
        />
      </div>
      <div className={compact ? 'flex gap-2' : 'flex gap-2 flex-wrap'}>
        <Button onClick={handleDeposit} disabled={!amount || busy} size="sm" className={compact ? 'flex-1' : ''}>
          {step === 'approving' ? 'Approving…' : step === 'depositing' ? 'Depositing…' : 'Invest'}
        </Button>
      </div>
      {!isCorrectChain && <p className="text-xs text-yellow-600">Will switch to Monad Testnet.</p>}
      {step === 'done' && <p className="text-xs text-green-600">Deposited!</p>}
      {step === 'error' && <p className="text-xs text-red-600">{errorMsg}</p>}
    </div>
  )

  if (compact) return inner

  return (
    <Card>
      <CardHeader><CardTitle>Deposit</CardTitle></CardHeader>
      <CardContent>{inner}</CardContent>
    </Card>
  )
}
