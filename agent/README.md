# TrackFund Governance Agent

Machine-to-machine loop: `TrackFund` emits `ProposalCreated` → agent evaluates rules → agent proposes `approveAndFund` to the Safe → Safe owners review and co-sign.

## How it works

1. Agent polls `ProposalCreated` logs from TrackFund on Monad testnet.
2. For each new proposal it checks:
   - `requestedAmount <= MAX_REQUESTED_AMOUNT`
   - `fundBalance >= requestedAmount + MIN_FUND_BALANCE`
3. If both pass, it builds a Safe transaction calling `approveAndFund(proposalId, projectWallet)`.
4. It signs the Safe tx with `AGENT_PRIVATE_KEY` and either:
   - Posts to Safe Transaction Service (`SAFE_SERVICE_ENABLED=true`), OR
   - Writes a JSON file to `./logs/safe_tx_proposal_<id>.json` for manual import.

## Setup

```bash
cd agent
npm install
cp .env.example .env
# Fill in AGENT_PRIVATE_KEY and PROJECT_WALLET_DEFAULT
```

**Important:** `AGENT_PRIVATE_KEY` must be a wallet that is one of the Safe owners. The agent adds its signature; the remaining owners sign via Safe UI to reach threshold.

## Running the agent

```bash
# Development (watch mode)
npm run dev

# Production
npm run start
```

Expected output when a proposal arrives:
```
[2026-06-09T12:00:00.000Z] ProposalCreated #3
  requestedAmount : 500.0 MUSD
  metadataHash    : 0xabc...
  fundBalance     : 4500.0 MUSD
  [OK] Proposal #3 qualifies for auto-funding
  projectWallet   : 0x... (PROJECT_WALLET_DEFAULT)
  calldata        : 0x...
  [safe] SAFE_SERVICE_ENABLED=false — written to ./logs/safe_tx_proposal_3.json
  [DONE] Safe tx proposed for Proposal #3
```

## Seeding a test proposal (end-to-end demo)

The seed script mints MUSD to TrackFund and submits a proposal:

```bash
npm run seed
```

Then watch the agent terminal — it picks up the event and writes the Safe tx JSON.

## Verifying it works

1. Run agent in one terminal, seed in another.
2. Agent logs `[OK] Proposal #N qualifies` and writes `./logs/safe_tx_proposal_N.json`.
3. Open `app.safe.global` → navigate to the Safe → Transaction Builder.
4. Paste `TRACK_FUND_ADDRESS` as the target and `payload.data` as calldata.
5. The other Safe owner(s) sign and execute.
6. TrackFund marks proposal `FUNDED` and transfers MUSD to `PROJECT_WALLET_DEFAULT`.

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONAD_RPC_URL` | Yes | — | Monad testnet RPC |
| `TRACK_FUND_ADDRESS` | Yes | — | TrackFund contract |
| `MUSD_ADDRESS` | Yes | — | MockUSD contract |
| `SAFE_ADDRESS` | Yes | — | Safe multisig |
| `AGENT_PRIVATE_KEY` | Yes | — | Agent wallet private key |
| `PROJECT_WALLET_DEFAULT` | Yes | — | Wallet that receives funded MUSD |
| `SAFE_CHAIN_ID` | No | `10143` | Monad testnet chain ID |
| `SAFE_SERVICE_URL` | No | `""` | Safe TX service base URL |
| `SAFE_SERVICE_ENABLED` | No | `false` | Submit to service vs. write JSON |
| `MAX_REQUESTED_AMOUNT` | No | `1000 MUSD` | Max auto-fund threshold (wei) |
| `MIN_FUND_BALANCE` | No | `0` | Fund balance floor (wei) |
| `POLL_INTERVAL_MS` | No | `5000` | Event polling interval |
| `LOG_DIR` | No | `./logs` | Output directory for logs/Safe txs |

## Notes

- **No Safe TX service on Monad testnet.** Keep `SAFE_SERVICE_ENABLED=false` and use the JSON output to import into Safe UI manually.
- **TrackFund admin must be the Safe.** If the admin is an EOA (as in the demo deployment), the Safe tx will revert with `"not admin"`. Redeploy TrackFund with `admin = SAFE_ADDRESS` or call `transferAdmin` if that function exists.
- **`ProposalCreated` has no proposer field.** All auto-funded proposals send to `PROJECT_WALLET_DEFAULT`. To route per-proposer, add `address indexed proposer` to the event and update `config.ts`.
