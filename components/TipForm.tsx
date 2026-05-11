"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelectedWalletAccount, useWalletAccountTransactionSendingSigner } from "@solana/react";
import { address } from "@solana/kit";
import type { UiWalletAccount } from "@wallet-standard/react";
import { sendTip } from "@/lib/tip";
import { explorerTx, SOLANA_CHAIN } from "@/lib/solana";

const PRESETS = [0.1, 0.5, 1, 5];

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success"; signature: string }
  | { kind: "error"; message: string };

function TipFormInner({
  account,
  recipientAddr,
  recipientName,
}: {
  account: UiWalletAccount;
  recipientAddr: string;
  recipientName: string;
}) {
  const signer = useWalletAccountTransactionSendingSigner(account, SOLANA_CHAIN);
  const [amount, setAmount] = useState("0.5");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setStatus({ kind: "error", message: "Enter a positive amount" });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const { signature } = await sendTip({
        signer,
        recipient: address(recipientAddr),
        amountUsdc: parsed,
        message,
      });
      setStatus({ kind: "success", signature });
      setMessage("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus({ kind: "error", message: msg });
    }
  }

  if (status.kind === "success") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="text-center space-y-3 py-4"
        >
          <div className="text-5xl">🎉</div>
          <div className="text-lg font-medium">
            You tipped {recipientName} {parseFloat(amount)} USDC
          </div>
          <a
            href={explorerTx(status.signature)}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-blue-600 dark:text-blue-400 underline"
          >
            View transaction ↗
          </a>
          <div>
            <button
              type="button"
              onClick={() => setStatus({ kind: "idle" })}
              className="text-xs text-zinc-500 underline"
            >
              Send another
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const isSending = status.kind === "sending";

  return (
    <form onSubmit={handleSend} className="space-y-3">
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
          Amount (USDC)
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(String(p))}
              className={`px-3 py-1 text-sm rounded-full border ${
                parseFloat(amount) === p
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono"
          disabled={isSending}
        />
      </div>
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
          Message (optional)
        </label>
        <input
          type="text"
          maxLength={200}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Thanks for shipping, ${recipientName}!`}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
          disabled={isSending}
        />
      </div>
      <button
        type="submit"
        disabled={isSending}
        className="w-full py-3 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {isSending ? "Sending tip…" : `Tip ${recipientName} ${amount || "0"} USDC`}
      </button>
      {status.kind === "error" && (
        <div className="text-sm text-red-600 dark:text-red-400">{status.message}</div>
      )}
    </form>
  );
}

export function TipForm({
  recipientAddr,
  recipientName,
}: {
  recipientAddr: string;
  recipientName: string;
}) {
  const [account] = useSelectedWalletAccount();

  if (!account) {
    return (
      <div className="text-sm text-zinc-500">
        Connect a wallet to tip {recipientName}.
      </div>
    );
  }

  return (
    <TipFormInner
      account={account}
      recipientAddr={recipientAddr}
      recipientName={recipientName}
    />
  );
}
