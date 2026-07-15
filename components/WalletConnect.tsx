"use client";

import { useState } from "react";
import { connectWallet } from "@/lib/web3";

export default function WalletConnect() {
  const [address, setAddress] = useState("");

  const handleConnect = async () => {
    const { address } = await connectWallet();
    setAddress(address);
  };

  const handleDisconnect = () => {
    setAddress("");
  };

  return (
    <>
      {address ? (
        <button
          onClick={handleDisconnect}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Disconnect ({address.slice(0, 6)}...)
        </button>
      ) : (
        <button
          onClick={handleConnect}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Connect Wallet
        </button>
      )}
    </>
  );
}