import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAllKnowledge } from "@/lib/business-knowledge";
import { findRelevantKnowledge } from "@/lib/embeddings";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const BASE_SYSTEM_PROMPT = `You are an AI assistant for a crypto stablecoin banking app that uses smart wallets.
Your role is to help users understand:
- Smart wallet features and functionality
- Wallet connections (web2 social login and web3 external wallets)
- Transaction processes and gas sponsorship
- Security best practices
- App usage and navigation

IMPORTANT RULES:
- Do NOT provide financial or investment advice
- Do NOT provide trading recommendations
- Do NOT speculate on cryptocurrency prices
- If asked about financial decisions, redirect to: "Please contact support for financial guidance"
- Be helpful, clear, and concise
- If you're unsure about something, say: "Please contact support for assistance with this question."
- Keep responses under 200 words when possible
- Use the provided business knowledge context to answer questions accurately
- If the context doesn't contain relevant information, say so and suggest contacting support`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get the latest user message for context retrieval
    const userMessages = messages.filter((msg: any) => msg.role === "user");
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || "";

    // Retrieve relevant business knowledge using RAG
    let knowledgeContext = "";
    try {
      const allKnowledge = getAllKnowledge();
      const relevantKnowledge = await findRelevantKnowledge(
        latestUserMessage,
        allKnowledge,
        3 // Get top 3 most relevant entries
      );

      if (relevantKnowledge.length > 0) {
        knowledgeContext = `\n\nBUSINESS KNOWLEDGE CONTEXT (use this to answer questions accurately):\n${relevantKnowledge
          .map(
            (entry) => `[${entry.category}] ${entry.title}:\n${entry.content}\n`
          )
          .join("\n---\n")}`;
      }
    } catch (error) {
      console.error("Error retrieving knowledge context:", error);
      // Continue without context if RAG fails
    }

    // Build enhanced system prompt with business context
    const enhancedSystemPrompt = BASE_SYSTEM_PROMPT + knowledgeContext;

    // Prepare messages with enhanced system prompt
    const chatMessages = [
      { role: "system" as const, content: enhancedSystemPrompt },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: response });
  } catch (error: any) {
    console.error("Chat API error:", error);
    
    // Handle specific OpenAI API errors
    if (error.status === 429) {
      return NextResponse.json(
        {
          error: "quota_exceeded",
          message: "You've exceeded your OpenAI API quota. Please check your OpenAI account billing and add payment method if needed.",
        },
        { status: 429 }
      );
    }
    
    if (error.status === 401) {
      return NextResponse.json(
        {
          error: "invalid_api_key",
          message: "Invalid OpenAI API key. Please check your environment variables.",
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: error.message || "Failed to process chat request",
      },
      { status: error.status || 500 }
    );
  }
}
