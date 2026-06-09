import { ethers } from "ethers";
import { config } from "./config.js";

const TRACK_FUND_ABI = [
  "function totalAssets() view returns (uint256)",
  "function proposalCount() view returns (uint256)",
  "function stableToken() view returns (address)",
  "function proposals(uint256 id) view returns (uint256 id, uint256 requestedAmount, bytes32 metadataHash, address proposer, uint8 status)",
  "function approveAndFund(uint256 proposalId, address projectWallet)",
  "event ProposalCreated(uint256 indexed proposalId, uint256 requestedAmount, bytes32 metadataHash, address indexed proposer)",
  "event ProposalFunded(uint256 indexed proposalId, address indexed projectWallet, uint256 amount)",
];

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
];

export const ProposalStatus = {
  PENDING:  0,
  APPROVED: 1,
  FUNDED:   2,
} as const;

export interface ProposalData {
  id:              bigint;
  requestedAmount: bigint;
  metadataHash:    string;
  proposer:        string;
  status:          number;
}

export function makeProvider() {
  return new ethers.JsonRpcProvider(config.monadRpcUrl);
}

export function makeContracts(provider: ethers.Provider) {
  const trackFund = new ethers.Contract(config.trackFundAddress, TRACK_FUND_ABI, provider);
  const musd      = new ethers.Contract(config.musdAddress, ERC20_ABI, provider);
  return { trackFund, musd };
}

export async function getProposal(
  trackFund: ethers.Contract,
  proposalId: bigint,
): Promise<ProposalData> {
  const p = await trackFund.proposals(proposalId);
  return {
    id:              BigInt(p[0]),
    requestedAmount: BigInt(p[1]),
    metadataHash:    p[2] as string,
    proposer:        p[3] as string,
    status:          Number(p[4]),
  };
}

export async function getFundBalance(musd: ethers.Contract): Promise<bigint> {
  return BigInt(await musd.balanceOf(config.trackFundAddress));
}

export function buildApproveAndFundCalldata(proposalId: bigint, projectWallet: string): string {
  const iface = new ethers.Interface([
    "function approveAndFund(uint256 proposalId, address projectWallet)",
  ]);
  return iface.encodeFunctionData("approveAndFund", [proposalId, projectWallet]);
}

// Returns the ethers.Interface so callers can parse logs too
export function getTrackFundInterface(): ethers.Interface {
  return new ethers.Interface(TRACK_FUND_ABI);
}
