import { useSmartAccountClient, useAlchemyAccountContext, useChain } from "@account-kit/react";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { type Address, createPublicClient, http } from "viem";
import { NFT_MINTABLE_ABI_PARSED } from "@/lib/constants";

interface UseReadNFTUriParams {
  contractAddress?: Address;
  ownerAddress?: Address;
}

export const useReadNFTData = (props: UseReadNFTUriParams) => {
  const { contractAddress, ownerAddress } = props;

  const { client, address } = useSmartAccountClient({});
  const { config } = useAlchemyAccountContext();
  const wagmiConfig = config._internal.wagmiConfig;
  const publicClient = usePublicClient({ config: wagmiConfig as any });
  const { chain } = useChain();
  
  // Determine if this is an external wallet (EOA) or smart account
  const isExternalWallet = !client && !!address;
  const chainId = client?.chain?.id || publicClient?.chain?.id || chain?.id;

  const {
    data: uri,
    isLoading: isLoadingUri,
    error: uriError,
  } = useQuery<
    string | undefined,
    Error,
    string | undefined,
    readonly unknown[]
  >({
    queryKey: ["nftBaseURI", contractAddress, chainId],
    queryFn: async () => {
      if (!contractAddress) {
        throw new Error("Contract address is not defined for queryFn.");
      }
      
      // Try external wallet first, then smart account client
      if (isExternalWallet) {
        // For external wallets, use public client or create one from chain
        let readClient = publicClient;
        
        if (!readClient && chain) {
          // Create a public client from chain config if wagmi's publicClient is not ready
          readClient = createPublicClient({
            chain,
            transport: http(),
          });
        }
        
        if (readClient) {
          const baseUriString = await readClient.readContract({
            address: contractAddress,
            abi: NFT_MINTABLE_ABI_PARSED,
            functionName: "baseURI",
          });
          return baseUriString as string;
        }
      }
      
      if (client) {
        // For smart accounts, use smart account client
        const baseUriString = await client.readContract({
          address: contractAddress,
          abi: NFT_MINTABLE_ABI_PARSED,
          functionName: "baseURI",
        });
        return baseUriString as string;
      }
      
      throw new Error("Client not available");
    },
    enabled: !!contractAddress && (!!client || !!publicClient || !!chain),
  });

  // Query for NFT count - use wagmi for external wallets, smart account client for embedded wallets
  const {
    data: count,
    isLoading: isLoadingCount,
    error: countError,
    refetch: refetchCount,
  } = useQuery<
    number | undefined,
    Error,
    number | undefined,
    readonly unknown[]
  >({
    queryKey: ["nftBalance", contractAddress, ownerAddress, chainId],
    queryFn: async () => {
      if (!contractAddress) {
        throw new Error("Contract address is not defined for queryFn.");
      }
      if (!ownerAddress) {
        throw new Error("Owner address is not defined for queryFn.");
      }
      
      if (isExternalWallet) {
        // For external wallets, use public client or create one from chain
        let readClient = publicClient;
        
        if (!readClient && chain) {
          // Create a public client from chain config if wagmi's publicClient is not ready
          readClient = createPublicClient({
            chain,
            transport: http(),
          });
        }
        
        if (readClient) {
          const balance = await readClient.readContract({
            address: contractAddress,
            abi: NFT_MINTABLE_ABI_PARSED,
            functionName: "balanceOf",
            args: [ownerAddress],
          });
          return Number(balance);
        }
      } else if (client) {
        // For smart accounts, use smart account client
        const balance = await client.readContract({
          address: contractAddress,
          abi: NFT_MINTABLE_ABI_PARSED,
          functionName: "balanceOf",
          args: [ownerAddress],
        });
        return Number(balance);
      }
      throw new Error("Client not available");
    },
    enabled: !!contractAddress && !!ownerAddress && (!!client || !!publicClient || !!chain),
  });

  return {
    uri,
    count,
    isLoading: isLoadingUri || isLoadingCount,
    isLoadingUri,
    isLoadingCount,
    error: uriError || countError,
    uriError,
    countError,
    refetchCount,
  };
};
