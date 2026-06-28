import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";

// ── Types ──────────────────────────────────────────────────────────────────
export interface FinancialMetric {
  label: string;
  value: string;
  evaluation: "Excellent" | "Good" | "Fair" | "Poor";
  comment: string;
}

export interface ChecklistItem {
  criterion: string;
  passed: boolean;
  notes: string;
}

export interface CompetitorComparison {
  name: string;
  marketCap: string;
  peRatio: string;
  strength: string;
  weakness: string;
}

export interface BusinessSegment {
  segment: string;
  percentage: number;
}

export interface NewsArticle {
  title: string;
  date: string;
  source: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  impact: "High" | "Medium" | "Low";
  ai_summary: string;
}

export interface HistoricalPricePoint {
  date: string;
  price: number;
}

export interface QualityScores {
  growth_trajectory: number;
  competitive_moat: number;
  management_quality: number;
  financial_strength: number;
  risk_profile: number;
}

export interface FinancialHealth {
  overall: number;
  profitability: number;
  growth: number;
  liquidity: number;
  solvency: number;
  efficiency: number;
}

export interface InvestmentMemo {
  business_overview: string;
  investment_thesis: string;
  bull_case: string;
  bear_case: string;
}

export interface AnalysisResult {
  overview: {
    sector: string;
    industry: string;
    ceo: string;
    market_cap: string;
    business_model: string;
    ticker: string;
    exchange: string;
    founded: string;
    headquarters: string;
    employees: string;
    website: string;
    country: string;
  };
  metrics: {
    pe_ratio: FinancialMetric;
    revenue_growth: FinancialMetric;
    profit_margin: FinancialMetric;
    debt_to_equity: FinancialMetric;
    free_cash_flow: FinancialMetric;
    dividend_yield: FinancialMetric;
  };
  moat: {
    strength: "Wide" | "Narrow" | "None";
    sources: string[];
    details: string;
  };
  checklist: ChecklistItem[];
  competitors: CompetitorComparison[];
  growth_drivers: string[];
  red_flags: string[];
  scores: {
    revenue_growth: number;
    competitive_moat: number;
    management_quality: number;
    risk_level: number;
  };
  reasoning: string;
  overall_rating: number;
  current_price: string;
  fifty_two_week_range: { low: string; high: string };
  fifty_two_week_high: string;
  fifty_two_week_low: string;
  fair_value: string;
  business_model_segments: BusinessSegment[];
  recent_news: NewsArticle[];
  historical_prices: HistoricalPricePoint[];
  quality_scores: QualityScores;
  financial_health: FinancialHealth;
  investment_memo: InvestmentMemo;
}

export interface RiskItem {
  name: string;
  probability: "High" | "Medium" | "Low";
  impact: "High" | "Medium" | "Low";
  time_horizon: string;
  evidence: string;
  mitigation: string;
}

export interface DecisionResult {
  verdict: "INVEST" | "PASS";
  confidence: number;
  summary: string;
  key_reasons: string[];
  risks: RiskItem[];
}

export interface AgentExecutionStep {
  step: string;
  status: "completed" | "failed" | "pending";
  duration: number;
}

export interface DetailedReasoning {
  positiveSignals: string[];
  negativeSignals: string[];
  investmentThesis: string;
  conclusion: string;
}

export interface SupportingEvidence {
  claim: string;
  source: string;
  url: string;
  confidence: number;
}

export interface WebSearchSource {
  title: string;
  website: string;
  url: string;
  publishedDate: string;
  snippet: string;
  relevanceScore: number;
}

export interface NewsAnalysisItem {
  headline: string;
  publisher: string;
  date: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  impact: "High" | "Medium" | "Low";
  summary: string;
}

export interface CompanyProfile {
  logo: string;
  website: string;
  ceo: string;
  founded: string;
  headquarters: string;
  employees: string;
  sector: string;
  industry: string;
  exchange: string;
  ticker: string;
  marketCap: string;
  currentPrice: string;
  fiftyTwoWeekHigh: string;
  fiftyTwoWeekLow: string;
}

