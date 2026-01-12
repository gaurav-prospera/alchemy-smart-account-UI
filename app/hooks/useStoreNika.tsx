import { useCallback, useMemo, useState, useEffect } from "react";
import {
  useSmartAccountClient,
  useSendUserOperation,
  useAlchemyAccountContext,
  useChain,
} from "@account-kit/react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount as useWagmiAccount, usePublicClient } from "wagmi";
import { encodeFunctionData } from "viem";
import { NIKA_TESTING_ABI_PARSED } from "@/lib/constants";
import type { Address } from "viem";

export interface UseStoreNikaParams {
  contractAddress: Address;
  onSuccess?: () => void;
}

export interface UseStoreNikaReturn {
  isStoring: boolean;
  handleStore: (num: bigint) => void;
  transactionUrl?: string;
  error?: string;
}

export const useStoreNika = ({ contractAddress, onSuccess }: UseStoreNikaParams): UseStoreNikaReturn => {
  const [isStoring, setIsStoring] = useState(false);
  const [error, setError] = useState<string>();
  const { config } = useAlchemyAccountContext();
  const wagmiConfig = config._internal.wagmiConfig;

  const { client, address } = useSmartAccountClient({});
  const { address: wagmiAddress } = useWagmiAccount({ 
    config: wagmiConfig as any 
  });
  const { chain } = useChain();
  const publicClient = usePublicClient({ config: wagmiConfig as any });
  
  // Determine if this is an external wallet (EOA) or smart account
  const isExternalWallet = !client && (!!address || !!wagmiAddress);
  const walletAddress = address || wagmiAddress || client?.account?.address;

  // For external wallets, use wagmi's useWriteContract
  const { 
    writeContract, 
    data: writeHash, 
    isPending: isWritePending,
    error: writeError 
  } = useWriteContract({
    config: wagmiConfig as any,
  });

  const { data: receipt, isLoading: isReceiptLoading } = useWaitForTransactionReceipt({
    config: wagmiConfig as any,
    hash: writeHash,
  });

  // For smart accounts, use user operations
  const { sendUserOperationResult, sendUserOperation } = useSendUserOperation({
    client: client || undefined,
    waitForTxn: true,
    onError: (error: Error) => {
      console.error("Store error:", error);
      setIsStoring(false);
      
      // Provide better error messages for common issues
      let errorMessage = error.message || "Failed to store value";
      
      if (errorMessage.includes("Policy max count exceeded") || errorMessage.includes("Sponsorship failed")) {
        errorMessage = 
          "Gas sponsorship limit reached. Please update your paymaster policy or use an external wallet " +
          "(MetaMask, WalletConnect) to continue.";
      } else if (errorMessage.includes("Missing or invalid parameters")) {
        errorMessage = "Transaction failed. Please check your connection and try again, or use an external wallet.";
      }
      
      setError(errorMessage);
    },
    onSuccess: () => {
      setIsStoring(false);
      setError(undefined);
      onSuccess?.();
    },
    onMutate: () => {
      setIsStoring(true);
      setError(undefined);
    },
  });

  // Handle external wallet transaction success
  useEffect(() => {
    if (isExternalWallet && receipt && !isReceiptLoading) {
      setIsStoring(false);
      setError(undefined);
      // Call onSuccess after a brief delay to ensure transaction is fully processed
      setTimeout(() => {
        onSuccess?.();
      }, 500);
    }
  }, [receipt, isReceiptLoading, isExternalWallet, onSuccess]);

  // Handle external wallet transaction error
  useEffect(() => {
    if (isExternalWallet && writeError) {
      setIsStoring(false);
      setError(writeError.message || "Failed to store value");
    }
  }, [writeError, isExternalWallet]);

  // Update storing state for external wallets
  useEffect(() => {
    if (isExternalWallet) {
      setIsStoring(isWritePending || isReceiptLoading);
    }
  }, [isExternalWallet, isWritePending, isReceiptLoading]);

  const handleStore = useCallback(async (num: bigint) => {
    if (!walletAddress) {
      setError("Wallet not connected");
      return;
    }

    if (!contractAddress) {
      setError("Contract address is not defined.");
      return;
    }

    if (isExternalWallet) {
      // For external wallets, use regular transaction
      try {
        writeContract({
          address: contractAddress,
          abi: NIKA_TESTING_ABI_PARSED,
          functionName: "store",
          args: [num],
        });
      } catch (err: any) {
        setError(err.message || "Failed to store value");
      }
    } else {
      // For smart accounts, use user operation
      if (!client) {
        setError("Smart account client not available");
        return;
      }
      sendUserOperation({
        uo: {
          target: contractAddress,
          data: encodeFunctionData({
            abi: NIKA_TESTING_ABI_PARSED,
            functionName: "store",
            args: [num],
          }),
        },
      });
    }
  }, [client, sendUserOperation, contractAddress, walletAddress, isExternalWallet, writeContract]);

  const transactionUrl = useMemo(() => {
    // Get chain from multiple sources with fallbacks - prioritize useChain as it has full config
    const currentChain = chain || client?.chain || publicClient?.chain;
    const blockExplorerUrl = currentChain?.blockExplorers?.default?.url;
    
    if (isExternalWallet) {
      // For external wallets, use the receipt hash (preferred) or write hash
      // Show URL as soon as we have a hash, even before receipt confirmation
      const txHash = receipt?.transactionHash || writeHash;
      if (txHash && blockExplorerUrl) {
        return `${blockExplorerUrl}/tx/${txHash}`;
      }
      return undefined;
    }
    // For smart accounts, use user operation hash
    if (!blockExplorerUrl || !sendUserOperationResult?.hash) {
      return undefined;
    }
    return `${blockExplorerUrl}/tx/${sendUserOperationResult.hash}`;
  }, [client, chain, publicClient, sendUserOperationResult?.hash, writeHash, receipt, isExternalWallet]);

  return {
    isStoring,
    handleStore,
    transactionUrl,
    error,
  };
};
