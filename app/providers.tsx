"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { sepolia, localhost } from "viem/chains";
import { injected, walletConnect } from "wagmi/connectors";

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [sepolia, localhost],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.gateway.tenderly.co"),
    [localhost.id]: http("http://127.0.0.1:8545"),
  },
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    }),
  ],
});

export function Providers({ children }: { children: React.ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PrivyProvider
        appId={privyAppId}
        config={{
          loginMethods: ["email", "wallet", "google"],
          appearance: { theme: "light", accentColor: "#2563eb" },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            {children}
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </NextThemeProvider>
  );
}