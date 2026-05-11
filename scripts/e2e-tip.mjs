// Programmatic devnet end-to-end tip test.
// Mirrors lib/tip.ts: createAssociatedTokenIdempotent + transferChecked + addMemo.
// Requires .keys/sender.json funded with devnet SOL (~0.01) and devnet USDC (~0.1).
//
//   node scripts/e2e-tip.mjs [--to virginia|judge] [--amount 0.05] [--message "hi"]

import { readFileSync } from "node:fs";
import {
  appendTransactionMessageInstructions,
  createKeyPairSignerFromPrivateKeyBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  address,
} from "@solana/kit";
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstructionAsync,
  getTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { getAddMemoInstruction } from "@solana-program/memo";

const RPC_URL = process.env.NEXT_PUBLIC_DEVNET_RPC_URL ?? "https://api.devnet.solana.com";
const WS_URL = RPC_URL.replace(/^http/, "ws");
const USDC_MINT = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const USDC_DECIMALS = 6;
const MEMO_PREFIX = "tip-jar:";

const args = parseArgs(process.argv.slice(2));
const handle = args.to ?? "virginia";
const amountUsdc = Number(args.amount ?? "0.05");
const message = args.message ?? "programmatic E2E test from agent";

const profiles = {
  virginia: "41dpgKjznoJ3PuFKXqkAZ23LRGRE59aEXwfwaaND2ZPf",
  judge: "8N914WJ6g2qCRUzf1cXwsHKyGajcXWp7bPi6NVsv65Cm",
};
const recipient = address(profiles[handle] ?? handle);

const senderKey = JSON.parse(readFileSync(".keys/sender.json", "utf8"));
const pkcs8 = Buffer.from(senderKey.privatePkcs8Hex, "hex");
const seed = pkcs8.subarray(pkcs8.length - 32); // ed25519 raw seed
const senderSigner = await createKeyPairSignerFromPrivateKeyBytes(new Uint8Array(seed));

console.log(`Sender:      ${senderSigner.address}`);
console.log(`Recipient:   ${recipient} (${handle})`);
console.log(`Amount:      ${amountUsdc} USDC`);
console.log(`Memo:        ${MEMO_PREFIX}${message}`);
console.log("");

const rpc = createSolanaRpc(RPC_URL);
const rpcSubs = createSolanaRpcSubscriptions(WS_URL);

// Pre-flight
const { value: lamports } = await rpc.getBalance(senderSigner.address).send();
console.log(`Sender SOL:  ${Number(lamports) / 1e9}`);
if (lamports < 5_000_000n) {
  console.error(`\n✗ Need ≥ 0.005 SOL on ${senderSigner.address}.`);
  console.error(`  Fund: https://faucet.solana.com (paste address, choose Devnet)`);
  process.exit(1);
}

const [senderAta] = await findAssociatedTokenPda({
  owner: senderSigner.address,
  mint: USDC_MINT,
  tokenProgram: TOKEN_PROGRAM_ADDRESS,
});

let usdc = 0;
try {
  const { value } = await rpc.getTokenAccountBalance(senderAta).send();
  usdc = Number(value.uiAmountString);
  console.log(`Sender USDC: ${usdc}`);
} catch {
  console.error(`\n✗ No USDC ATA on sender. Fund via https://faucet.circle.com`);
  console.error(`  Network: Solana Devnet, Token: USDC, Address: ${senderSigner.address}`);
  process.exit(1);
}
if (usdc < amountUsdc) {
  console.error(`\n✗ Need ≥ ${amountUsdc} USDC. Have ${usdc}.`);
  process.exit(1);
}

// Build tx (mirrors lib/tip.ts)
const baseUnits = BigInt(Math.round(amountUsdc * 10 ** USDC_DECIMALS));
const [recipientAta] = await findAssociatedTokenPda({
  owner: recipient,
  mint: USDC_MINT,
  tokenProgram: TOKEN_PROGRAM_ADDRESS,
});

const createRecipientAtaIx = await getCreateAssociatedTokenIdempotentInstructionAsync({
  payer: senderSigner,
  owner: recipient,
  mint: USDC_MINT,
});
const transferIx = getTransferCheckedInstruction({
  source: senderAta,
  mint: USDC_MINT,
  destination: recipientAta,
  authority: senderSigner,
  amount: baseUnits,
  decimals: USDC_DECIMALS,
});
const memoIx = getAddMemoInstruction({ memo: `${MEMO_PREFIX}${message}` });

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
const txMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (m) => setTransactionMessageFeePayer(senderSigner.address, m),
  (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
  (m) => appendTransactionMessageInstructions([createRecipientAtaIx, transferIx, memoIx], m),
);

const signedTx = await signTransactionMessageWithSigners(txMessage);
const signature = getSignatureFromTransaction(signedTx);

console.log("\nSending...");
const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions: rpcSubs });
await sendAndConfirm(signedTx, { commitment: "confirmed" });

console.log(`\n✓ Confirmed: ${signature}`);
console.log(`  Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
console.log(`  Recipient leaderboard: http://localhost:3000/${handle}`);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      out[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    }
  }
  return out;
}
