"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import { createPublicClient, http, formatEther } from "viem";
import { sepolia } from "viem/chains";

export default function WalletInfo() {
  const { address, isConnected } = useAccount();
  const { wallets, ready } = useWallets();
  const { exportWallet } = usePrivy();
  const [balance, setBalance] = useState("");
  const [showExport, setShowExport] = useState(false);

  // ✅ Use the first wallet (any type) or fallback to the connected address
  const wallet = wallets && wallets.length > 0 ? wallets[0] : null;
  const walletAddress = wallet?.address || address;
  const isEmbedded = wallet?.walletClientType === "privy";

  useEffect(() => {
    async function fetchBalance() {
      if (!walletAddress) return;
      try {
        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http(),
        });
        const balanceWei = await publicClient.getBalance({
          address: walletAddress as `0x${string}`,
        });
        setBalance(formatEther(balanceWei));
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    }
    fetchBalance();
  }, [walletAddress]);

  // Show nothing if not connected or no address
  if (!isConnected || !walletAddress) {
    return null;
  }

  const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 sm:p-4 max-w-sm mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Your Wallet {isEmbedded && "(Privy)"}
          </p>
          <p className="text-sm font-mono text-gray-800 dark:text-gray-100 truncate" title={walletAddress}>
            {truncatedAddress}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Balance: <span className="font-semibold">{balance || "0"} ETH</span>
          </p>
        </div>
        {isEmbedded && (
          <button
            onClick={() => setShowExport(!showExport)}
            className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded whitespace-nowrap"
          >
            {showExport ? "Cancel" : "Export Private Key"}
          </button>
        )}
      </div>
      {showExport && isEmbedded && (
        <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          <button
            onClick={() => exportWallet()}
            className="w-full text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Confirm Export
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Warning: This reveals your private key. Never share it.
          </p>
        </div>
      )}
    </div>
  );
}
