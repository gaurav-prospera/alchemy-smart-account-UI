import { useCallback, useMemo, useState, useEffect } from "react";
import {
  useSmartAccountClient,
  useSendUserOperation,
  useAlchemyAccountContext,
  useChain,
} from "@account-kit/react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount as useWagmiAccount, usePublicClient } from "wagmi";
import { encodeFunctionData } from "viem";
import { NFT_MINTABLE_ABI_PARSED } from "@/lib/constants";
import { useNftContractAddress } from "@/app/hooks/useNftContractAddress";

export interface UseMintNFTParams {
  onSuccess?: () => void;
}
export interface UseMintReturn {
  isMinting: boolean;
  handleMint: () => void;
  transactionUrl?: string;
  error?: string;
}

export const useMint = ({ onSuccess }: UseMintNFTParams): UseMintReturn => {
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string>();
  const nftContractAddress = useNftContractAddress();
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
      console.error("Mint error:", error);
      setIsMinting(false);
      setError(error.message || "Failed to mint NFT");
    },
    onSuccess: () => {
      setIsMinting(false);
      setError(undefined);
      onSuccess?.();
    },
    onMutate: () => {
      setIsMinting(true);
      setError(undefined);
    },
  });

  // Handle external wallet transaction success
  useEffect(() => {
    if (isExternalWallet && receipt && !isReceiptLoading) {
      setIsMinting(false);
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
      setIsMinting(false);
      setError(writeError.message || "Failed to mint NFT");
    }
  }, [writeError, isExternalWallet]);

  // Update minting state for external wallets
  useEffect(() => {
    if (isExternalWallet) {
      setIsMinting(isWritePending || isReceiptLoading);
    }
  }, [isExternalWallet, isWritePending, isReceiptLoading]);

  const handleMint = useCallback(async () => {
    if (!walletAddress) {
      setError("Wallet not connected");
      return;
    }

    if (!nftContractAddress) {
      setError("Contract address is not defined.");
      return;
    }

    if (isExternalWallet) {
      // For external wallets, use regular transaction
      try {
        writeContract({
          address: nftContractAddress,
          abi: NFT_MINTABLE_ABI_PARSED,
          functionName: "mintTo",
          args: [walletAddress],
        });
      } catch (err: any) {
        setError(err.message || "Failed to mint NFT");
      }
    } else {
      // For smart accounts, use user operation
      if (!client) {
        setError("Smart account client not available");
        return;
      }
      sendUserOperation({
        uo: {
          target: nftContractAddress,
          data: encodeFunctionData({
            abi: NFT_MINTABLE_ABI_PARSED,
            functionName: "mintTo",
            args: [client.getAddress()],
          }),
        },
      });
    }
  }, [client, sendUserOperation, nftContractAddress, walletAddress, isExternalWallet, writeContract]);

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
    isMinting,
    handleMint,
    transactionUrl,
    error,
  };
};
