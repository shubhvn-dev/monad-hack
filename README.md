# TrackFund

Onchain AI research investment pools on Monad testnet.

Investors deposit stablecoins and receive share tokens. Researchers submit funding proposals. An autonomous governance agent evaluates proposals and routes qualifying ones through a Safe multisig — no manual bottleneck.

## What it does

- **Invest** — deposit MockUSD, receive TRACK tokens 1:1; withdraw anytime
- **Propose** — researchers submit funding requests with amount + description
- **Govern** — agent polls `ProposalCreated` events, checks eligibility rules, and proposes `approveAndFund` transactions to the Safe multisig
- **Execute** — Safe owners co-sign; funds flow to the project wallet

## Stack

| Layer | Tech |
|---|---|
| Contracts | Solidity 0.8.28, Foundry |
| Frontend | Next.js 16, wagmi v3, viem v2 |
| Wallets | Para embedded MPC (email / social / passkey) + MetaMask / WalletConnect |
| Governance | Node.js agent, ethers v6, Safe TX Service |
| Network | Monad testnet (chain 10143) |

## Contracts (Monad testnet)

| Contract | Address |
|---|---|
| MockUSD | `0xCCBE5a3C7dC5287C412598dfb5AEA6571710021e` |
| TrackFundFactory | `0x4D527272Cb7d6e0E54f6EDc37061c8f79E20De6C` |
| TrackFund | `0x64912E918B46C4BBb7C61300CFC30d0b83aBcB1d` |
| TrackToken | `0x8c02b627940308B70C5FfC08236bab670B0a8448` |
| Safe multisig (admin) | `0x0257C2bFad2c97E8fb69f6E0106d6CE07EF2B72F` |

## Project structure

```
contracts/   Foundry — MockUSD, TrackToken, TrackFund, TrackFundFactory
web/         Next.js frontend
agent/       Governance bot
```

## Running locally

### Contracts
```sh
cd contracts
forge build
forge test
```

### Frontend
```sh
cd web
cp .env.local.example .env.local   # add NEXT_PUBLIC_PARA_API_KEY
npm install
npm run dev
```

### Agent
```sh
cd agent
cp .env.example .env   # fill keys
npm install
npm run dev
```
