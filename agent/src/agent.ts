import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { config } from "./config.js";
import {
  makeProvider,
  makeContracts,
  getProposal,
  getFundBalance,
  buildApproveAndFundCalldata,
  getTrackFundInterface,
  ProposalStatus,
} from "./trackFundClient.js";
import { proposeSafeTx } from "./safeClient.js";

// ── Funding rule ──────────────────────────────────────────────────────────────

function shouldAutoFund(requestedAmount: bigint, fundBalance: bigint): boolean {
  if (requestedAmount > config.maxRequestedAmount) return false;
  if (fundBalance < requestedAmount + config.minFundBalance) return false;
  return true;
}

// ── Event log ─────────────────────────────────────────────────────────────────

interface LogEntry {
  timestamp:       string;
  proposalId:      string;
  requestedAmount: string;
  metadataHash:    string;
  fundBalance:     string;
  qualifies:       boolean;
  reason?:         string;
  safeTxHash?:     string;
  error?:          string;
}

function appendLog(entry: LogEntry) {
  fs.mkdirSync(config.logDir, { recursive: true });
  const logPath = path.join(config.logDir, "agent.jsonl");
  fs.appendFileSync(logPath, JSON.stringify(entry) + "\n");
}

// ── Proposal handler ──────────────────────────────────────────────────────────

async function handleProposal(
  provider: ethers.Provider,
  musd:      ethers.Contract,
  proposalId:      bigint,
  requestedAmount: bigint,
  metadataHash:    string,
  proposer:        string,
) {
  const ts = new Date().toISOString();
  console.log(`\n[${ts}] ProposalCreated #${proposalId}`);
  console.log(`  requestedAmount : ${ethers.formatUnits(requestedAmount, 18)} MUSD`);
  console.log(`  metadataHash    : ${metadataHash}`);
  console.log(`  proposer        : ${proposer}`);

  const fundBalance = await getFundBalance(musd);
  console.log(`  fundBalance     : ${ethers.formatUnits(fundBalance, 18)} MUSD`);

  const qualifies = shouldAutoFund(requestedAmount, fundBalance);
  const log: LogEntry = {
    timestamp:       ts,
    proposalId:      proposalId.toString(),
    requestedAmount: requestedAmount.toString(),
    metadataHash,
    fundBalance:     fundBalance.toString(),
    qualifies,
  };

  if (!qualifies) {
    let reason = "";
    if (requestedAmount > config.maxRequestedAmount) {
      reason = `requestedAmount (${requestedAmount}) > MAX_REQUESTED_AMOUNT (${config.maxRequestedAmount})`;
    } else {
      reason = `fundBalance (${fundBalance}) < requestedAmount + minFundBalance (${requestedAmount + config.minFundBalance})`;
    }
    console.log(`  [SKIP] Proposal #${proposalId} does not qualify: ${reason}`);
    log.reason = reason;
    appendLog(log);
    return;
  }

  console.log(`  [OK] Proposal #${proposalId} qualifies for auto-funding`);
  const projectWallet = proposer !== ethers.ZeroAddress
    ? proposer
    : config.projectWalletDefault;
  const walletSource = proposer !== ethers.ZeroAddress ? "proposer" : "PROJECT_WALLET_DEFAULT";
  console.log(`  projectWallet   : ${projectWallet} (${walletSource})`);

  const calldata = buildApproveAndFundCalldata(proposalId, projectWallet);
  console.log(`  calldata        : ${calldata}`);

  try {
    await proposeSafeTx(provider, calldata, proposalId);
    console.log(`  [DONE] Safe tx proposed for Proposal #${proposalId}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  [ERROR] Safe tx failed: ${msg}`);
    log.error = msg;
  }

  appendLog(log);
}

// ── Polling loop ──────────────────────────────────────────────────────────────

async function poll(
  provider:   ethers.Provider,
  trackFund:  ethers.Contract,
  musd:       ethers.Contract,
  iface:      ethers.Interface,
  fromBlock:  number,
): Promise<number> {
  const latestBlock = await provider.getBlockNumber();
  if (latestBlock < fromBlock) return fromBlock;

  const topic = iface.getEvent("ProposalCreated")!.topicHash;
  const logs = await provider.getLogs({
    address:   config.trackFundAddress,
    topics:    [topic],
    fromBlock,
    toBlock:   latestBlock,
  });

  for (const log of logs) {
    const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
    if (!parsed) continue;
    const [proposalId, requestedAmount, metadataHash, proposer] = parsed.args;
    await handleProposal(provider, musd, BigInt(proposalId), BigInt(requestedAmount), metadataHash as string, proposer as string);
  }

  return latestBlock + 1;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("TrackFund Governance Agent starting...");
  console.log(`  trackFund         : ${config.trackFundAddress}`);
  console.log(`  safe              : ${config.safeAddress}`);
  console.log(`  chainId           : ${config.chainId}`);
  console.log(`  safeServiceEnabled: ${config.safeServiceEnabled}`);
  console.log(`  maxRequestedAmount: ${ethers.formatUnits(config.maxRequestedAmount, 18)} MUSD`);
  console.log(`  pollInterval      : ${config.pollIntervalMs}ms`);
  console.log(`  logDir            : ${config.logDir}`);

  const provider  = makeProvider();
  const { trackFund, musd } = makeContracts(provider);
  const iface     = getTrackFundInterface();

  // Verify connection
  const network = await provider.getNetwork();
  console.log(`\nConnected to chain ${network.chainId} (${network.name})`);

  // Verify agent wallet
  const agentWallet = new ethers.Wallet(config.agentPrivateKey);
  console.log(`Agent wallet: ${agentWallet.address}`);

  let fromBlock = await provider.getBlockNumber();
  console.log(`\nListening from block ${fromBlock}...\n`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      fromBlock = await poll(provider, trackFund, musd, iface, fromBlock);
    } catch (err) {
      console.error(`[poll error] ${err instanceof Error ? err.message : String(err)}`);
    }
    await new Promise((r) => setTimeout(r, config.pollIntervalMs));
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
