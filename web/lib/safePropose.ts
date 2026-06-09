import { createPublicClient, http, encodeFunctionData, hashTypedData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const ZERO = '0x0000000000000000000000000000000000000000' as const

const SAFE_NONCE_ABI = [
  { name: 'nonce', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const

const APPROVE_AND_FUND_ABI = [
  { name: 'approveAndFund', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'proposalId', type: 'uint256' }, { name: 'projectWallet', type: 'address' }],
    outputs: [] },
] as const

const SAFE_TX_TYPES = {
  SafeTx: [
    { name: 'to',             type: 'address' },
    { name: 'value',          type: 'uint256' },
    { name: 'data',           type: 'bytes'   },
    { name: 'operation',      type: 'uint8'   },
    { name: 'safeTxGas',      type: 'uint256' },
    { name: 'baseGas',        type: 'uint256' },
    { name: 'gasPrice',       type: 'uint256' },
    { name: 'gasToken',       type: 'address' },
    { name: 'refundReceiver', type: 'address' },
    { name: 'nonce',          type: 'uint256' },
  ],
} as const

export interface SafeTxResult {
  proposalId:  number
  projectWallet: string
  calldata:    string
  safeTxHash:  string
  signature:   string
  nonce:       number
  sender:      string
  safeAddress: string
}

export async function buildAndSignSafeTx(
  proposalId: number,
  projectWallet: string,
): Promise<SafeTxResult> {
  const rpc        = process.env.MONAD_RPC_URL ?? 'https://testnet-rpc.monad.xyz'
  const safeAddr   = process.env.SAFE_ADDRESS as `0x${string}`
  const fundAddr   = process.env.TRACK_FUND_ADDRESS as `0x${string}`
  const agentKey   = process.env.AGENT_PRIVATE_KEY as `0x${string}`

  const publicClient = createPublicClient({ transport: http(rpc) })
  const account      = privateKeyToAccount(agentKey)

  const calldata = encodeFunctionData({
    abi: APPROVE_AND_FUND_ABI,
    functionName: 'approveAndFund',
    args: [BigInt(proposalId), projectWallet as `0x${string}`],
  })

  const nonce = await publicClient.readContract({
    address: safeAddr,
    abi:     SAFE_NONCE_ABI,
    functionName: 'nonce',
  }) as bigint

  const safeTxHash = hashTypedData({
    domain: { chainId: 10143, verifyingContract: safeAddr },
    types:  SAFE_TX_TYPES,
    primaryType: 'SafeTx',
    message: {
      to:             fundAddr,
      value:          0n,
      data:           calldata,
      operation:      0,
      safeTxGas:      0n,
      baseGas:        0n,
      gasPrice:       0n,
      gasToken:       ZERO,
      refundReceiver: ZERO,
      nonce,
    },
  })

  const signature = await account.sign({ hash: safeTxHash })

  return {
    proposalId,
    projectWallet,
    calldata,
    safeTxHash,
    signature,
    nonce: Number(nonce),
    sender: account.address,
    safeAddress: safeAddr,
  }
}
