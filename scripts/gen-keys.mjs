import { getAddressFromPublicKey } from "@solana/kit";
import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync(".keys", { recursive: true });
const handles = ["virginia", "judge", "sender"];
for (const h of handles) {
  const kp = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]);
  const address = await getAddressFromPublicKey(kp.publicKey);
  const priv = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
  const pub = await crypto.subtle.exportKey("raw", kp.publicKey);
  writeFileSync(`.keys/${h}.json`, JSON.stringify({
    address,
    privatePkcs8Hex: Buffer.from(priv).toString("hex"),
    publicRawHex: Buffer.from(pub).toString("hex"),
  }, null, 2));
  console.log(`${h}: ${address}`);
}
