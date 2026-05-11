import {
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createTransactionMessage,
  getBase58Decoder,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
  type Address,
  type TransactionSendingSigner,
} from "@solana/kit";
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstructionAsync,
  getTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { getAddMemoInstruction } from "@solana-program/memo";
import { DEVNET_RPC_URL, USDC_DECIMALS, USDC_MINT } from "./solana";

export const MEMO_PREFIX = "tip-jar:";

export type SendTipParams = {
  signer: TransactionSendingSigner;
  recipient: Address;
  amountUsdc: number; // human units, e.g. 0.5
  message: string;
};

export type TipResult = {
  signature: string;
  senderAta: Address;
  recipientAta: Address;
};

export async function sendTip({
  signer,
  recipient,
  amountUsdc,
  message,
}: SendTipParams): Promise<TipResult> {
  if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
    throw new Error("Amount must be a positive number");
  }
  const baseUnits = BigInt(Math.round(amountUsdc * 10 ** USDC_DECIMALS));
  if (baseUnits <= 0n) {
    throw new Error("Amount too small");
  }

  const rpc = createSolanaRpc(DEVNET_RPC_URL);

  const senderAddress = signer.address as Address;

  const [[senderAta], [recipientAta]] = await Promise.all([
    findAssociatedTokenPda({
      owner: senderAddress,
      mint: USDC_MINT,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    }),
    findAssociatedTokenPda({
      owner: recipient,
      mint: USDC_MINT,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    }),
  ]);

  const createRecipientAtaIx = await getCreateAssociatedTokenIdempotentInstructionAsync({
    payer: signer,
    owner: recipient,
    mint: USDC_MINT,
  });

  const transferIx = getTransferCheckedInstruction({
    source: senderAta,
    mint: USDC_MINT,
    destination: recipientAta,
    authority: signer,
    amount: baseUnits,
    decimals: USDC_DECIMALS,
  });

  const memoText = message.trim()
    ? `${MEMO_PREFIX}${message.trim().slice(0, 200)}`
    : MEMO_PREFIX;

  const memoIx = getAddMemoInstruction({ memo: memoText });

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const txMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(signer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstructions([createRecipientAtaIx, transferIx, memoIx], m),
  );

  const sigBytes = await signAndSendTransactionMessageWithSigners(txMessage);
  const signature = getBase58Decoder().decode(sigBytes);

  return { signature, senderAta, recipientAta };
}
