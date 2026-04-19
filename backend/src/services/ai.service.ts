import Groq from "groq-sdk";
import { Env } from "../config/env.config";

const groq = new Groq({ apiKey: Env.GROQ_API_KEY });

export const getAIResponse = async (
  userMessage: string,
  conversationHistory: { role: string; content: string }[] = [],
) => {
  try {
    // Format messages with proper typing for Groq
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "You are a helpful AI assistant named Gauss AI. Keep responses concise and friendly.",
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: userMessage,
      },
    ];

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || "No response from AI.";
  } catch (error) {
    console.error("Groq Error:", error);
    return "Sorry, I'm having trouble responding right now.";
  }
};
