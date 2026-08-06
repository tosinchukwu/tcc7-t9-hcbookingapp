// lib/viem.ts
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

// ✅ CENTRALIZED RPC CONFIG
// This ensures ALL parts of the app use the SAME RPC endpoint
// Fallback to Tenderly (free tier with good rate limits)
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.gateway.tenderly.co";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});
