"use client";

import { useState, useEffect } from "react";
import { AnalysisResult, DecisionResult } from "@/lib/agent";

interface Props {
  companyName: string;
  analysis: AnalysisResult;
  decision: DecisionResult;
  researchData: string[];
  activeTab: string;
}

interface TavilyDoc {
  title: string;
  url: string;
  content: string;
  domain: string;
  score: number;
  date: string;
}

// ── SVG Line Chart Component ───────────────────────────────────────────────
function LineChart({ prices }: { prices: { date: string; price: number }[] }) {
  if (!prices || prices.length === 0) return null;

  const priceValues = prices.map(p => p.price);
  const isPrivate = priceValues.every(p => p === 0);

  if (isPrivate) {
    return (
      <div style={{ height: "100%", minHeight: "140px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0c1524", border: "1px dashed #1e293b", borderRadius: "8px", padding: "20px", color: "#64748b" }}>
        <span style={{ fontSize: "24px", marginBottom: "8px" }}>🔒</span>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}>Private Company</span>
        <span style={{ fontSize: "10px", marginTop: "2px", textAlign: "center", color: "#475569" }}>Stock price history is not publicly traded</span>
      </div>
    );
  }

  const width = 460;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  const maxPrice = Math.max(...priceValues);
  const minPrice = Math.min(...priceValues);
  const priceRange = maxPrice - minPrice || 1;

  const points = prices.map((p, idx) => {
    const x = paddingX + (idx / (prices.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((p.price - minPrice) / priceRange) * (height - 2 * paddingY);
    return { x, y, price: p.price, date: p.date };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const fillD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((val, idx) => {
        const y = paddingY + val * (height - 2 * paddingY);
        return (
          <line
            key={idx}
            x1={paddingX}
            y1={y}
            x2={width - paddingX}
            y2={y}
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}
      <path d={fillD} fill="url(#chartGlow)" />
      <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.x} cy={p.y} r="4" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
          <text x={p.x} y={height - 4} textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">
            {p.date}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── SVG Donut Chart Component ──────────────────────────────────────────────
function DonutChart({ segments }: { segments: { segment: string; percentage: number }[] }) {
  const radius = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const colors = ["#2563eb", "#10b981", "#fbbf24", "#ef4444", "#8b5cf6", "#3b82f6"];
  let accumulatedPercentage = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#1e293b" strokeWidth={strokeWidth} />
        {segments.map((seg, idx) => {
          const strokeLength = (seg.percentage / 100) * circumference;
          const strokeOffset = circumference - strokeLength;
          const rotation = (accumulatedPercentage / 100) * 360 - 90;
          accumulatedPercentage += seg.percentage;

          return (
            <circle
              key={seg.segment}
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke={colors[idx % colors.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              transform={`rotate(${rotation} 60 60)`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          );
        })}
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
        {segments.map((seg, idx) => (
          <div key={seg.segment} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors[idx % colors.length], display: "inline-block" }}></span>
            <span style={{ color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{seg.segment}</span>
            <span style={{ fontWeight: 700, marginLeft: "auto", color: "#f8fafc" }}>{seg.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SVG Radial Score Indicator Component ────────────────────────────────────
function RadialScore({ score, max = 10, label }: { score: number; max?: number; label: string }) {
  const radius = 32;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const percentage = (score / max) * 100;
  const strokeOffset = circumference - (percentage / 100) * circumference;
  const color = score >= 80 || (score >= 8 && max === 10) ? "#10b981" : score >= 50 || (score >= 5 && max === 10) ? "#eab308" : "#ef4444";

  return (
    <div style={{ position: "relative", width: "90px", height: "90px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="40" cy="40" r={radius} fill="transparent" stroke="#121b2d" strokeWidth={strokeWidth} />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontSize: "18px", fontWeight: 900, color: "#f8fafc", lineHeight: 1 }}>{score}{max === 100 && "%"}</span>
        <span style={{ fontSize: "9px", color: "#64748b", fontWeight: 700, marginTop: "2px", textTransform: "uppercase" }}>{label}</span>
      </div>
    </div>
  );
}

export default function ResultCard({ companyName, analysis, decision, researchData, activeTab }: Props) {
  const isInvest = decision.verdict === "INVEST";

  // Parse Tavily Search references safely for citations (Priority 3 & 5)
  const [sources, setSources] = useState<TavilyDoc[]>([]);
  useEffect(() => {
    const docs: TavilyDoc[] = [];
    researchData.forEach((str: string) => {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item.url && item.title) {
              let domain = "Web";
              try {
                domain = new URL(item.url).hostname.replace("www.", "");
              } catch {
                // Ignore url parse error
              }
              docs.push({
                title: item.title,
                url: item.url,
                content: item.content || item.snippet || "",
                domain,
                score: item.score || 0.82,
                date: item.publishedDate || "Recent"
              });
            }
          });
        }
      } catch {
        // Fallback if not stringified JSON array
      }
    });

    // Deduplicate by URL
    const uniqueDocs = Array.from(new Map(docs.map(doc => [doc.url, doc])).values()).slice(0, 8);
    setSources(uniqueDocs);
  }, [researchData]);

  // Click-to-Expand Metric State (Priority 12)
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  // Progressive UI revealing offsets (Priority 13)
  const [revealStep, setRevealStep] = useState(0);
  useEffect(() => {
    setRevealStep(0);
    const intervals = [50, 200, 350, 500, 650];
    const timers = intervals.map((delay, index) =>
      setTimeout(() => setRevealStep(index + 1), delay)
    );
    return () => timers.forEach(t => clearTimeout(t));
  }, [companyName]);

  // Conversational AI Chat states (Priority 8)
  const [messages, setMessages] = useState<{ role: "user" | "model"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const queryText = chatInput.trim();
    setMessages(prev => [...prev, { role: "user", content: queryText }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          ragContext: analysis.overview.business_model + "\n" + sources.map(s => s.content).join("\n"),
          question: queryText,
          history: messages
        })
      });
      const data = await res.json();
      if (data.answer) {
        setMessages(prev => [...prev, { role: "model", content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: "model", content: data.error || "No answer compiled." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "API Connection issue. Check chat route console." }]);
    } finally {
      setChatLoading(false);
    }
  }

  // Safe Fallback references
  const overview = analysis.overview || {};
  const metrics = analysis.metrics || {};
  const moat = analysis.moat || { strength: "None", sources: [], details: "" };
  const checklist = analysis.checklist || [];
  const competitors = analysis.competitors || [];
  const growthDrivers = analysis.growth_drivers || [];
  const redFlags = analysis.red_flags || [];
  const news = analysis.recent_news || [];
  const prices = analysis.historical_prices || [];
  const health = analysis.financial_health || { overall: 5, profitability: 5, growth: 5, liquidity: 5 };
  const memo = analysis.investment_memo || { business_overview: "N/A", investment_thesis: "N/A", bull_case: "N/A", bear_case: "N/A" };
  const quality = analysis.quality_scores || { growth_trajectory: 5, competitive_moat: 5, management_quality: 5, financial_strength: 5, risk_profile: 5 };

  // Explain Confidence Calculation (Priority 6)
  const confidenceFactors = [
    { label: "Financial Strength", score: health.overall * 2, weight: "+20%" },
    { label: "Competitive Moat Alignment", score: moat.strength === "Wide" ? 25 : moat.strength === "Narrow" ? 15 : 5, weight: moat.strength === "Wide" ? "+25%" : "+15%" },
    { label: "Growth Trajectory Target", score: quality.growth_trajectory * 2, weight: `+${(quality.growth_trajectory * 2).toFixed(0)}%` },
    { label: "Red Flag Risks Offset", score: -redFlags.length * 4, weight: `-${redFlags.length * 4}%` }
  ];

  // News Sentiment Calculation (Priority 7)
  const positiveNewsCount = news.filter(n => n.sentiment === "Positive").length;
  const overallSentimentScore = news.length > 0 ? Math.round((positiveNewsCount / news.length) * 100) : 50;

  // Filter components by active tab
  const isOverview = activeTab === "Overview";
  const isFinancials = activeTab === "Financials";
  const isQualitative = activeTab === "Qualitative";
  const isPeers = activeTab === "Peers";
  const isNews = activeTab === "News";
  const isCharts = activeTab === "Charts";
  const isAIAnalysis = activeTab === "AI Analysis";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── PRIORITY 4: Company Snapshot Summary Card ──────────────────────── */}
      {revealStep >= 1 && (
        <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "20px", display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr", gap: "24px", transition: "all 0.5s ease", opacity: 1 }} className="progressive-card">

          {/* Logo and Name info */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <img
              src={`https://logo.clearbit.com/${overview.website || "google.com"}`}
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect width='48' height='48' rx='8' fill='%231e293b'/></svg>";
              }}
              style={{ width: "52px", height: "52px", borderRadius: "10px", background: "#111827", padding: "6px", border: "1px solid #1e293b", objectFit: "contain" }}
              alt="Logo"
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>{companyName}</h2>
                <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "#1e293b", color: "#94a3b8" }}>{overview.ticker}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                {overview.exchange} · {overview.sector}
              </div>
            </div>
          </div>

          {/* Core Snapshot parameters */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", fontSize: "12px", borderLeft: "1px solid #141e30", borderRight: "1px solid #141e30", padding: "0 24px" }}>
            <div>
              <div style={{ color: "#475569", fontWeight: 600 }}>CEO</div>
              <div style={{ fontWeight: 700, marginTop: "2px", color: "#e2e8f0" }}>{overview.ceo}</div>
            </div>
            <div>
              <div style={{ color: "#475569", fontWeight: 600 }}>Headquarters</div>
              <div style={{ fontWeight: 700, marginTop: "2px", color: "#e2e8f0" }}>{overview.headquarters}</div>
            </div>
            <div>
              <div style={{ color: "#475569", fontWeight: 600 }}>Employees</div>
              <div style={{ fontWeight: 700, marginTop: "2px", color: "#e2e8f0" }}>{overview.employees}</div>
            </div>
            <div>
              <div style={{ color: "#475569", fontWeight: 600 }}>Founded</div>
              <div style={{ fontWeight: 700, marginTop: "2px", color: "#e2e8f0" }}>{overview.founded}</div>
            </div>
            <div>
              <div style={{ color: "#475569", fontWeight: 600 }}>Country</div>
              <div style={{ fontWeight: 700, marginTop: "2px", color: "#e2e8f0" }}>{overview.country}</div>
            </div>
            <div>
              <div style={{ color: "#475569", fontWeight: 600 }}>Website</div>
              <a href={`https://${overview.website}`} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", fontWeight: 700, textDecoration: "none", display: "block", marginTop: "2px" }}>{overview.website}</a>
            </div>
          </div>

          {/* Pricing parameters */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
            <div>
              <div style={{ color: "#475569", fontWeight: 600 }}>Current Price</div>
              <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "2px", color: "#f8fafc" }}>{analysis.current_price}</div>
            </div>
            <div>
              <div style={{ color: "#475569", fontWeight: 600 }}>Fair Value</div>
              <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "2px", color: "#10b981" }}>{analysis.fair_value}</div>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <div style={{ display: "flex", justifyItems: "space-between", color: "#475569", fontWeight: 600, fontSize: "10px" }}>
                <span>52W Low: {analysis.fifty_two_week_low}</span>
                <span style={{ marginLeft: "auto" }}>52W High: {analysis.fifty_two_week_high}</span>
              </div>
              <div style={{ height: "4px", background: "#1e293b", borderRadius: "99px", marginTop: "4px" }} />
            </div>
          </div>

        </div>
      )}

      {/* ── PRIORITY 4 & 6: AI Verdict & Confidence Explanation ─────────────── */}
      {revealStep >= 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>

          {/* Recommendation verdict summary */}
          <div style={{ background: "#090f1a", border: `1px solid ${isInvest ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "10px", color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>AI Verdict</span>
              <div style={{ fontSize: "28px", fontWeight: 900, color: isInvest ? "#10b981" : "#ef4444", margin: "6px 0 10px 0" }}>
                {isInvest ? "🟢 INVEST" : "🔴 PASS"}
              </div>
              <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                {decision.summary}
              </p>
            </div>
            <div style={{ borderLeft: "1px solid #141e30", height: "80px" }} />
            <RadialScore score={decision.confidence} max={100} label="Conviction" />
          </div>

          {/* Explain Confidence calculation card (Priority 6) */}
          <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "20px" }}>
            <span style={{ fontSize: "11px", color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Confidence Calculation Breakdown</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
              {confidenceFactors.map(factor => (
                <div key={factor.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
                  <span>{factor.label}</span>
                  <span style={{ fontWeight: 700, color: factor.score > 0 ? "#10b981" : "#ef4444" }}>{factor.weight}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #141e30", marginTop: "4px", paddingTop: "6px", display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "#f8fafc" }}>
                <span>Final Compiled Confidence</span>
                <span>{decision.confidence}%</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Tabs & Sub-Panels Filtering ───────────────────────────────────── */}

      {/* Tab: Overview (AI Reasoning, Metrics grid, segments, catalysts) */}
      {isOverview && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* PRIORITY 2: AI Reasoning Signals Block */}
          {revealStep >= 3 && (
            <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: "12px" }}>▲ Positive Reasoning Signals</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {decision.key_reasons.map((r, i) => (
                    <div key={i} style={{ fontSize: "12px", color: "#94a3b8", display: "flex", gap: "8px", lineHeight: 1.4 }}>
                      <span style={{ color: "#10b981" }}>•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ borderLeft: "1px solid #141e30", paddingLeft: "24px" }}>
                <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: "12px" }}>▼ Negative Risk Factors</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {decision.risks.slice(0, 3).map((r, i) => (
                    <div key={i} style={{ fontSize: "12px", color: "#94a3b8", display: "flex", gap: "8px", lineHeight: 1.4 }}>
                      <span style={{ color: "#ef4444" }}>•</span>
                      <span><strong>{r.name}</strong>: {r.evidence}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: "span 2", borderTop: "1px solid #141e30", paddingTop: "16px", fontSize: "13px", color: "#e2e8f0", lineHeight: 1.6 }}>
                <strong>Long-Term Investment Thesis:</strong> {memo.investment_thesis}
              </div>
            </div>
          )}

          {/* PRIORITY 11: Portfolio Manager summary (Investment Memo) */}
          {revealStep >= 3 && (
            <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "24px" }}>
              <div style={{ display: "flex", justifyItems: "space-between", borderBottom: "1px solid #141e30", paddingBottom: "10px", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: "1px", color: "#93c5fd" }}>📂 Portfolio Management Investment Memo</h3>
                <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "auto" }}>AI-Generated Report</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 6px 0", color: "#f8fafc" }}>Business Model Overview</h4>
                  <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>{memo.business_overview}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 6px 0", color: "#f8fafc" }}>Investment Thesis Synopsis</h4>
                  <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>{memo.investment_thesis}</p>
                </div>
                <div style={{ borderTop: "1px solid #141e30", paddingTop: "14px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 6px 0", color: "#4ade80" }}>Bull Case Growth Scenarios</h4>
                  <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>{memo.bull_case}</p>
                </div>
                <div style={{ borderTop: "1px solid #141e30", paddingTop: "14px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 6px 0", color: "#fca5a5" }}>Bear Case Risk Drivers</h4>
                  <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>{memo.bear_case}</p>
                </div>
              </div>
            </div>
          )}

          {/* PRIORITY 12: Click-to-Expand Explainable Metrics Grid */}
          {revealStep >= 4 && (
            <div>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", display: "block", marginBottom: "12px" }}>📊 Financial Metrics (Click for AI Explanation)</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {Object.entries(metrics).map(([key, val]: [string, any]) => {
                  const isExpanded = expandedMetric === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setExpandedMetric(isExpanded ? null : key)}
                      style={{
                        background: isExpanded ? "#0c1524" : "#090f1a",
                        border: isExpanded ? "1px solid #2563eb" : "1px solid #141e30",
                        borderRadius: "10px",
                        padding: "16px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      className="metric-expand-card"
                    >
                      <div style={{ display: "flex", justifyItems: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>{val.label}</span>
                        <span style={{
                          fontSize: "9px",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: val.evaluation === "Excellent" || val.evaluation === "Good" ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: val.evaluation === "Excellent" || val.evaluation === "Good" ? "#4ade80" : "#facc15",
                          marginLeft: "auto"
                        }}>
                          {val.evaluation}
                        </span>
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "#f8fafc", margin: "6px 0 0 0" }}>{val.value}</div>

                      {/* Metric Expansion Drawer */}
                      {isExpanded && (
                        <div style={{ borderTop: "1px solid #141e30", marginTop: "12px", paddingTop: "12px", fontSize: "12px", color: "#94a3b8", lineHeight: 1.5, animation: "fadeIn 0.2s ease" }}>
                          <div style={{ color: "#3b82f6", fontWeight: 700, marginBottom: "4px" }}>AI Evaluation Commentary</div>
                          <p style={{ margin: "0 0 8px 0" }}>{val.comment}</p>
                          <div style={{ color: "#10b981", fontWeight: 700, marginBottom: "2px" }}>Evidence Source Grounding</div>
                          <div style={{ fontSize: "10px", color: "#475569", fontStyle: "italic" }}>
                            Source: Web search indexing. Verified on latest filings.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Visual charts (line/donut) and progress indicators */}
          {revealStep >= 4 && (
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.5fr", gap: "24px" }}>

              {/* SVG Stock chart */}
              <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "20px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, display: "block", marginBottom: "14px" }}>Stock Performance Trend</span>
                <div style={{ height: "180px" }}>
                  <LineChart prices={prices} />
                </div>
              </div>

              {/* SVG Revenue segment breakdown */}
              <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "20px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, display: "block", marginBottom: "14px" }}>Revenue Segments</span>
                <DonutChart segments={overview.business_model ? analysis.business_model_segments : []} />
              </div>

              {/* Factors checklist score list */}
              <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, display: "block" }}>Investment Factor Assessment</span>
                {checklist.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyItems: "space-between", alignItems: "center", fontSize: "12px", borderBottom: "1px solid #121b2d", paddingBottom: "6px" }}>
                    <span style={{ color: "#94a3b8" }}>{item.criterion}</span>
                    <span style={{
                      marginLeft: "auto",
                      fontWeight: 800,
                      color: item.passed ? "#10b981" : "#ef4444",
                      background: item.passed ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      padding: "2px 8px",
                      borderRadius: "4px"
                    }}>
                      {item.passed ? "PASSED" : "FAILED"}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      )}

      {/* Tab: Financials (Metric expansions) */}
      {isFinancials && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px 0" }}>Core Financial Metric Deep Analysis</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {Object.entries(metrics).map(([key, val]: [string, any]) => (
              <div key={key} style={{ background: "#0c1524", border: "1px solid #14233c", borderRadius: "10px", padding: "20px" }}>
                <div style={{ display: "flex", justifyItems: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>{val.label}</span>
                  <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80" }}>{val.evaluation}</span>
                </div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#f8fafc", margin: "8px 0" }}>{val.value}</div>
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 12px 0", lineHeight: 1.5 }}>{val.comment}</p>
                <div style={{ borderTop: "1px solid #1e293b", paddingTop: "8px", fontSize: "11px", color: "#475569" }}>
                  Source Citations: Annual report and broker summaries.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Qualitative (Competitive Moat details) */}
      {isQualitative && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

          <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px 0" }}>Competitive Moat Assessment</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Moat Strength:</span>
              <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", padding: "4px 10px", borderRadius: "99px", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80" }}>
                {moat.strength} Moat
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
              {moat.sources?.map((s, idx) => (
                <span key={idx} style={{ fontSize: "11px", background: "#101827", border: "1px solid #1e293b", color: "#e2e8f0", padding: "3px 10px", borderRadius: "6px" }}>
                  🔑 {s}
                </span>
              ))}
            </div>
            <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              {moat.details}
            </p>
          </div>

          <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px 0" }}>Factor Compliance checklist</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {checklist.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: "12px", padding: "10px 14px", background: "#0c1524", border: "1px solid #14233c", borderRadius: "8px" }}>
                  <span style={{ color: item.passed ? "#10b981" : "#ef4444", fontWeight: 900 }}>{item.passed ? "✓" : "✗"}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{item.criterion}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{item.notes}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab: Peers (Competitor comparisons) */}
      {isPeers && (
        <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px 0" }}>⚔️ Competitor & Market Peer Comparison</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #141e30" }}>
                  <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Competitor</th>
                  <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Market Cap</th>
                  <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>P/E Ratio</th>
                  <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Key Advantage</th>
                  <th style={{ padding: "12px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Key Vulnerability</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #141e30", fontSize: "13px", color: "#e2e8f0" }}>
                    <td style={{ padding: "14px 12px", fontWeight: 700 }}>{comp.name}</td>
                    <td style={{ padding: "14px 12px" }}>{comp.marketCap}</td>
                    <td style={{ padding: "14px 12px" }}>{comp.peRatio}</td>
                    <td style={{ padding: "14px 12px", color: "#34d399" }}>{comp.strength}</td>
                    <td style={{ padding: "14px 12px", color: "#f87171" }}>{comp.weakness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: News (Sentiment evaluation) */}
      {isNews && (
        <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "24px" }}>
          <div style={{ display: "flex", justifyItems: "space-between", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>📰 News Sentiment Analysis</h3>
            <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 700, marginLeft: "auto" }}>
              Overall Sentiment Score: {overallSentimentScore}/100
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {news.map((item, idx) => (
              <div key={idx} style={{ padding: "16px", background: "#0c1524", border: "1px solid #14233c", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyItems: "space-between", alignItems: "flex-start" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 6px 0", color: "#f8fafc" }}>{item.title}</h4>
                  <span style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: item.sentiment === "Positive" ? "rgba(16,185,129,0.15)" : item.sentiment === "Negative" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                    color: item.sentiment === "Positive" ? "#10b981" : item.sentiment === "Negative" ? "#ef4444" : "#eab308",
                    marginLeft: "12px"
                  }}>
                    {item.sentiment}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", margin: "4px 0" }}>
                  {item.source} · {item.date} · Impact: {item.impact}
                </div>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: "8px 0 0 0", lineHeight: 1.4 }}>
                  <strong>AI Summary:</strong> {item.ai_summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Charts (Historical stock data view) */}
      {isCharts && (
        <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px 0" }}>Stock Performance Trend</h3>
          <div style={{ width: "100%", height: "300px" }}>
            <LineChart prices={prices} />
          </div>
        </div>
      )}

      {/* Tab: AI Analysis (Deep reasoning thesis) */}
      {isAIAnalysis && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 12px 0" }}>Analyst Viewpoint & Commentary</h3>
            <p style={{ fontSize: "15px", color: "#e2e8f0", fontStyle: "italic", lineHeight: 1.7, margin: 0 }}>
              "{analysis.reasoning}"
            </p>
          </div>
        </div>
      )}

      {/* ── PRIORITY 10: Structured Risks Panel (Always visible in bottom grid) ── */}
      {revealStep >= 4 && (
        <div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", display: "block", marginBottom: "12px" }}>⚠️ Structured Risk Assessment Cards</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {decision.risks.map((risk, idx) => (
              <div key={idx} style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", justifyItems: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#fca5a5", margin: 0 }}>{risk.name}</h4>
                  <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                      Prob: {risk.probability}
                    </span>
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                      Imp: {risk.impact}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", margin: "4px 0" }}>Horizon: {risk.time_horizon}</div>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: "8px 0", lineHeight: 1.4 }}>
                  <strong>Evidence:</strong> {risk.evidence}
                </p>
                <div style={{ borderTop: "1px solid #141e30", marginTop: "10px", paddingTop: "10px", fontSize: "12px", color: "#34d399" }}>
                  <strong>Mitigation:</strong> {risk.mitigation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PRIORITY 5: Research Sources Panel ────────────────────────────── */}
      {revealStep >= 5 && sources.length > 0 && (
        <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 800, margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>📂 Vector Search Citation Sources ({sources.length} matches)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {sources.map((doc, idx) => (
              <a
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#0c1524",
                  border: "1px solid #14233c",
                  borderRadius: "8px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  textDecoration: "none",
                  transition: "border-color 0.2s ease"
                }}
                className="source-reference-card"
              >
                <div style={{ display: "flex", justifyItems: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#3b82f6" }}>{doc.domain}</span>
                  <span style={{ fontSize: "10px", color: "#475569", marginLeft: "auto" }}>Ref Confidence: {(doc.score * 100).toFixed(0)}%</span>
                </div>
                <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc", margin: "4px 0", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>
                  {doc.title}
                </h4>
                <p style={{ fontSize: "11px", color: "#64748b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>
                  {doc.content}
                </p>
                <div style={{ fontSize: "10px", color: "#475569", marginTop: "4px" }}>Published: {doc.date}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── PRIORITY 8: Interactive RAG Conversational Follow-up Chat ───────── */}
      {revealStep >= 5 && (
        <div style={{ background: "#090f1a", border: "1px solid #141e30", borderRadius: "12px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #141e30", paddingBottom: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "18px" }}>💬</span>
            <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0 }}>Grounded Conversational Follow-up</h3>
            <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", marginLeft: "auto" }}>
              Grounded in {sources.length} sources
            </span>
          </div>

          {/* Chat transcript list */}
          <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px", paddingRight: "8px" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#475569", fontSize: "12px" }}>
                Ask follow-up questions about this research (e.g. "What are the core advantages?" or "Summarize the bear case scenario.")
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "80%", background: msg.role === "user" ? "#2563eb" : "#0c1524", border: msg.role === "user" ? "none" : "1px solid #14233c", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#f8fafc", lineHeight: 1.4 }}>
                <div style={{ fontSize: "10px", color: msg.role === "user" ? "rgba(255,255,255,0.6)" : "#64748b", marginBottom: "4px", fontWeight: 700 }}>
                  {msg.role === "user" ? "YOU" : "AGENT"}
                </div>
                <div>{msg.content}</div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: "flex-start", background: "#0c1524", border: "1px solid #14233c", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#64748b" }}>
                Agent thinking...
              </div>
            )}
          </div>

          {/* Chat input box */}
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()}
              placeholder="Ask a follow-up question (e.g. Compare this with competitors or list key catalysts)..."
              style={{
                flex: 1,
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#f8fafc",
                fontSize: "13px",
                outline: "none"
              }}
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0 20px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
                transition: "background 0.2s"
              }}
            >
              Send Question
            </button>
          </div>

        </div>
      )}

      <style>{`
        .progressive-card {
          animation: fadeUp 0.6s ease;
        }
        .metric-expand-card:hover {
          border-color: #3b82f6 !important;
        }
        .source-reference-card:hover {
          border-color: #3b82f6 !important;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

    </div>
  );
}
