import { useSmartAccountClient, useAlchemyAccountContext, useChain } from "@account-kit/react";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { type Address } from "viem";
import { NIKA_TESTING_ABI_PARSED } from "@/lib/constants";

interface UseReadNikaContractParams {
  contractAddress?: Address;
}

export const useReadNikaContract = (props: UseReadNikaContractParams) => {
  const { contractAddress } = props;

  const { client, address } = useSmartAccountClient({});
  const { config } = useAlchemyAccountContext();
  const wagmiConfig = config._internal.wagmiConfig;
  const publicClient = usePublicClient({ config: wagmiConfig as any });
  const { chain } = useChain();
  
  // Determine if this is an external wallet (EOA) or smart account
  const isExternalWallet = !client && !!address;
  const chainId = client?.chain?.id || publicClient?.chain?.id || chain?.id;

  const {
    data: storedValue,
    isLoading: isLoadingValue,
    error: valueError,
    refetch: refetchValue,
  } = useQuery<
    bigint | undefined,
    Error,
    bigint | undefined,
    readonly unknown[]
  >({
    queryKey: ["nikaRetrieve", contractAddress, chainId],
    queryFn: async () => {
      if (!contractAddress) {
        throw new Error("Contract address is not defined for queryFn.");
      }
      
      if (isExternalWallet && publicClient) {
        // For external wallets, use public client
        const value = await publicClient.readContract({
          address: contractAddress,
          abi: NIKA_TESTING_ABI_PARSED,
          functionName: "retrieve",
        });
        return value as bigint;
      } else if (client) {
        // For smart accounts, use smart account client
        const value = await client.readContract({
          address: contractAddress,
          abi: NIKA_TESTING_ABI_PARSED,
          functionName: "retrieve",
        });
        return value as bigint;
      }
      throw new Error("Client not available");
    },
    enabled: (!!client || !!publicClient) && !!contractAddress,
  });

  return {
    storedValue,
    isLoadingValue,
    error: valueError,
    refetchValue,
  };
};
