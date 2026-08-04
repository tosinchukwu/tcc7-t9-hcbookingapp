// lib/viem.ts
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

// Use the same RPC URL as your app. If you don't have one, use a public one or Alchemy/Infura.
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia.publicnode.com";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});
