"use client";

import { useSmartAccountClient, useSignerStatus } from "@account-kit/react";
import UserInfoCard from "./components/user-info-card";
import NftMintCard from "./components/nft-mint-card";
import NikaTestingContract from "./components/nika-testing-contract";
import LoginCard from "./components/login-card";
import Header from "./components/header";
import LearnMore from "./components/learn-more";

export default function Home() {
  const signerStatus = useSignerStatus();
  const { client, address } = useSmartAccountClient({});
  
  // Check if connected via signer status OR if address exists (for external wallets)
  // For external wallets, client is undefined but address is set
  const isConnected = signerStatus.isConnected || !!address;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />
      <div className="bg-bg-main bg-cover bg-center bg-no-repeat h-[calc(100vh-4rem)]">
        <main className="container mx-auto px-4 py-8 h-full">
          {isConnected ? (
            <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
              <div className="flex flex-col gap-8">
                <UserInfoCard />
                <LearnMore />
              </div>
              <div className="flex flex-col gap-8">
                <NftMintCard />
                <NikaTestingContract />
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-full pb-[4rem]">
              <LoginCard />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
