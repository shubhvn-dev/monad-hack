'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { useModal } from '@getpara/react-sdk'
import { Button } from '@/components/ui/button'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { openModal } = useModal()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-mono">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={() => openModal()}>
      Connect Wallet
    </Button>
  )
}
