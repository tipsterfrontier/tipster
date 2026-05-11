"use client";

import { SelectedWalletAccountContextProvider } from "@solana/react";
import type { UiWallet } from "@wallet-standard/react";
import { SOLANA_CHAIN } from "@/lib/solana";

const STORAGE_KEY = "tip-jar:selected-wallet";

function isSolanaDevnetWallet(wallet: UiWallet) {
  return wallet.chains.some((c) => c === SOLANA_CHAIN || c === "solana:mainnet");
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SelectedWalletAccountContextProvider
      filterWallets={isSolanaDevnetWallet}
      stateSync={{
        getSelectedWallet: () =>
          typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY),
        storeSelectedWallet: (key) => window.localStorage.setItem(STORAGE_KEY, key),
        deleteSelectedWallet: () => window.localStorage.removeItem(STORAGE_KEY),
      }}
    >
      {children}
    </SelectedWalletAccountContextProvider>
  );
}
