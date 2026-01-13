import {
  AlchemyAccountsUIConfig,
  cookieStorage,
  createConfig,
} from "@account-kit/react";
import { QueryClient } from "@tanstack/react-query";
import { chainNFTMintContractData } from "@/lib/chains";
import { alchemy } from "@account-kit/infra";

const API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
if (!API_KEY) {
  throw new Error("NEXT_PUBLIC_ALCHEMY_API_KEY is not set");
}

const SPONSORSHIP_POLICY_ID = process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID;
if (!SPONSORSHIP_POLICY_ID) {
  throw new Error("NEXT_PUBLIC_ALCHEMY_POLICY_ID is not set");
}

const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "30e7ffaff99063e68cc9870c105d905b";

const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? '') || 421614;
const chain = chainNFTMintContractData[CHAIN_ID]?.chain;
if (!chain) {
    throw new Error("Invalid chain ID")
}

const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: "outline",
  auth: {
    sections: [
      [{ type: "email" }],
      [
        { type: "passkey" },
        { type: "social", authProviderId: "google", mode: "popup" },
        { type: "social", authProviderId: "facebook", mode: "popup" },
        { type: "social", authProviderId: "twitch", mode: "popup" },
        // { 
        //   type: "social", 
        //   authProviderId: "auth0", 
        //   mode: "popup", 
        //   auth0Connection: "discord", 
        //   displayName: "Discord", 
        //   logoUrl: "/images/discord.svg", 
        //   scope: "openid profile" 
        // },
        // { 
        //   type: "social", 
        //   authProviderId: "auth0", 
        //   mode: "popup", 
        //   auth0Connection: "twitter", 
        //   displayName: "Twitter", 
        //   logoUrl: "/images/twitter.svg", 
        //   logoUrlDark: "/images/twitter-dark.svg", 
        //   scope: "openid profile" 
        // },
      ],
      [
        {
          type: "external_wallets",
          walletConnect: {
            projectId: WALLETCONNECT_PROJECT_ID
          },
          wallets: ["wallet_connect", "coinbase wallet"],
          chainType: ["svm", "evm"],
          moreButtonText: "More wallets",
          hideMoreButton: false,
          numFeaturedWallets: 1
        }
      ],
    ],
    addPasskeyOnSignup: false,
  },
};

export const config = createConfig(
  {
    transport: alchemy({ apiKey: API_KEY }),
    chain,
    ssr: true, // more about ssr: https://www.alchemy.com/docs/wallets/react/ssr
    storage: cookieStorage, // more about persisting state with cookies: https://www.alchemy.com/docs/wallets/react/ssr#persisting-the-account-state
    enablePopupOauth: true, // must be set to "true" if you plan on using popup rather than redirect in the social login flow
    policyId: SPONSORSHIP_POLICY_ID,
  },
  uiConfig
);

export const queryClient = new QueryClient();
