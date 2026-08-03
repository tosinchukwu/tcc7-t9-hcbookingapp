"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function WalletCreationLoader({ onSkip }: { onSkip?: () => void }) {
  const { ready, authenticated, user, login } = usePrivy();
  const [showSkip, setShowSkip] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If wallet is ready, proceed
    if (ready && authenticated && user?.wallet) {
      if (onSkip) onSkip();
      return;
    }

    // If not authenticated after 5 seconds, show skip
    const timer = setTimeout(() => {
      setShowSkip(true);
    }, 5000);

    // Check for errors after 10 seconds
    const errorTimer = setTimeout(() => {
      if (!authenticated) {
        setError("Wallet creation is taking longer than expected.");
      }
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(errorTimer);
    };
  }, [ready, authenticated, user, onSkip]);

  const handleSkip = () => {
    if (onSkip) onSkip();
  };

  const handleRetry = () => {
    // Attempt to re-login
    login();
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          {error ? "Still creating your wallet..." : "Creating your wallet..."}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {error || "This may take a few seconds."}
        </p>

        {showSkip && (
          <div className="mt-4 space-x-3">
            <button
              onClick={handleSkip}
              className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded transition"
            >
              Skip (continue anyway)
            </button>
            <button
              onClick={handleRetry}
              className="text-sm bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded transition"
            >
              Retry Login
            </button>
            <button
              onClick={handleReload}
              className="text-sm bg-gray-600 text-white hover:bg-gray-700 px-4 py-2 rounded transition"
            >
              Reload Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
