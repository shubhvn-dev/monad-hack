/**
 * Seed script: mint MUSD to TrackFund + submit a test proposal.
 * Run: npm run seed
 * Requires same .env as the agent. Uses AGENT_PRIVATE_KEY as the sender.
 */
import { ethers } from "ethers";
import { config } from "./config.js";
import { makeProvider } from "./trackFundClient.js";

const MUSD_ABI = [
  "function mint(address to, uint256 amount)",
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

const TRACK_FUND_ABI = [
  "function propose(uint256 requestedAmount, bytes32 metadataHash) returns (uint256)",
  "function totalAssets() view returns (uint256)",
  "function deposit(uint256 amount)",
];

// Seed params — adjust as needed
const DEPOSIT_AMOUNT  = ethers.parseUnits("5000", 18);  // seed wallet deposits 5000 MUSD
const REQUEST_AMOUNT  = ethers.parseUnits("500", 18);   // 500 MUSD proposal request
const METADATA_TEXT   = "Test proposal: AI research grant, Q3 2026";

async function main() {
  const provider = makeProvider();
  const wallet   = new ethers.Wallet(config.agentPrivateKey, provider);

  console.log(`Seed wallet  : ${wallet.address}`);
  console.log(`TrackFund    : ${config.trackFundAddress}`);
  console.log(`MUSD         : ${config.musdAddress}`);

  const musd = new ethers.Contract(config.musdAddress, MUSD_ABI, wallet);
  const fund = new ethers.Contract(config.trackFundAddress, TRACK_FUND_ABI, wallet);

  // Step 1 — mint MUSD to seed wallet, then deposit into TrackFund
  // (must go through deposit() so totalAssets stays in sync)
  console.log(`\n[1] Minting ${ethers.formatUnits(DEPOSIT_AMOUNT, 18)} MUSD to seed wallet...`);
  const mintTx = await musd.mint(wallet.address, DEPOSIT_AMOUNT);
  await mintTx.wait();
  console.log(`    tx: ${mintTx.hash}`);

  console.log(`[2] Approving TrackFund to spend MUSD...`);
  const approveTx = await musd.approve(config.trackFundAddress, DEPOSIT_AMOUNT);
  await approveTx.wait();
  console.log(`    tx: ${approveTx.hash}`);

  console.log(`[3] Depositing ${ethers.formatUnits(DEPOSIT_AMOUNT, 18)} MUSD into TrackFund...`);
  const depositTx = await fund.deposit(DEPOSIT_AMOUNT);
  await depositTx.wait();
  console.log(`    tx: ${depositTx.hash}`);

  const balance = await musd.balanceOf(config.trackFundAddress);
  const totalAssets = await fund.totalAssets();
  console.log(`    TrackFund MUSD balance: ${ethers.formatUnits(balance, 18)}`);
  console.log(`    TrackFund totalAssets : ${ethers.formatUnits(totalAssets, 18)}`);

  // Step 4 — submit a proposal (proposer = agent wallet; funds will go back to agent wallet)
  const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(METADATA_TEXT));
  console.log(`\n[4] Submitting proposal...`);
  console.log(`    requestedAmount : ${ethers.formatUnits(REQUEST_AMOUNT, 18)} MUSD`);
  console.log(`    metadataHash    : ${metadataHash}  ("${METADATA_TEXT}")`);

  const proposeTx = await fund.propose(REQUEST_AMOUNT, metadataHash);
  const receipt   = await proposeTx.wait();
  console.log(`    tx: ${proposeTx.hash}`);

  // Parse ProposalCreated event from receipt
  const iface = new ethers.Interface([
    "event ProposalCreated(uint256 indexed proposalId, uint256 requestedAmount, bytes32 metadataHash)",
  ]);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed?.name === "ProposalCreated") {
        console.log(`    proposalId: ${parsed.args[0]}`);
      }
    } catch {
      // not this event
    }
  }

  console.log("\nDone. The agent should pick up the ProposalCreated event shortly.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
