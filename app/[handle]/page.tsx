import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profiles";
import { WalletConnect } from "@/components/WalletConnect";
import { TipForm } from "@/components/TipForm";
import { Leaderboard } from "@/components/Leaderboard";
import { explorerAddress } from "@/lib/solana";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = getProfile(handle);
  if (!profile) notFound();

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black">
      <header className="w-full max-w-2xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          🫙 tipster
        </Link>
        <WalletConnect />
      </header>

      <main className="w-full max-w-2xl px-6 py-8 space-y-8">
        <section className="flex flex-col items-center text-center space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatar}
            alt=""
            className="w-24 h-24 rounded-full bg-zinc-100 ring-2 ring-zinc-200 dark:ring-zinc-800"
          />
          <h1 className="text-3xl font-semibold tracking-tight">
            {profile.name}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-md">{profile.bio}</p>
          <a
            href={explorerAddress(profile.wallet)}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-zinc-500 hover:underline"
          >
            {profile.wallet.slice(0, 6)}…{profile.wallet.slice(-6)} ↗
          </a>
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
          <div className="text-sm text-zinc-500 mb-3">Send {profile.name} a tip</div>
          <TipForm recipientAddr={profile.wallet} recipientName={profile.name} />
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
          <div className="text-sm text-zinc-500 mb-3">Top tippers</div>
          <Leaderboard recipient={profile.wallet} />
        </section>
      </main>

      <footer className="w-full max-w-2xl px-6 py-8 text-xs text-zinc-500 mt-auto">
        Built for Frontier hackathon · devnet only · no real money
      </footer>
    </div>
  );
}
