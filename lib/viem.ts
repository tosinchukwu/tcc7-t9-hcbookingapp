// lib/viem.ts
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

// ✅ CENTRALIZED RPC CONFIG - all parts of app use SAME endpoint

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.gateway.tenderly.co";

const rpcUrl = RPC_URL;

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});
