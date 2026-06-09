import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { config } from "./config.js";

// Minimal Safe ABI — only what the agent needs
const SAFE_ABI = [
  "function nonce() view returns (uint256)",
  "function getTransactionHash(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) view returns (bytes32)",
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export interface SafeTxPayload {
  to:                      string;
  value:                   string;
  data:                    string;
  operation:               number;
  safeTxGas:               string;
  baseGas:                 string;
  gasPrice:                string;
  gasToken:                string;
  refundReceiver:          string;
  nonce:                   number;
  contractTransactionHash: string;
  sender:                  string;
  signature:               string;
  origin:                  string;
}

export async function proposeSafeTx(
  provider: ethers.Provider,
  calldata: string,
  proposalId: bigint,
): Promise<void> {
  const safeContract = new ethers.Contract(config.safeAddress, SAFE_ABI, provider);
  const wallet = new ethers.Wallet(config.agentPrivateKey);

  const nonce = Number(await safeContract.nonce());

  // Standard Safe tx params — zero gas fields = use wallet pays
  const tx = {
    to:            config.trackFundAddress,
    value:         0n,
    data:          calldata,
    operation:     0,  // CALL
    safeTxGas:     0n,
    baseGas:       0n,
    gasPrice:      0n,
    gasToken:      ZERO_ADDRESS,
    refundReceiver: ZERO_ADDRESS,
    nonce,
  };

  const safeTxHash: string = await safeContract.getTransactionHash(
    tx.to,
    tx.value,
    tx.data,
    tx.operation,
    tx.safeTxGas,
    tx.baseGas,
    tx.gasPrice,
    tx.gasToken,
    tx.refundReceiver,
    tx.nonce,
  );

  // Sign the raw hash (no eth prefix) — Safe expects this
  const signingKey = new ethers.SigningKey(config.agentPrivateKey);
  const sig = signingKey.sign(safeTxHash);
  const signature = sig.serialized;

  const payload: SafeTxPayload = {
    to:                      tx.to,
    value:                   tx.value.toString(),
    data:                    tx.data,
    operation:               tx.operation,
    safeTxGas:               tx.safeTxGas.toString(),
    baseGas:                 tx.baseGas.toString(),
    gasPrice:                tx.gasPrice.toString(),
    gasToken:                tx.gasToken,
    refundReceiver:          tx.refundReceiver,
    nonce:                   tx.nonce,
    contractTransactionHash: safeTxHash,
    sender:                  wallet.address,
    signature,
    origin:                  "TrackFund Governance Agent",
  };

  if (config.safeServiceEnabled) {
    await submitToSafeService(payload);
  } else {
    await writeToFile(payload, proposalId);
  }
}

async function submitToSafeService(payload: SafeTxPayload): Promise<void> {
  const url = `${config.safeServiceUrl}/api/v1/safes/${config.safeAddress}/multisig-transactions/`;
  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Safe service error ${res.status}: ${body}`);
  }

  console.log(`[safe] Submitted to service. safeTxHash=${payload.contractTransactionHash}`);
}

async function writeToFile(payload: SafeTxPayload, proposalId: bigint): Promise<void> {
  fs.mkdirSync(config.logDir, { recursive: true });

  const outPath = path.join(config.logDir, `safe_tx_proposal_${proposalId}.json`);
  const entry = {
    timestamp:  new Date().toISOString(),
    proposalId: proposalId.toString(),
    safe:       config.safeAddress,
    payload,
    instructions: [
      "1. Open app.safe.global and connect as a Safe owner.",
      "2. Go to New Transaction → Transaction Builder.",
      "3. Paste the 'payload.to' address and 'payload.data' calldata.",
      "4. Or import this file via Safe's offline signing flow.",
    ],
  };

  fs.writeFileSync(outPath, JSON.stringify(entry, null, 2));

  console.log(`[safe] SAFE_SERVICE_ENABLED=false — written to ${outPath}`);
  console.log(`[safe] safeTxHash=${payload.contractTransactionHash}`);
  console.log(`[safe] calldata=${payload.data}`);
}
