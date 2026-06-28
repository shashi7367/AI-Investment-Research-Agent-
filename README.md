# AI Investment Research Agent

## Overview

An AI-powered investment research agent using Next.js, LangGraph, RAG (Retrieval-Augmented Generation), and Google Gemini. Enter any company name — the agent searches the web, builds a vector store, retrieves the most relevant context, analyzes financials, and delivers an **Invest or Pass** verdict with full reasoning.

**LLM Used: Google Gemini 1.5 Flash** (via `@langchain/google-genai`)

## How to run it

### Prerequisites
- Node.js 18+
- Gemini API key → [aistudio.google.com](https://aistudio.google.com/app/apikey) (**FREE**)
- Tavily Search API key → [tavily.com](https://tavily.com) (**FREE** — 1000/month)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create env file
cp .env.local.example .env.local

# 3. Add your API keys to .env.local:
# GEMINI_API_KEY=AIza...
# TAVILY_API_KEY=tvly-...

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How it works — Architecture

```
User Input
    ↓
[Node 1] Research Node — Tavily web search (4 queries)
    ↓
[Node 2] RAG Node — Gemini embeddings → MemoryVectorStore → similarity search
    ↓
[Node 3] Analysis Node — Gemini 1.5 Flash scores 4 factors (1–10)
    ↓
[Node 4] Decision Node — Gemini makes INVEST / PASS verdict
    ↓
Result Card (scores, reasoning, risks)
```

### RAG Implementation
The RAG (Retrieval-Augmented Generation) pipeline:
1. **Retrieve** — Tavily fetches 4 sets of web results
2. **Chunk** — `RecursiveCharacterTextSplitter` splits text into 600-char chunks
3. **Embed** — Gemini `embedding-001` converts chunks to vectors
4. **Store** — `MemoryVectorStore` (in-memory, no external DB needed)
5. **Retrieve** — Top-6 chunks retrieved via cosine similarity
6. **Augment** — Retrieved context injected into Gemini analysis prompt
7. **Generate** — Gemini generates structured JSON analysis

## Key decisions & trade-offs

| Decision | Why | Trade-off |
|---|---|---|
| **Gemini 1.5 Flash** | Fast, free tier, great JSON output | GPT-4o more capable but costs more |
| **Gemini Embeddings** | Free, consistent with same API key | OpenAI embeddings slightly better quality |
| **MemoryVectorStore** | No external DB setup needed | Resets each request — no persistence |
| **LangGraph 4-node pipeline** | Clean separation of concerns, easy to extend | More verbose than a single function |
| **Tavily for search** | Best results per query, simple API | SerpAPI has more sources |

**Left out:** Historical stock prices, PDF upload, multi-company comparison, Redis caching

## Example runs

### Apple
```
Verdict: INVEST ✅  |  Rating: 8/10  |  Confidence: 92%
Key reasons: Strong ecosystem lock-in, growing services revenue, $110B buybacks
Risks: App Store regulatory pressure, slowing iPhone upgrades
```

### Paytm
```
Verdict: PASS ❌  |  Rating: 4/10  |  Confidence: 81%
Key reasons: RBI action on Paytm Payments Bank, path to profitability unclear
Risks: Regulatory risk, intense competition from PhonePe and GPay
```

### Reliance Industries
```
Verdict: INVEST ✅  |  Rating: 7/10  |  Confidence: 76%
Key reasons: Jio diversification, strong retail growth, green energy bet
Risks: High capex burden, oil business cyclicality
```

## What I would improve with more time

1. **Streaming** — Show each node completing in real-time
2. **Persistent vector store** — Pinecone/Chroma so results are cached
3. **PDF upload** — Upload annual reports for deeper RAG analysis
4. **Multi-agent debate** — Bull vs Bear analyst agents, moderated by a third
5. **Stock price integration** — Yahoo Finance API for actual price data
6. **Portfolio comparison** — Analyze 5 companies side by side

## LLM chat transcript
See `LLM_TRANSCRIPT.md` for full build log with AI collaboration.
