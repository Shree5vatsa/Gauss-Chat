"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIResponse = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const env_config_1 = require("../config/env.config");
const groq = new groq_sdk_1.default({ apiKey: env_config_1.Env.GROQ_API_KEY });
const getAIResponse = async (userMessage, conversationHistory = []) => {
    try {
        // Format messages with proper typing for Groq
        const messages = [
            {
                role: "system",
                content: "You are a helpful AI assistant named Gauss AI. Keep responses concise and friendly.",
            },
            ...conversationHistory.map((msg) => ({
                role: msg.role,
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
    }
    catch (error) {
        console.error("Groq Error:", error);
        return "Sorry, I'm having trouble responding right now.";
    }
};
exports.getAIResponse = getAIResponse;
