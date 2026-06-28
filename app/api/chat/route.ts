import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyName = body?.companyName?.trim();
    const ragContext = body?.ragContext || "";
    const question = body?.question?.trim();
    const history = body?.history || []; // [{ role: 'user'|'model', content: '...' }]

    if (!companyName || !question) {
      return NextResponse.json({ error: "Missing companyName or question parameters." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set." }, { status: 500 });
    }

    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-3.1-flash-lite",
      temperature: 0.3,
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Compile message history and format prompt
    const chatHistoryText = history
      .map((msg: any) => `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`)
      .join("\n");

    const systemPrompt = `You are a helpful AI Investment Analyst conversing with a portfolio manager about ${companyName}.
Your advice must be grounded in the following real-time web research context compiled for ${companyName}. Do not make up facts or metrics that are not in the context. If you don't know something or it isn't mentioned in the context, explicitly say that the research data does not specify it.

RESEARCH CONTEXT:
${ragContext}

Previous Chat History:
${chatHistoryText || "No previous history."}

Current User Question:
${question}

Answer concisely, professionally, and ground all claims in the context. Refer to the sources/facts directly.`;

    const response = await llm.invoke(systemPrompt);
    const answer = response.content as string;

    return NextResponse.json({ answer });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[API Chat] Error:", msg);
    return NextResponse.json({ error: `Chat failed: ${msg}` }, { status: 500 });
  }
}
