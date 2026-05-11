import { address } from "@solana/kit";
import { aggregate, fetchTipHistory, type LeaderEntry } from "@/lib/leaderboard";
import { explorerAddress } from "@/lib/solana";

function shortAddr(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export async function Leaderboard({ recipient }: { recipient: string }) {
  let entries: LeaderEntry[] = [];
  try {
    const tips = await fetchTipHistory(address(recipient));
    entries = aggregate(tips);
  } catch (e) {
    console.error("leaderboard fetch failed", e);
  }

  if (entries.length === 0) {
    return (
      <div className="text-sm text-zinc-500 italic">
        No tips yet. Be the first.
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {entries.slice(0, 10).map((e, i) => (
        <li
          key={e.from}
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
        >
          <span className="w-5 text-sm font-mono text-zinc-500">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <a
              href={explorerAddress(e.from)}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-mono hover:underline"
            >
              {shortAddr(e.from)}
            </a>
            {e.latestMessage && (
              <div className="text-xs text-zinc-500 truncate italic">
                “{e.latestMessage}”
              </div>
            )}
          </div>
          <div className="text-sm font-semibold tabular-nums">
            {e.total.toFixed(2)} USDC
          </div>
        </li>
      ))}
    </ol>
  );
}
