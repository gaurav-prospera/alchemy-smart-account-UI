# Business Knowledge Base Guide

## Overview

Your chatbot now uses **RAG (Retrieval Augmented Generation)** to answer questions using your business-specific data. This means the chatbot can provide accurate, contextual answers about your startup.

## How It Works

1. **Knowledge Storage**: Business information is stored in `lib/business-knowledge.ts`
2. **Semantic Search**: When a user asks a question, the system finds the most relevant business knowledge using AI embeddings
3. **Context Injection**: Relevant knowledge is injected into the AI prompt
4. **Smart Responses**: The chatbot answers using your business data

## Adding Business Data

### Step 1: Edit `lib/business-knowledge.ts`

Open the file and add your business information as `KnowledgeEntry` objects:

```typescript
{
  id: "unique-id",
  title: "Title of the information",
  content: `Detailed content about your business, products, features, etc.
  
  You can include:
  - Product descriptions
  - Feature lists
  - Pricing information
  - Company history
  - Support procedures
  - FAQ answers
  - Any relevant business information`,
  category: "Category Name", // e.g., "Products", "Features", "Support"
  tags: ["tag1", "tag2"], // Optional: helps with search
}
```

### Step 2: Example Entries

Here are some examples you can add:

#### Product Information
```typescript
{
  id: "product-stablecoin",
  title: "Stablecoin Banking",
  content: `Our stablecoin banking platform allows users to:
- Deposit and withdraw stablecoins
- Earn interest on deposits
- Make instant transfers
- Convert between different stablecoins`,
  category: "Products",
  tags: ["stablecoin", "banking", "deposits"],
}
```

#### Pricing Information
```typescript
{
  id: "pricing-1",
  title: "Pricing Plans",
  content: `We offer three pricing tiers:
- Free: Basic features, limited transactions
- Pro: $9.99/month, unlimited transactions, priority support
- Enterprise: Custom pricing, dedicated support, API access`,
  category: "Pricing",
  tags: ["pricing", "plans", "subscription"],
}
```

#### Company Information
```typescript
{
  id: "company-history",
  title: "Our Story",
  content: `Founded in 2024, we're building the future of crypto banking.
Our mission is to make cryptocurrency accessible to everyone through
smart wallet technology and gasless transactions.`,
  category: "Company",
  tags: ["about", "history", "mission"],
}
```

## Best Practices

1. **Be Specific**: Include concrete details, numbers, and facts
2. **Keep It Updated**: Regularly update knowledge entries as your business evolves
3. **Use Categories**: Organize information by category for easier management
4. **Add Tags**: Tags help with better search results
5. **Clear Content**: Write clear, concise content that's easy for the AI to understand

## Categories to Consider

- **Company**: About us, mission, team
- **Products**: Product descriptions, features
- **Features**: Detailed feature explanations
- **Pricing**: Plans, costs, billing
- **Support**: Help articles, troubleshooting
- **Security**: Security features, best practices
- **FAQ**: Common questions and answers
- **Integrations**: Third-party integrations
- **Roadmap**: Upcoming features

## How Semantic Search Works

The system uses OpenAI embeddings to understand the **meaning** of questions, not just keywords. This means:

- "How much does it cost?" will find pricing information
- "Is my money safe?" will find security information
- "What can I do with the app?" will find features information

## Testing

After adding new knowledge entries:

1. Restart your development server
2. Ask the chatbot questions related to your new content
3. Verify the chatbot uses your business data in responses

## Advanced: Adding More Data Sources

For larger knowledge bases, you can:

1. **Load from Database**: Modify `getAllKnowledge()` to fetch from a database
2. **Load from Files**: Parse markdown or JSON files
3. **Use Vector Database**: For production, use Pinecone, Weaviate, or Supabase for better performance
4. **Add Document Upload**: Create an admin interface to upload documents

## Troubleshooting

**Chatbot not using business data?**
- Check that entries are in `BUSINESS_KNOWLEDGE` array
- Verify the content is relevant to the question
- Check console logs for embedding errors

**Responses are generic?**
- Add more specific business information
- Use clearer titles and content
- Add relevant tags

**Slow responses?**
- Embeddings are cached for 24 hours
- First request may be slower (generating embeddings)
- Consider using a vector database for production

## Next Steps

1. **Add Your Business Data**: Start by adding your company info, products, and features
2. **Test with Users**: Ask real questions your users might ask
3. **Iterate**: Update knowledge based on common questions
4. **Scale**: As you grow, consider moving to a database-backed solution

---

**Need Help?** Check the code comments in `lib/business-knowledge.ts` and `lib/embeddings.ts` for more details.
