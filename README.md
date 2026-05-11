# Tipster

**Venmo's social layer, rebuilt on USDC.**

Tipster gives every Solana wallet a personal tipping page at
`tipster.xyz/<handle>` — avatar, bio, a "Send USDC" button, and a public
leaderboard of who's tipped and the on-chain notes they left.

Anyone can connect a wallet and send USDC with an optional message attached
as an on-chain memo. Each tip surfaces on the recipient's leaderboard.

> **Devnet only.** Hackathon submission. No mainnet, no real funds.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4
- `@solana/kit` — transaction building + RPC
- `@solana/react` + `@wallet-standard/react` — wallet-standard connection
- `@solana-program/token` — SPL Token transferChecked + ATA
- `@solana-program/memo` — Memo program
- Framer Motion — success animation

No custom on-chain program. Just SPL Token + Memo — composable primitives,
zero new attack surface.

## Network

| | |
|-|-|
| Cluster | Solana **devnet** |
| RPC | `https://api.devnet.solana.com` (override with `NEXT_PUBLIC_DEVNET_RPC_URL`) |
| USDC mint | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (devnet USDC-Dev, spl-token-faucet.com) |
| USDC decimals | 6 |
| Memo program | `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr` |

Memos sent by this app are prefixed with `tip-jar:` (the original codename)
to make them easy to filter, e.g. `tip-jar:thanks for shipping!`.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Visit a profile at `/virginia` or `/judge`
(handles are hardcoded in `lib/profiles.ts`).

## Try it (devnet flow)

1. Install [Phantom](https://phantom.com/download) or
   [Solflare](https://solflare.com/download).
2. **Switch the wallet to devnet** — Phantom: Settings → Developer Settings →
   Testnet Mode → Solana Devnet.
3. Get devnet SOL — `solana airdrop 1 <your-pubkey> --url devnet`, or use the
   in-wallet faucet.
4. Get devnet USDC — <https://spl-token-faucet.com> (mint
   `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`, "USDC-Dev").
5. Open a profile page, click **Connect wallet**, enter an amount + message,
   and send. The tx link appears on success.

## Project layout

```
app/
  layout.tsx          devnet banner + providers
  providers.tsx       wallet-standard provider (filtered to Solana wallets)
  page.tsx            home: list of demo profiles
  [handle]/page.tsx   profile page (server-rendered)
components/
  DevnetBanner.tsx    persistent "DEVNET — test tokens only" banner
  WalletConnect.tsx   wallet picker + connect/disconnect
  TipForm.tsx         amount + message input, calls sendTip()
  Leaderboard.tsx     server component — fetches + renders top tippers
lib/
  solana.ts           network constants (RPC URL, USDC mint, explorer helpers)
  profiles.ts         hardcoded profile data
  tip.ts              builds the tip transaction (createATA + transferChecked + memo)
  leaderboard.ts      fetches signatures for the recipient's USDC ATA, parses
                      transferChecked + memo, aggregates per sender
```

## Hackathon

Built for [Virginia's Frontier hackathon](https://frontier.virginia.foundation).
Devnet only, no real money.
