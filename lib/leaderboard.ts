import { createSolanaRpc, signature, type Address } from "@solana/kit";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import { DEVNET_RPC_URL, USDC_MINT } from "./solana";
import { MEMO_PREFIX } from "./tip";

const SIG_LIMIT = 25;

export type Tip = {
  signature: string;
  from: string;
  amount: number;
  message: string;
  blockTime: number | null;
};

export type LeaderEntry = {
  from: string;
  total: number;
  count: number;
  latestMessage: string;
};

export async function fetchTipHistory(recipient: Address): Promise<Tip[]> {
  const rpc = createSolanaRpc(DEVNET_RPC_URL);

  const [recipientAta] = await findAssociatedTokenPda({
    owner: recipient,
    mint: USDC_MINT,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  let sigs;
  try {
    sigs = await rpc.getSignaturesForAddress(recipientAta, { limit: SIG_LIMIT }).send();
  } catch {
    // ATA does not exist yet — no tips.
    return [];
  }

  if (!sigs.length) return [];

  const txs = await Promise.all(
    sigs
      .filter((s) => s.err === null)
      .map((s) =>
        rpc
          .getTransaction(signature(s.signature), {
            encoding: "jsonParsed",
            maxSupportedTransactionVersion: 0,
            commitment: "confirmed",
          })
          .send()
          .catch(() => null),
      ),
  );

  const tips: Tip[] = [];

  for (const tx of txs) {
    if (!tx || !tx.meta || tx.meta.err) continue;

    const all = [
      ...tx.transaction.message.instructions,
      ...(tx.meta.innerInstructions ?? []).flatMap((g) => g.instructions),
    ];

    let amount: number | null = null;
    let from: string | null = null;
    for (const ix of all) {
      if (!("parsed" in ix)) continue;
      const p = ix.parsed;
      if (
        ix.program === "spl-token" &&
        (p.type === "transferChecked" || p.type === "transfer")
      ) {
        const info = p.info as Record<string, unknown> | undefined;
        if (!info) continue;
        if (info.destination !== recipientAta) continue;
        if (info.mint && info.mint !== USDC_MINT) continue;
        const tokenAmount = info.tokenAmount as
          | { uiAmount?: number | null; amount?: string; decimals?: number }
          | undefined;
        if (tokenAmount?.uiAmount != null) {
          amount = tokenAmount.uiAmount;
        } else if (typeof info.amount === "string") {
          amount = Number(info.amount) / 1_000_000;
        }
        from = (info.authority as string | undefined) ?? (info.source as string | undefined) ?? null;
      }
    }

    if (amount == null || !from) continue;

    let message = "";
    for (const ix of all) {
      if ("parsed" in ix && ix.program === "spl-memo") {
        const parsedAny = ix.parsed as unknown;
        let memoStr = "";
        if (typeof parsedAny === "string") {
          memoStr = parsedAny;
        } else if (
          parsedAny &&
          typeof parsedAny === "object" &&
          "info" in parsedAny &&
          typeof (parsedAny as { info: unknown }).info === "string"
        ) {
          memoStr = (parsedAny as { info: string }).info;
        }
        message = memoStr.startsWith(MEMO_PREFIX)
          ? memoStr.slice(MEMO_PREFIX.length)
          : memoStr;
        break;
      }
    }

    tips.push({
      signature: tx.transaction.signatures[0] as unknown as string,
      from,
      amount,
      message,
      blockTime: tx.blockTime != null ? Number(tx.blockTime) : null,
    });
  }

  return tips;
}

export function aggregate(tips: Tip[]): LeaderEntry[] {
  const map = new Map<string, LeaderEntry>();
  for (const t of tips) {
    const cur = map.get(t.from);
    if (cur) {
      cur.total += t.amount;
      cur.count += 1;
      if (!cur.latestMessage && t.message) cur.latestMessage = t.message;
    } else {
      map.set(t.from, {
        from: t.from,
        total: t.amount,
        count: 1,
        latestMessage: t.message,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
