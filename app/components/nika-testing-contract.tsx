"use client";

import { useState, useEffect } from "react";
import {
  ExternalLink,
  Loader2,
  Save,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useReadNikaContract } from "@/app/hooks/useReadNikaContract";
import { useStoreNika } from "@/app/hooks/useStoreNika";
import { useSmartAccountClient } from "@account-kit/react";

const NIKA_CONTRACT_ADDRESS = "0xfF971A0e566b2175D48393cbC082577F8629b39f" as const;

export default function NikaTestingContract() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");

  const { client, address } = useSmartAccountClient({});
  
  const { storedValue, isLoadingValue, refetchValue } = useReadNikaContract({
    contractAddress: NIKA_CONTRACT_ADDRESS,
  });

  const { isStoring, handleStore, error, transactionUrl } = useStoreNika({
    contractAddress: NIKA_CONTRACT_ADDRESS,
    onSuccess: () => {
      // Add a small delay to ensure blockchain state has updated
      setTimeout(() => {
        refetchValue();
      }, 2000);
    },
  });

  // Reset success animation when new transaction appears
  useEffect(() => {
    if (transactionUrl) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [transactionUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = BigInt(inputValue || "0");
    handleStore(num);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Nika Testing Contract</CardTitle>
        <CardDescription>
          Test contract interaction with store and retrieve functions. Works with both web2 (smart accounts) and web3 (external wallets).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Stored Value */}
        <div className="space-y-2">
          <Label>Current Stored Value</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-2 border rounded-md bg-muted/50">
              {isLoadingValue ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <span className="font-mono text-lg">
                  {storedValue?.toString() ?? "0"}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchValue()}
              disabled={isLoadingValue}
            >
              <Loader2 className={cn("h-4 w-4", isLoadingValue && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Store New Value */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-value">Store New Value</Label>
            <Input
              id="store-value"
              type="number"
              placeholder="Enter a number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isStoring}
              min="0"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600 break-words overflow-hidden">
                {error}
              </p>
              {error.includes("sponsorship") || error.includes("Policy max count") ? (
                <p className="text-xs text-red-500 mt-2">
                  💡 Tip: Try disconnecting and connecting with an external wallet (MetaMask, WalletConnect) to bypass sponsorship limits.
                </p>
              ) : null}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button
              type="submit"
              className="w-full sm:w-auto gap-2 relative overflow-hidden group"
              size="lg"
              disabled={isStoring || !inputValue}
            >
              <span
                className={cn(
                  "flex items-center gap-2 transition-transform duration-300",
                  isStoring ? "translate-y-10" : ""
                )}
              >
                <Save className="h-[18px] w-[18px]" />
                Store Value {!!client?.chain?.name && `on ${client.chain.name}`}
              </span>
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-transform duration-300",
                  isStoring ? "translate-y-0" : "translate-y-10"
                )}
              >
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Storing...
              </span>
            </Button>

            <div className="flex-1"></div>

            {transactionUrl && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className={cn(
                  "gap-2 w-full sm:w-auto relative overflow-hidden transition-all duration-500",
                  "border-green-400 text-green-700 hover:bg-green-50",
                  "animate-in fade-in duration-700"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(transactionUrl, "_blank", "noopener,noreferrer");
                }}
              >
                {showSuccess ? (
                  <>
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-10"
                      style={{
                        animation: "sweep 1.5s ease-out",
                      }}
                    />
                    <span className="relative z-10">Successful store!</span>
                    <CheckCircle className="h-4 w-4 relative z-10" />
                    <style jsx>{`
                      @keyframes sweep {
                        0% {
                          transform: translateX(-100%);
                          opacity: 0;
                        }
                        50% {
                          opacity: 0.2;
                        }
                        100% {
                          transform: translateX(100%);
                          opacity: 0;
                        }
                      }
                    `}</style>
                  </>
                ) : (
                  <>
                    <span>View Transaction</span>
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
