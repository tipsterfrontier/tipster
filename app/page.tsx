import Link from "next/link";
import { PROFILES } from "@/lib/profiles";
import { WalletConnect } from "@/components/WalletConnect";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black">
      <header className="w-full max-w-3xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          🫙 tipster
        </Link>
        <WalletConnect />
      </header>

      <main className="w-full max-w-3xl px-6 py-12 space-y-12">
        <section>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Your onchain Tipster.
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400 max-w-xl">
            USDC, with a note. Anyone can tip you, and you keep every cent.
            Built on Solana.
          </p>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-wider text-zinc-500 mb-3">
            Demo profiles
          </h2>
          <ul className="space-y-2">
            {PROFILES.map((p) => (
              <li key={p.handle}>
                <Link
                  href={`/${p.handle}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full bg-zinc-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-zinc-500 truncate">
                      tipster.xyz/{p.handle}
                    </div>
                  </div>
                  <span className="text-zinc-400">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="w-full max-w-3xl px-6 py-8 text-xs text-zinc-500 mt-auto">
        Built for Frontier hackathon · devnet only · no real money
      </footer>
    </div>
  );
}
