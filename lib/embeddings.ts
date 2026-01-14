/**
 * Embeddings and Semantic Search
 * 
 * This module handles creating embeddings for business knowledge
 * and performing semantic search to find relevant information.
 */

import OpenAI from "openai";
import { KnowledgeEntry } from "./business-knowledge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmbeddingCache {
  [key: string]: {
    embedding: number[];
    timestamp: number;
  };
}

// In-memory cache for embeddings (in production, use a database)
let embeddingCache: EmbeddingCache = {};

// Cache duration: 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Generate embedding for a text using OpenAI
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small", // Cost-effective embedding model
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
};

/**
 * Get embedding with caching
 */
export const getEmbedding = async (text: string): Promise<number[]> => {
  const cacheKey = text.substring(0, 100); // Use first 100 chars as key
  
  // Check cache
  if (embeddingCache[cacheKey]) {
    const cached = embeddingCache[cacheKey];
    const now = Date.now();
    
    // Return cached if still valid
    if (now - cached.timestamp < CACHE_DURATION) {
      return cached.embedding;
    }
  }

  // Generate new embedding
  const embedding = await generateEmbedding(text);
  
  // Cache it
  embeddingCache[cacheKey] = {
    embedding,
    timestamp: Date.now(),
  };

  return embedding;
};

/**
 * Calculate cosine similarity between two vectors
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Find most relevant knowledge entries using semantic search
 */
export const findRelevantKnowledge = async (
  query: string,
  knowledgeEntries: KnowledgeEntry[],
  topK: number = 3
): Promise<KnowledgeEntry[]> => {
  try {
    // Generate embedding for the query
    const queryEmbedding = await getEmbedding(query);

    // Calculate similarity for each knowledge entry
    const similarities = await Promise.all(
      knowledgeEntries.map(async (entry) => {
        const entryText = `${entry.title}\n${entry.content}`;
        const entryEmbedding = await getEmbedding(entryText);
        const similarity = cosineSimilarity(queryEmbedding, entryEmbedding);

        return {
          entry,
          similarity,
        };
      })
    );

    // Sort by similarity (highest first) and return top K
    const sorted = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .filter((item) => item.similarity > 0.5) // Only return if similarity > 0.5
      .map((item) => item.entry);

    return sorted;
  } catch (error) {
    console.error("Error in semantic search:", error);
    // Fallback to simple text search if embeddings fail
    return knowledgeEntries.slice(0, topK);
  }
};

/**
 * Clear embedding cache (useful for testing or forced refresh)
 */
export const clearEmbeddingCache = (): void => {
  embeddingCache = {};
};
