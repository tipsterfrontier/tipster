export type Profile = {
  handle: string;
  name: string;
  bio: string;
  avatar: string;
  // Devnet wallet that receives tips. Replace before demo.
  wallet: string;
};

// Hardcoded for v0/v1. Swap for Supabase later.
export const PROFILES: Profile[] = [
  {
    handle: "virginia",
    name: "Virginia",
    bio: "Frontier hackathon submitter. Building things on Solana.",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=virginia",
    wallet: "41dpgKjznoJ3PuFKXqkAZ23LRGRE59aEXwfwaaND2ZPf",
  },
  {
    handle: "judge",
    name: "Frontier Judge",
    bio: "Hackathon judge — tip me to thank me for reviewing your submission.",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=judge",
    wallet: "8N914WJ6g2qCRUzf1cXwsHKyGajcXWp7bPi6NVsv65Cm",
  },
];

export function getProfile(handle: string): Profile | undefined {
  return PROFILES.find((p) => p.handle.toLowerCase() === handle.toLowerCase());
}