export interface ConfidenceBreakdown {
  financialStrength: number;
  growth: number;
  moat: number;
  management: number;
  valuation: number;
  risk: number;
  final: number;
}

export interface MatrixRiskItem {
  title: string;
  probability: "High" | "Medium" | "Low";
  impact: "High" | "Medium" | "Low";
  evidence: string;
  mitigation: string;
}

export interface OpportunityItem {
  title: string;
  impact: "High" | "Medium" | "Low";
  probability: "High" | "Medium" | "Low";
  reasoning: string;
}

export interface InvestmentMemoRich {
  overview: string;
  bullCase: string;
  bearCase: string;
  catalysts: string;
  valuation: string;
  recommendation: string;
}

export interface PeerComparisonItem {
  company: string;
  advantage: string;
  weakness: string;
  valuation: string;
  marketShare: string;
}

export interface ExplainableScore {
  score: number;
  explanation: string;
}

export interface QualityScoresRich {
  growth: ExplainableScore;
  moat: ExplainableScore;
}

export interface AgentThinkingStep {
  node: string;
  action: string;
  timestamp: string;
  durationMs: number;
  details: string;
}

export interface AgentThinkingTrace {
  searchQueries: string[];
  chunksCount: number;
  retrievedContextCount: number;
  steps: AgentThinkingStep[];
  analystPrompt?: string;
  decisionPrompt?: string;
}

// ── LangGraph State ────────────────────────────────────────────────────────
const AgentState = Annotation.Root({
  companyName: Annotation<string>(),
  researchData: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  ragContext: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => "" }),
  analysis: Annotation<AnalysisResult | null>({ reducer: (x, y) => y ?? x, default: () => null }),
  decision: Annotation<DecisionResult | null>({ reducer: (x, y) => y ?? x, default: () => null }),
  logs: Annotation<string[]>({ reducer: (x, y) => [...(x ?? []), ...(y ?? [])], default: () => [] }),
  error: Annotation<string | null>({ reducer: (x, y) => y ?? x, default: () => null }),
  agentThinking: Annotation<AgentThinkingTrace | null>({ reducer: (x, y) => y ?? x, default: () => null }),

  // 13 Rich Explainability Properties
  agentExecution: Annotation<AgentExecutionStep[]>({ reducer: (x, y) => [...(x ?? []), ...(y ?? [])], default: () => [] }),
  reasoning: Annotation<DetailedReasoning | null>({ reducer: (x, y) => y ?? x, default: () => null }),
  evidence: Annotation<SupportingEvidence[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  sources: Annotation<WebSearchSource[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  news: Annotation<NewsAnalysisItem[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  companyProfile: Annotation<CompanyProfile | null>({ reducer: (x, y) => y ?? x, default: () => null }),
  confidenceBreakdown: Annotation<ConfidenceBreakdown | null>({ reducer: (x, y) => y ?? x, default: () => null }),
  risks: Annotation<MatrixRiskItem[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  opportunities: Annotation<OpportunityItem[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  investmentMemo: Annotation<InvestmentMemoRich | null>({ reducer: (x, y) => y ?? x, default: () => null }),
  suggestedQuestions: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  peerComparison: Annotation<PeerComparisonItem[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  qualityScores: Annotation<QualityScoresRich | null>({ reducer: (x, y) => y ?? x, default: () => null }),
});

type State = typeof AgentState.State;

// ── Gemini LLM ─────────────────────────────────────────────────────────────
function getLLM() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set in .env.local");
  return new ChatGoogleGenerativeAI({
    model: "gemini-3.1-flash-lite",
    temperature: 0.2,
    apiKey: process.env.GEMINI_API_KEY,
  });
}

function getEmbeddings() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set in .env.local");
  return new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey: process.env.GEMINI_API_KEY,
  });
}

