"use client";

import { useState } from "react";
import { useSelectedWalletAccount } from "@solana/react";
import { useWallets, type UiWallet } from "@wallet-standard/react";
import { useConnect, useDisconnect } from "@wallet-standard/react";
import { SOLANA_CHAIN } from "@/lib/solana";

function shortAddr(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function ConnectWalletButton({
  wallet,
  onConnected,
}: {
  wallet: UiWallet;
  onConnected: (account: UiWallet["accounts"][number]) => void;
}) {
  const [isConnecting, connect] = useConnect(wallet);
  return (
    <button
      type="button"
      disabled={isConnecting}
      onClick={async () => {
        try {
          const accounts = await connect();
          const sol = accounts.find((a) => a.chains.includes(SOLANA_CHAIN)) ?? accounts[0];
          if (sol) onConnected(sol);
        } catch (e) {
          console.error("connect failed", e);
        }
      }}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={wallet.icon} alt="" className="w-6 h-6 rounded" />
      <span className="text-sm font-medium">{wallet.name}</span>
      {isConnecting && <span className="ml-auto text-xs text-zinc-500">connecting…</span>}
    </button>
  );
}

function DisconnectButton({ wallet, onDone }: { wallet: UiWallet; onDone: () => void }) {
  const [isDisconnecting, disconnect] = useDisconnect(wallet);
  return (
    <button
      type="button"
      disabled={isDisconnecting}
      onClick={async () => {
        try {
          await disconnect();
        } catch (e) {
          console.error("disconnect failed", e);
        }
        onDone();
      }}
      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline disabled:opacity-50"
    >
      {isDisconnecting ? "disconnecting…" : "disconnect"}
    </button>
  );
}

export function WalletConnect() {
  const [account, setAccount, wallets] = useSelectedWalletAccount();
  const allWallets = useWallets();
  const [showPicker, setShowPicker] = useState(false);

  // Find the wallet that owns the currently-selected account, for disconnect.
  const ownerWallet = account
    ? allWallets.find((w) => w.accounts.some((a) => a.address === account.address))
    : undefined;

  if (account) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <code className="text-sm font-mono">{shortAddr(account.address)}</code>
        </div>
        {ownerWallet && (
          <DisconnectButton wallet={ownerWallet} onDone={() => setAccount(undefined)} />
        )}
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="text-sm text-zinc-500">
        No Solana wallet detected. Install{" "}
        <a
          href="https://phantom.com/download"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Phantom
        </a>{" "}
        or{" "}
        <a
          href="https://solflare.com/download"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Solflare
        </a>{" "}
        and refresh.
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker((s) => !s)}
        className="px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium hover:opacity-90"
      >
        Connect wallet
      </button>
      {showPicker && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-2 z-10 space-y-1">
          {wallets.map((w) => (
            <ConnectWalletButton
              key={w.name}
              wallet={w}
              onConnected={(a) => {
                setAccount(a);
                setShowPicker(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
