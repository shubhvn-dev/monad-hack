import "dotenv/config";

function req(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

const opt = (key: string, fallback: string) => process.env[key] ?? fallback;

export const config = {
  monadRpcUrl:          req("MONAD_RPC_URL"),
  trackFundAddress:     req("TRACK_FUND_ADDRESS"),
  musdAddress:          req("MUSD_ADDRESS"),
  safeAddress:          req("SAFE_ADDRESS"),
  agentPrivateKey:      req("AGENT_PRIVATE_KEY"),
  // Fallback project wallet used only if proposer address is zero/missing.
  // Normal path: funds go to the proposal's proposer address (emitted in event).
  projectWalletDefault: opt("PROJECT_WALLET_DEFAULT", ""),
  chainId:              Number(opt("SAFE_CHAIN_ID", "10143")),
  safeServiceUrl:       opt("SAFE_SERVICE_URL", ""),
  // Set true only if a Safe Transaction Service is running for this chain.
  // Monad testnet has no official Safe TX service, so default is false.
  safeServiceEnabled:   opt("SAFE_SERVICE_ENABLED", "false") === "true",
  // Max requestedAmount the agent will auto-propose (in wei; default = 1000 MUSD)
  maxRequestedAmount:   BigInt(opt("MAX_REQUESTED_AMOUNT", "1000000000000000000000")),
  // Minimum fund balance that must remain after funding (0 = no floor)
  minFundBalance:       BigInt(opt("MIN_FUND_BALANCE", "0")),
  pollIntervalMs:       Number(opt("POLL_INTERVAL_MS", "5000")),
  logDir:               opt("LOG_DIR", "./logs"),
} as const;

export type Config = typeof config;
