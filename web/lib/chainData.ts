import { createPublicClient, http, formatUnits } from 'viem'
import { ADDRESSES, TRACK_FUND_ABI, ERC20_ABI } from './contracts'
import { store } from './store'

const client = createPublicClient({
  transport: http(process.env.MONAD_RPC_URL ?? 'https://testnet-rpc.monad.xyz'),
})

export async function getFundStats() {
  const totalAssets = await client.readContract({ address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'totalAssets' })
  const musdBalance = await client.readContract({ address: ADDRESSES.mockUSD, abi: ERC20_ABI, functionName: 'balanceOf', args: [ADDRESSES.trackFund] })
  return {
    totalAssets: formatUnits(totalAssets as bigint, 18),
    musdBalance: formatUnits(musdBalance as bigint, 18),
  }
}

export async function getAllProposals() {
  const count = await client.readContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI, functionName: 'proposalCount',
  }) as bigint

  if (count === 0n) return []

  const raw = await Promise.all(
    Array.from({ length: Number(count) }, (_, i) =>
      client.readContract({
        address: ADDRESSES.trackFund,
        abi: TRACK_FUND_ABI,
        functionName: 'proposals',
        args: [BigInt(i)],
      })
    )
  )

  return raw.map((p: any, i) => {
    const metadataHash = p[2] as string
    const offchain = store.proposals.get(metadataHash)
    return {
      id: i,
      requestedAmount: formatUnits(p[1] as bigint, 18),
      metadataHash,
      proposer: p[3] as string,
      status: (['PENDING', 'APPROVED', 'FUNDED'] as const)[Number(p[4])] ?? 'UNKNOWN',
      title: offchain?.title ?? null,
      description: offchain?.description ?? null,
      orgWallet: offchain?.orgWallet ?? null,
    }
  })
}
