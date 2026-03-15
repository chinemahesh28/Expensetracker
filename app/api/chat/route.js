import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemInstruction = `
You are FinanceBudy, a specialized AI finance assistant.
Your primary role is to answer questions strictly related to personal finance, budgeting, investing, wealth management, and economics.

If a user asks a question that is NOT related to finance or the above topics:
1. Politely decline to answer.
2. Steer the conversation back to finance.
Example: "I'm sorry, I can only help with questions related to finance and money management. How can I assist you with your budget today?"

Always be professional, concise, and helpful.
`;

export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const formattedMessages = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedMessages,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error("Error in Chatbot API route:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