// ── NODE 1: Research (Web Search) ─────────────────────────────────────────
async function researchNode(state: State): Promise<Partial<State>> {
  if (state.error) return {};
  const logs: string[] = [...(state.logs || [])];
  logs.push("[Research] Starting web research via Tavily Search...");

  if (!process.env.TAVILY_API_KEY) {
    return { error: "TAVILY_API_KEY is not set in .env.local — get it free at https://tavily.com", logs };
  }

  const startTime = Date.now();
  const queries = [
    `${state.companyName} company financial results revenue 2024 2025`,
    `${state.companyName} stock analysis growth prospects future`,
    `${state.companyName} competitive advantage business model market share`,
    `${state.companyName} risks challenges regulatory news`,
  ];

  try {
    const search = new TavilySearchResults({
      maxResults: 5,
      apiKey: process.env.TAVILY_API_KEY,
    });

    const results: string[] = [];
    for (const query of queries) {
      try {
        logs.push(`[Research] Searching: "${query}"`);
        const result = await search.invoke(query);
        results.push(typeof result === "string" ? result : JSON.stringify(result));
        logs.push(`[Research] ✅ Got results for: "${query}"`);
      } catch (e) {
        logs.push(`[Research] ⚠️ Search failed for: "${query}" — ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (results.length === 0) {
      return { error: "All Tavily searches failed. Check TAVILY_API_KEY validity.", logs };
    }

    const durationMs = Date.now() - startTime;
    logs.push(`[Research] ✅ Completed. Got ${results.length} search result sets.`);

    const searchDur = parseFloat(((durationMs * 0.6) / 1000).toFixed(1));
    const collectDur = parseFloat(((durationMs * 0.4) / 1000).toFixed(1));

    const steps: AgentExecutionStep[] = [
      { step: "Searching Web", status: "completed", duration: searchDur },
      { step: "Collecting Financial Data", status: "completed", duration: collectDur }
    ];

    const thinking: AgentThinkingTrace = {
      searchQueries: queries,
      chunksCount: 0,
      retrievedContextCount: 0,
      steps: [
        {
          node: "research",
          action: "Tavily Web Search Execution",
          timestamp: new Date().toISOString(),
          durationMs,
          details: `Executed 4 financial and qualitative web queries. Received search response logs from Tavily Search indices.`
        }
      ]
    };

    return { researchData: results, agentExecution: steps, agentThinking: thinking, logs };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logs.push(`[Research] ERROR: ${msg}`);
    return { error: `Research node failed: ${msg}`, logs };
  }
}

// ── NODE 2: Context Compilation (RAG Node) ───────────────────────────────────
async function ragNode(state: State): Promise<Partial<State>> {
  if (state.error) return {};
  const logs: string[] = [...(state.logs || [])];
  logs.push("[Context] Running RAG pipeline (chunking -> embedding -> similarity search)...");

  const startTime = Date.now();
  try {
    const allText = state.researchData.join("\n\n---\n\n");
    if (!allText.trim()) {
      logs.push("[Context] No research data found. Skipping RAG.");
      return { ragContext: "", logs };
    }

    // Chunking
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 600,
      chunkOverlap: 100,
    });
    const docs = await splitter.createDocuments([allText]);
    logs.push(`[Context] Chunked search data into ${docs.length} documents.`);

    // Embeddings & Store
    const startEmbed = Date.now();
    const embeddings = getEmbeddings();
    const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    const embedDuration = parseFloat(((Date.now() - startEmbed) / 1000).toFixed(1));
    logs.push("[Context] Built in-memory vector store successfully.");

    // Similarity Search
    const startRetrieve = Date.now();
    const searchTarget = `${state.companyName} financials revenue business model growth risks`;
    const relevantDocs = await vectorStore.similaritySearch(searchTarget, 6);
    const retrieveDuration = parseFloat(((Date.now() - startRetrieve) / 1000).toFixed(1));
    logs.push(`[Context] Retrieved top-${relevantDocs.length} relevant documents.`);

    // Augment Context
    const ragContext = relevantDocs.map(d => d.pageContent).join("\n\n---\n\n");
    const durationMs = Date.now() - startTime;
    logs.push("[Context] Compiled RAG context successfully.");

    // Parse Sources
    const rawSources: WebSearchSource[] = [];
    state.researchData.forEach((str: string) => {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item.url && item.title) {
              let domain = "Web";
              try {
                domain = new URL(item.url).hostname.replace("www.", "");
              } catch {}
              rawSources.push({
                title: item.title,
                website: domain,
                url: item.url,
                publishedDate: item.publishedDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                snippet: item.content || item.snippet || "",
                relevanceScore: item.score || 0.85
              });
            }
          });
        }
      } catch {}
    });
    const uniqueSources = Array.from(new Map(rawSources.map(s => [s.url, s])).values()).slice(0, 8);

    const steps: AgentExecutionStep[] = [
      { step: "Embedding Documents", status: "completed", duration: embedDuration },
      { step: "Retrieving Context", status: "completed", duration: retrieveDuration }
    ];

    const currentThinking = state.agentThinking || { searchQueries: [], chunksCount: 0, retrievedContextCount: 0, steps: [] };
    const updatedThinking: AgentThinkingTrace = {
      ...currentThinking,
      chunksCount: docs.length,
      retrievedContextCount: relevantDocs.length,
      steps: [
        ...currentThinking.steps,
        {
          node: "rag",
          action: "Vector Store Indexing & Similarity Search",
          timestamp: new Date().toISOString(),
          durationMs,
          details: `Indexed ${docs.length} character chunks using gemini-embedding-001. Queried top-6 similarity snippets for context grounding.`
        }
      ]
    };

    return { 
      ragContext, 
      agentExecution: steps, 
      sources: uniqueSources, 
      agentThinking: updatedThinking, 
      logs 
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logs.push(`[Context] ERROR in RAG node: ${msg}`);
    logs.push("[Context] Falling back to raw text compilation...");
    const rawContext = state.researchData.join("\n\n---\n\n").substring(0, 10000);
    return { ragContext: rawContext, logs };
  }
}

// ── NODE 3: Analysis (Gemini LLM) ─────────────────────────────────────────
async function analysisNode(state: State): Promise<Partial<State>> {
  if (state.error) return {};
  const logs: string[] = [...(state.logs || [])];
  logs.push("[Analysis] Analyzing company using Gemini's pre-trained internal knowledge...");

  const startTime = Date.now();

  const prompt = `You are a senior equity analyst at a top investment firm.

Company being analyzed: ${state.companyName}

Analyze this company as an investment using the real-time research context provided below, in addition to your general pre-trained knowledge base. Compile all relevant quantitative metrics, news, peers, profiles, and qualitative indicators.

RESEARCH CONTEXT (REAL-TIME WEB DATA):
${state.ragContext || "No real-time web data available. Rely on internal knowledge."}

Return ONLY valid JSON — no markdown (no \`\`\`json blocks), no extra text:
{
  "overview": {
    "sector": "<sector>",
    "industry": "<industry>",
    "ceo": "<ceo_name>",
    "market_cap": "<market_cap, e.g. $3.1T or ₹2.11T>",
    "business_model": "<1-2 sentence description of how the company makes money>",
    "ticker": "<stock ticker symbol, e.g. AAPL>",
    "exchange": "<exchange name, e.g. NASDAQ>",
    "founded": "<year founded, e.g. 1976>",
    "headquarters": "<city and state/country, e.g. Cupertino, CA>",
    "employees": "<number of employees or estimate, e.g. 164,000>",
    "website": "<official website, e.g. apple.com>",
    "country": "<headquarters country, e.g. United States>"
  },
  "metrics": {
    "pe_ratio": {
      "label": "P/E Ratio",
      "value": "<pe_ratio or N/A>",
      "evaluation": "<Excellent | Good | Fair | Poor>",
      "comment": "<short analyst context on valuation, e.g., 'trading at premium' or 'undervalued relative to peers'>"
    },
    "revenue_growth": {
      "label": "Revenue Growth YoY",
      "value": "<growth rate, e.g. +12% or -3%>",
      "evaluation": "<Excellent | Good | Fair | Poor>",
      "comment": "<short comment on top-line expansion trajectory>"
    },
    "profit_margin": {
      "label": "Net Profit Margin",
      "value": "<margin, e.g. 24% or -5%>",
      "evaluation": "<Excellent | Good | Fair | Poor>",
      "comment": "<comment on efficiency/profitability>"
    },
    "debt_to_equity": {
      "label": "Debt-to-Equity",
      "value": "<ratio, e.g. 0.35 or N/A>",
      "evaluation": "<Excellent | Good | Fair | Poor>",
      "comment": "<comment on leverage and balance sheet safety>"
    },
    "free_cash_flow": {
      "label": "Free Cash Flow",
      "value": "<fcf amount, e.g. $12.4B or Negative>",
      "evaluation": "<Excellent | Good | Fair | Poor>",
      "comment": "<comment on cash generation ability>"
    },
    "dividend_yield": {
      "label": "Dividend Yield",
      "value": "<yield, e.g. 1.2% or N/A>",
      "evaluation": "<Excellent | Good | Fair | Poor>",
      "comment": "<comment on capital return policy>"
    }
  },
  "moat": {
    "strength": "<Wide | Narrow | None>",
    "sources": ["<source1, e.g. Network Effects>", "<source2, e.g. Switching Costs>"],
    "details": "<1-2 sentences on source and sustainability of the company's competitive advantage>"
  },
  "checklist": [
    {
      "criterion": "Strong & Expanding Revenue Growth",
      "passed": true,
      "notes": "<short explanation>"
    },
    {
      "criterion": "High Profitability / Double-Digit Net Margin",
      "passed": true,
      "notes": "<short explanation>"
    },
    {
      "criterion": "Healthy Balance Sheet / Low Debt Leverage",
      "passed": true,
      "notes": "<short explanation>"
    },
    {
      "criterion": "Sustainable Competitive Moat",
      "passed": true,
      "notes": "<short explanation>"
    },
    {
      "criterion": "Robust Free Cash Flow Generation",
      "passed": true,
      "notes": "<short explanation>"
    }
  ],
  "competitors": [
    {
      "name": "<competitor 1>",
      "marketCap": "<market_cap>",
      "peRatio": "<pe_ratio>",
      "strength": "<competitor's main advantage>",
      "weakness": "<competitor's main weakness/vulnerability>"
    },
    {
      "name": "<competitor 2>",
      "marketCap": "<market_cap>",
      "peRatio": "<pe_ratio>",
      "strength": "<competitor's main advantage>",
      "weakness": "<competitor's main weakness/vulnerability>"
    }
  ],
  "growth_drivers": ["<driver1>", "<driver2>", "<driver3>"],
  "red_flags": ["<flag1>", "<flag2>", "<flag3>"],
  "scores": {
    "revenue_growth": 5,
    "competitive_moat": 5,
    "management_quality": 5,
    "risk_level": 5
  },
  "reasoning": "<2-3 sentence overall analyst view summary>",
  "overall_rating": 5,
  "current_price": "<current_price, e.g. $195.89 or ₹242.85>",
  "fifty_two_week_range": {
    "low": "<low_value, e.g. $160.20 or ₹76.80>",
    "high": "<high_value, e.g. $220.50 or ₹259.80>"
  },
  "fifty_two_week_high": "<high_value, e.g. $220.50>",
  "fifty_two_week_low": "<low_value, e.g. $160.20>",
  "fair_value": "<fair_value, e.g. $220.00 or ₹325.00>",
  "business_model_segments": [
    { "segment": "<segment_name_1>", "percentage": 55 },
    { "segment": "<segment_name_2>", "percentage": 28 },
    { "segment": "<segment_name_3>", "percentage": 17 }
  ],
  "recent_news": [
    { 
      "title": "<news_title_1>", 
      "date": "<news_date_1, e.g. May 24, 2024>", 
      "source": "<source_name_1>",
      "sentiment": "<Positive | Neutral | Negative>",
      "impact": "<High | Medium | Low>",
      "ai_summary": "<one sentence concise AI summary of the article's contents and importance>"
    },
    { 
      "title": "<news_title_2>", 
      "date": "<news_date_2>", 
      "source": "<source_name_2>",
      "sentiment": "<Positive | Neutral | Negative>",
      "impact": "<High | Medium | Low>",
      "ai_summary": "<one sentence concise AI summary>"
    },
    { 
      "title": "<news_title_3>", 
      "date": "<news_date_3>", 
      "source": "<source_name_3>",
      "sentiment": "<Positive | Neutral | Negative>",
      "impact": "<High | Medium | Low>",
      "ai_summary": "<one sentence concise AI summary>"
    }
  ],
  "historical_prices": [
    { "date": "Dec '23", "price": 160 },
    { "date": "Jan '24", "price": 175 },
    { "date": "Feb '24", "price": 168 },
    { "date": "Mar '24", "price": 182 },
    { "date": "Apr '24", "price": 188 },
    { "date": "May '24", "price": 195 }
  ],
  "quality_scores": {
    "growth_trajectory": 8.7,
    "competitive_moat": 7.5,
    "management_quality": 8.0,
    "financial_strength": 7.8,
    "risk_profile": 6.5
  },
  "financial_health": {
    "overall": 8.2,
    "profitability": 8.5,
    "growth": 9.0,
    "liquidity": 7.8,
    "solvency": 7.6,
    "efficiency": 8.1
  },
  "investment_memo": {
    "business_overview": "<2-3 sentences explaining the core business operations and products>",
    "investment_thesis": "<2-3 sentences explaining why a long-term position is/isn't recommended>",
    "bull_case": "<2 sentences outlining the best-case positive growth scenario>",
    "bear_case": "<2 sentences outlining the worst-case negative risk scenario>"
  },
  "evidence": [
    {
      "claim": "<specific numeric/qualitative claim, e.g. Revenue increased 48% YoY>",
      "source": "<evidence source, e.g. Q4 Earnings Release or Annual Report>",
      "url": "<relevant web reference url from context, or placeholder if internal knowledge>",
      "confidence": 0.95
    }
  ],
  "news": [
    {
      "headline": "<headline_1>",
      "publisher": "<source/publisher name>",
      "date": "<date>",
      "sentiment": "<Positive | Neutral | Negative>",
      "impact": "<High | Medium | Low>",
      "summary": "<one sentence news summary>"
    }
  ],
  "companyProfile": {
    "logo": "",
    "website": "<website, e.g. apple.com>",
    "ceo": "<ceo>",
    "founded": "<founded>",
    "headquarters": "<headquarters>",
    "employees": "<employees>",
    "sector": "<sector>",
    "industry": "<industry>",
    "exchange": "<exchange>",
    "ticker": "<ticker>",
    "marketCap": "<market_cap>",
    "currentPrice": "<current_price>",
    "fiftyTwoWeekHigh": "<high>",
    "fiftyTwoWeekLow": "<low>"
  },
  "peerComparison": [
    {
      "company": "<peer company 1>",
      "advantage": "<competitor advantage>",
      "weakness": "<competitor weakness>",
      "valuation": "<relative valuation metric evaluation>",
      "marketShare": "<market share value>"
    }
  ],
  "qualityScores": {
    "growth": {
      "score": 8.2,
      "explanation": "<explain growth trajectory score context>"
    },
    "moat": {
      "score": 7.5,
      "explanation": "<explain competitive moat score context>"
    }
  }
}`;

  try {
    const llm = getLLM();
    const response = await llm.invoke(prompt);
    const content = response.content as string;
    logs.push(`[Analysis] Gemini responded (${content.length} chars)`);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON in response. Got: ${content.substring(0, 300)}`);

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Set official Clearbit logos
    if (analysis.companyProfile && analysis.overview && analysis.overview.website) {
      analysis.companyProfile.logo = `https://logo.clearbit.com/${analysis.overview.website}`;
    }

    const durationMs = Date.now() - startTime;
    const durationSec = parseFloat((durationMs / 1000).toFixed(1));

    const steps: AgentExecutionStep[] = [
      { step: "Gemini Analysis", status: "completed", duration: durationSec }
    ];

    const currentThinking = state.agentThinking || { searchQueries: [], chunksCount: 0, retrievedContextCount: 0, steps: [] };
    const updatedThinking: AgentThinkingTrace = {
      ...currentThinking,
      analystPrompt: prompt,
      steps: [
        ...currentThinking.steps,
        {
          node: "analyze",
          action: "Gemini Analysis & Scoring Model",
          timestamp: new Date().toISOString(),
          durationMs,
          details: `Processed RAG context through gemini-3.1-flash-lite. Compiled sector overviews, 6 financial metrics, moat factors, news sentiments, and qualitative summaries.`
        }
      ]
    };

    logs.push(`[Analysis] ✅ Parsed scores — overall: ${analysis.overall_rating}/10`);
    
    return { 
      analysis, 
      agentExecution: steps,
      evidence: analysis.evidence || [],
      news: analysis.news || [],
      companyProfile: analysis.companyProfile || null,
      peerComparison: analysis.peerComparison || [],
      qualityScores: analysis.qualityScores || null,
      agentThinking: updatedThinking, 
      logs 
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logs.push(`[Analysis] ERROR: ${msg}`);
    return { error: `Gemini analysis failed: ${msg}`, logs };
  }
}

// ── NODE 4: Decision ───────────────────────────────────────────────────────
async function decisionNode(state: State): Promise<Partial<State>> {
  if (state.error) return {};
  const logs: string[] = [];
  logs.push("[Decision] Making final INVEST / PASS verdict...");

  const startTime = Date.now();

  if (!state.analysis) return { error: "No analysis available", logs };

  const { scores, reasoning, red_flags, overall_rating, overview, metrics, moat, checklist } = state.analysis;

  const prompt = `You are a portfolio manager making the final investment decision.

Company: ${state.companyName} (${overview.sector} | ${overview.industry})
CEO: ${overview.ceo} | Market Cap: ${overview.market_cap}

Key Financial Metrics:
- P/E Ratio: ${metrics.pe_ratio.value} (${metrics.pe_ratio.evaluation} - ${metrics.pe_ratio.comment})
- Revenue Growth YoY: ${metrics.revenue_growth.value} (${metrics.revenue_growth.evaluation} - ${metrics.revenue_growth.comment})
- Profit Margin: ${metrics.profit_margin.value} (${metrics.profit_margin.evaluation} - ${metrics.profit_margin.comment})
- Debt-to-Equity: ${metrics.debt_to_equity.value} (${metrics.debt_to_equity.evaluation} - ${metrics.debt_to_equity.comment})
- Free Cash Flow: ${metrics.free_cash_flow.value} (${metrics.free_cash_flow.evaluation} - ${metrics.free_cash_flow.comment})

Moat Assessment: Strength: ${moat.strength}. Sources: ${moat.sources.join(", ")}.
Details: ${moat.details}

Checklist Performance:
${checklist.map(c => `- ${c.criterion}: ${c.passed ? "PASSED" : "FAILED"} (${c.notes})`).join("\n")}

Analyst Scores (out of 10):
- Revenue Growth: ${scores.revenue_growth}
- Competitive Moat: ${scores.competitive_moat}
- Management Quality: ${scores.management_quality}
- Risk Level (where 10=lowest risk): ${scores.risk_level}
- Overall Rating: ${overall_rating}

Analyst View: ${reasoning}
Red Flags: ${red_flags.join(", ")}

Decide: INVEST or PASS.

Return ONLY valid JSON (no markdown, no other text):
{
  "verdict": "INVEST" or "PASS",
  "confidence": <50-99>,
  "summary": "<one clear sentence summary of the verdict>",
  "key_reasons": ["<reason1>", "<reason2>", "<reason3>"],
  "risks": [
    {
      "title": "<risk_name_e.g. Regulatory Compliance Scrutiny>",
      "probability": "<High | Medium | Low>",
      "impact": "<High | Medium | Low>",
      "evidence": "<factual context why this exists>",
      "mitigation": "<actionable mitigation plan>"
    }
  ],
  "reasoning": {
    "positiveSignals": ["<signal 1>", "<signal 2>"],
    "negativeSignals": ["<signal 1>", "<signal 2>"],
    "investmentThesis": "<comprehensive 2-3 sentence investment thesis>",
    "conclusion": "<1-2 sentence overall conclusion>"
  },
  "confidenceBreakdown": {
    "financialStrength": 22,
    "growth": 18,
    "moat": 16,
    "management": 12,
    "valuation": -6,
    "risk": -10,
    "final": 82
  },
  "opportunities": [
    {
      "title": "<opportunity title, e.g. Expansion to APAC Markets>",
      "impact": "<High | Medium | Low>",
      "probability": "<High | Medium | Low>",
      "reasoning": "<analysis of this driver>"
    }
  ],
  "investmentMemo": {
    "overview": "<overview of business model>",
    "bullCase": "<bull growth drivers>",
    "bearCase": "<bear threat drivers>",
    "catalysts": "<upcoming short-term triggers>",
    "valuation": "<valuation premium or discount context>",
    "recommendation": "<portfolio allocation action summary>"
  },
  "suggestedQuestions": [
    "Why should I invest?",
    "What are the risks?",
    "Compare with industry peers",
    "Summarize in simple language"
  ]
}`;

  try {
    const llm = getLLM();
    const response = await llm.invoke(prompt);
    const content = response.content as string;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in decision response");

    const decisionObj = JSON.parse(jsonMatch[0]);

    // Backward compatibility mapping
    const risksMap = (decisionObj.risks || []).map((r: any) => ({
      name: r.title || "Key Risk Factor",
      probability: r.probability || "Medium",
      impact: r.impact || "Medium",
      time_horizon: "Ongoing",
      evidence: r.evidence || "",
      mitigation: r.mitigation || ""
    }));

    const decision: DecisionResult = {
      verdict: decisionObj.verdict || "PASS",
      confidence: decisionObj.confidence || 75,
      summary: decisionObj.summary || "",
      key_reasons: decisionObj.key_reasons || [],
      risks: risksMap
    };

    const durationMs = Date.now() - startTime;
    const durationSec = parseFloat((durationMs / 1000).toFixed(1));

    const steps: AgentExecutionStep[] = [
      { step: "Investment Decision", status: "completed", duration: durationSec }
    ];

    const currentThinking = state.agentThinking || { searchQueries: [], chunksCount: 0, retrievedContextCount: 0, steps: [] };
    const updatedThinking: AgentThinkingTrace = {
      ...currentThinking,
      decisionPrompt: prompt,
      steps: [
        ...currentThinking.steps,
        {
          node: "decide",
          action: "Gemini Portfolio Decision Maker",
          timestamp: new Date().toISOString(),
          durationMs,
          details: `Processed analyst parameters through gemini-3.1-flash-lite. Synthesized final investment verdict (${decision.verdict}) and confidence score.`
        }
      ]
    };

    logs.push(`[Decision] ✅ Verdict: ${decision.verdict} (${decision.confidence}% confidence)`);

    return { 
      decision, 
      agentExecution: steps,
      reasoning: decisionObj.reasoning || null,
      confidenceBreakdown: decisionObj.confidenceBreakdown || null,
      risks: decisionObj.risks || [],
      opportunities: decisionObj.opportunities || [],
      investmentMemo: decisionObj.investmentMemo || null,
      suggestedQuestions: decisionObj.suggestedQuestions || [],
      agentThinking: updatedThinking, 
      logs 
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logs.push(`[Decision] ERROR: ${msg}`);
    return { error: `Decision failed: ${msg}`, logs };
  }
}

// ── Build & Run Graph ──────────────────────────────────────────────────────
export async function runInvestmentAgent(companyName: string) {
  const graph = new StateGraph(AgentState)
    .addNode("research", researchNode)
    .addNode("rag", ragNode)
    .addNode("analyze", analysisNode)
    .addNode("decide", decisionNode)
    .addEdge("__start__", "research")
    .addEdge("research", "rag")
    .addEdge("rag", "analyze")
    .addEdge("analyze", "decide")
    .addEdge("decide", "__end__");

  const app = graph.compile();

  const result = await app.invoke({ companyName });
  return result;
}
