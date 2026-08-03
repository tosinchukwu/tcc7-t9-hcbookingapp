"use client";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useEnsName } from "wagmi";
import { useEffect, useState } from "react";

export default function Greeting() {
  const { authenticated } = usePrivy();
  const { address } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/user?wallet=${address}`);
        if (res.ok) {
          const user = await res.json();
          if (user && user.name) {
            setUserName(user.name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [address]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  };

  if (!authenticated || !address) return null;

  // Prefer database name, then ENS, then truncated address
  const displayName = userName || ensName || `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
      {getGreeting()}, {displayName} 👋
    </p>
  );
}
