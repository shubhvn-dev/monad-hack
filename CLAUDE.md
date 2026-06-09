# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TrackFund — onchain AI research investment pools on Monad testnet. Three workspaces:

- **`contracts/`** — Foundry (Solidity 0.8.28) smart contracts
- **`web/`** — Next.js 16 frontend with Para wallet integration (wagmi v3, viem v2)
- **`agent/`** — Node.js governance bot (ethers v6, ESM, tsx)

## Commands

### Contracts (`cd contracts`)

```sh
forge build
forge test
forge fmt
forge test --match-test <TestName>   # single test
forge script script/DeployFresh.s.sol --rpc-url monad_testnet --broadcast --private-key $PK
```

RPC endpoint `monad_testnet` is defined in `foundry.toml`. Sourcify verifier URL is also configured there.

### Web (`cd web`)

```sh
npm run dev      # Next.js dev server
npm run build
npm run lint
```

Requires `NEXT_PUBLIC_PARA_API_KEY` in `web/.env.local`.

### Agent (`cd agent`)

```sh
npm install
cp .env.example .env   # fill in keys
npm run dev    # watch mode
npm run start  # production
npm run seed   # mint MUSD + submit a test proposal
```

## Architecture

### Contracts

| Contract | Role |
|---|---|
| `MockUSD` | ERC-20 stablecoin used as deposit currency (18 decimals) |
| `TrackToken` | ERC-20 share token minted 1:1 on deposit, burned on withdraw; owned by TrackFund |
| `TrackFund` | Core vault — deposit/withdraw, proposal lifecycle (PENDING→APPROVED→FUNDED), `approveAndFund` for atomic approve+fund |
| `TrackFundFactory` | Deploys matched TrackToken + TrackFund pairs; transfers token ownership to fund |

`TrackFund.admin` is intended to be the Safe multisig. If it's an EOA in a demo deploy, Safe txs will revert with `"not admin"`.

Deployed addresses are hardcoded in `web/lib/contracts.ts` — update there when redeploying.

### Web

Next.js App Router. All wallet/chain state flows through wagmi via Para's `ParaProvider` (`web/app/providers.tsx`).

- `web/lib/contracts.ts` — ABI definitions and deployed addresses (single source of truth for frontend)
- `web/lib/store.ts` — In-process global store (`globalThis.__tfStore_v3`) holding orgs, projects, proposals, showcase data. Seeded with demo orgs. **Not persisted** — resets on server restart.
- `web/lib/useMonadGuard.ts` — Hook that enforces Monad testnet (chain 10143); call `ensureMonad()` before any write tx.
- `web/app/api/` — Route handlers read/write the in-process store. No database.

Route layout:
- `/` — investor view (deposit, withdraw, proposals)
- `/researcher` — submit proposals
- `/admin` — approve/fund proposals (admin only)
- `/org/[wallet]` — org profile page
- `/project/[id]` — project detail
- `/profile` — connected wallet profile

> **Next.js version note:** `web/AGENTS.md` (aliased by `web/CLAUDE.md`) warns this Next.js version has breaking API changes. Read `web/node_modules/next/dist/docs/` before writing any Next.js code.

### Agent

Polls `ProposalCreated` events from TrackFund. For qualifying proposals (within `MAX_REQUESTED_AMOUNT` and `MIN_FUND_BALANCE` rules), it builds a `approveAndFund` calldata and either posts to Safe TX Service or writes `./logs/safe_tx_proposal_<id>.json` for manual Safe UI import.

`SAFE_SERVICE_ENABLED=false` is the correct setting for Monad testnet (no official Safe TX service).

## Key constraints

- All token amounts are 18-decimal wei (MockUSD, TrackToken).
- `TrackFund.propose` does not record the proposer address — all auto-funded proposals route to `PROJECT_WALLET_DEFAULT`. To fix, add `address indexed proposer` to the `ProposalCreated` event.
- Para wallet integration uses `@getpara/react-sdk` v3 + `@getpara/evm-wallet-connectors` v3. OAuth methods: Google, Apple, Discord, Twitter, Farcaster. External wallets: MetaMask, Coinbase, WalletConnect, Rainbow, Zerion, Rabby.
