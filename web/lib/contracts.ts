import { type Address } from 'viem'

export const ADDRESSES = {
  mockUSD: '0xCCBE5a3C7dC5287C412598dfb5AEA6571710021e' as Address,
  trackFundFactory: '0x4D527272Cb7d6e0E54f6EDc37061c8f79E20De6C' as Address,
  trackFund: '0x64912E918B46C4BBb7C61300CFC30d0b83aBcB1d' as Address,
  trackToken: '0x8c02b627940308B70C5FfC08236bab670B0a8448' as Address,
} as const

export const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'mint', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [] },
] as const

export const TRACK_FUND_ABI = [
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'totalAssets', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'proposalCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'admin', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  {
    name: 'proposals', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'requestedAmount', type: 'uint256' },
      { name: 'metadataHash', type: 'bytes32' },
      { name: 'proposer', type: 'address' },
      { name: 'status', type: 'uint8' },
    ],
  },
  { name: 'deposit', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'withdraw', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'shareAmount', type: 'uint256' }], outputs: [] },
  { name: 'propose', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'requestedAmount', type: 'uint256' }, { name: 'metadataHash', type: 'bytes32' }], outputs: [{ type: 'uint256' }] },
  { name: 'approveProposal', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'proposalId', type: 'uint256' }], outputs: [] },
  { name: 'fundProposal', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'proposalId', type: 'uint256' }, { name: 'projectWallet', type: 'address' }], outputs: [] },
  { name: 'approveAndFund', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'proposalId', type: 'uint256' }, { name: 'projectWallet', type: 'address' }], outputs: [] },
  { name: 'projectTokenBalances', type: 'function', stateMutability: 'view', inputs: [{ name: 'token', type: 'address' }], outputs: [{ type: 'uint256' }] },
  {
    name: 'Deposited', type: 'event',
    inputs: [{ name: 'investor', type: 'address', indexed: true }, { name: 'amount', type: 'uint256', indexed: false }],
  },
  {
    name: 'ProposalCreated', type: 'event',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true },
      { name: 'requestedAmount', type: 'uint256', indexed: false },
      { name: 'metadataHash', type: 'bytes32', indexed: false },
      { name: 'proposer', type: 'address', indexed: true },
    ],
  },
] as const

export const PROPOSAL_STATUS = ['PENDING', 'APPROVED', 'FUNDED'] as const
export type ProposalStatus = typeof PROPOSAL_STATUS[number]

export function formatStatus(status: number): ProposalStatus {
  return PROPOSAL_STATUS[status] ?? 'PENDING'
}
