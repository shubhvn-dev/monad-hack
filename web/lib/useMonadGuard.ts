'use client'

import { useChainId, useSwitchChain } from 'wagmi'
import { monadTestnet } from 'wagmi/chains'

export { monadTestnet }
export const MONAD_TESTNET_ID = monadTestnet.id

export function useMonadGuard() {
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()

  const isCorrectChain = chainId === monadTestnet.id

  async function ensureMonad() {
    if (chainId !== monadTestnet.id) {
      await switchChainAsync({ chainId: monadTestnet.id })
      // small delay to let wagmi state settle after switch
      await new Promise(r => setTimeout(r, 300))
    }
  }

  return { isCorrectChain, ensureMonad, monadChainId: monadTestnet.id }
}
