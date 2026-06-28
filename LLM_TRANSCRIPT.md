# LLM Chat Transcript — Build Log

This file documents the AI-assisted development process for this project.

---

## Session 1 — Architecture Planning

**Me:** I have an assignment to build an AI Investment Research Agent using Next.js, LangGraph.js, and any LLM. Where do I start?

**Claude:** Let's break this into 3 LangGraph nodes: Research (web search) → Analysis (LLM scoring) → Decision (Invest/Pass verdict). Here's the architecture...

[Full architecture diagram discussed — 3-node StateGraph with Tavily for search and GPT-4o-mini for reasoning]

---

## Session 2 — Agent Design

**Me:** What should the Analysis node actually do?

**Claude:** The Analysis node is the brain. It takes raw research text and:
1. Parses it for financial signals
2. Scores 4 factors: revenue growth, competitive moat, management quality, risk level
3. Returns structured JSON with scores + reasoning

The key insight is using a strict JSON output format so it's parseable...

[Prompt engineering discussion — settled on regex fallback for JSON parsing]

---

## Session 3 — LangGraph State

**Me:** How do I set up LangGraph StateGraph in TypeScript?

**Claude:** Use `StateGraph` with typed channels. Each channel needs a `value` reducer function. The tricky part is the `default` factory...

[Code walkthrough for StateGraph setup with TypeScript generics]

---

## Session 4 — Frontend Design

**Me:** What should the UI look like?

**Claude:** Dark background (#020617), green accent for INVEST, red for PASS. Score bars with color coding. Two-column layout for reasons vs risks. The key UX moment is the loading state — show step-by-step progress so users know what's happening...

[Design decisions: dark theme, score visualization, animated loading steps]

---

## Session 5 — Debugging

**Me:** The JSON parsing is failing sometimes. How do I handle this?

**Claude:** Use a regex fallback: `content.match(/\{[\s\S]*\}/)` to extract the JSON block even if the LLM adds extra text before/after. Wrap in try-catch and return a graceful error state...

[Error handling patterns discussed]

---

## Key insights from AI collaboration

1. **Prompt structure matters more than model choice** — a well-structured prompt to GPT-4o-mini beats a vague prompt to GPT-4o
2. **JSON output is fragile** — always use regex extraction + try-catch, never assume clean JSON
3. **LangGraph state is verbose but explicit** — the channel reducer pattern feels awkward at first but makes data flow very clear
4. **Tavily is the easiest search API** — one call, clean results, free tier is sufficient for a demo
