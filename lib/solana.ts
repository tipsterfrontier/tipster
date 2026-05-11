import { address } from "@solana/kit";

export const SOLANA_CHAIN = "solana:devnet" as const;

export const DEVNET_RPC_URL =
  process.env.NEXT_PUBLIC_DEVNET_RPC_URL ?? "https://api.devnet.solana.com";

// Devnet USDC-Dev mint (spl-token-faucet.com). Functionally identical SPL token,
// 6 decimals, widely circulated on devnet. Circle's `Gh9ZwEm…` mint also works
// but is less commonly funded across faucets.
export const USDC_MINT = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
export const USDC_DECIMALS = 6;
export const USDC_SYMBOL = "USDC";

export const EXPLORER_BASE = "https://explorer.solana.com";

export function explorerTx(sig: string) {
  return `${EXPLORER_BASE}/tx/${sig}?cluster=devnet`;
}

export function explorerAddress(addr: string) {
  return `${EXPLORER_BASE}/address/${addr}?cluster=devnet`;
}
