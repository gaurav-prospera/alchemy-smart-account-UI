/**
 * Business Knowledge Base
 * 
 * This file contains your business-specific information that the chatbot will use
 * to answer user questions. Update this file with your startup's information.
 * 
 * Structure:
 * - Each entry has a title, content, and category
 * - Content should be clear and concise
 * - The system will automatically create embeddings for semantic search
 */

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  lastUpdated?: string;
}

export const BUSINESS_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "about-1",
    title: "About Our Company",
    content: `We are a crypto stablecoin banking app that uses smart wallets. Our platform enables users to mint, trade, and swap cryptocurrencies with no gas fees through gas sponsorship. We support both Web2 social login (Google, Facebook, Twitch, Discord, Twitter) and Web3 external wallets (MetaMask, WalletConnect, Coinbase Wallet).`,
    category: "Company",
    tags: ["about", "company", "overview"],
  },
  {
    id: "features-1",
    title: "Smart Wallet Features",
    content: `Our smart wallets provide:
- Gasless transactions through gas sponsorship
- Social login options (email, passkey, Google, Facebook, Twitch, Discord, Twitter)
- External wallet connections (MetaMask, WalletConnect, Coinbase Wallet)
- NFT minting capabilities
- Secure account abstraction (ERC-4337)`,
    category: "Features",
    tags: ["smart-wallet", "features", "gasless"],
  },
  {
    id: "security-1",
    title: "Security Best Practices",
    content: `Security is our top priority:
- All transactions are secured through smart contract wallets
- Private keys are never exposed
- We use industry-standard encryption
- Support for hardware wallet connections
- Multi-factor authentication available`,
    category: "Security",
    tags: ["security", "safety", "privacy"],
  },
  {
    id: "support-1",
    title: "Getting Help",
    content: `If you need assistance:
- Use this chatbot for common questions
- For technical issues, contact our support team
- For financial guidance, please consult with a financial advisor
- Check our documentation for detailed guides`,
    category: "Support",
    tags: ["help", "support", "contact"],
  },
  // Add more entries below as your business grows
  // Example:
  // {
  //   id: "product-1",
  //   title: "Product Name",
  //   content: "Detailed product description...",
  //   category: "Products",
  //   tags: ["product", "feature"],
  // },
];

/**
 * Get all knowledge entries
 */
export const getAllKnowledge = (): KnowledgeEntry[] => {
  return BUSINESS_KNOWLEDGE;
};

/**
 * Get knowledge entries by category
 */
export const getKnowledgeByCategory = (category: string): KnowledgeEntry[] => {
  return BUSINESS_KNOWLEDGE.filter((entry) => entry.category === category);
};

/**
 * Search knowledge entries by keyword (simple text search)
 */
export const searchKnowledge = (query: string): KnowledgeEntry[] => {
  const lowerQuery = query.toLowerCase();
  return BUSINESS_KNOWLEDGE.filter(
    (entry) =>
      entry.title.toLowerCase().includes(lowerQuery) ||
      entry.content.toLowerCase().includes(lowerQuery) ||
      entry.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
};
