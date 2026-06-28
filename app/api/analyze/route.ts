import { NextRequest, NextResponse } from "next/server";
import { runInvestmentAgent } from "@/lib/agent";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyName = body?.companyName?.trim();

    if (!companyName || companyName.length < 2) {
      return NextResponse.json({ error: "Please enter a valid company name." }, { status: 400 });
    }

    // Check env keys early
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not set in .env.local" }, { status: 500 });
    }
    if (!process.env.TAVILY_API_KEY) {
      return NextResponse.json({ error: "TAVILY_API_KEY not set in .env.local" }, { status: 500 });
    }

    const result = await runInvestmentAgent(companyName);

    if (result.error) {
      console.error("[API Route] Agent error:", result.error);
      console.log("[API Route] Agent logs:", result.logs);
      return NextResponse.json({ error: result.error, logs: result.logs }, { status: 500 });
    }

    return NextResponse.json({
      // Existing dashboard compatible fields
      companyName: result.companyName,
      analysis: result.analysis,
      decision: result.decision,
      logs: result.logs,
      researchData: result.researchData,
      agentThinking: result.agentThinking,

      // 13 Rich Explainable AI fields
      agentExecution: result.agentExecution,
      reasoning: result.reasoning,
      evidence: result.evidence,
      sources: result.sources,
      news: result.news,
      companyProfile: result.companyProfile,
      confidenceBreakdown: result.confidenceBreakdown,
      risks: result.risks,
      opportunities: result.opportunities,
      investmentMemo: result.investmentMemo,
      suggestedQuestions: result.suggestedQuestions,
      peerComparison: result.peerComparison,
      qualityScores: result.qualityScores,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[API Route] Unhandled error:", msg);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
