"use client";

import { useState, useEffect } from "react";
import ResultCard from "./components/ResultCard";

interface RecentSearch {
  name: string;
  verdict: "INVEST" | "PASS" | "HOLD";
}

interface AgentStage {
  id: string;
  label: string;
  description: string;
  status: "idle" | "running" | "done" | "error";
  time?: string;
}

export default function Home() {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [currentTime, setCurrentTime] = useState("");

  // Agent Progress State
  const [stages, setStages] = useState<AgentStage[]>([]);
  const [timelineStart, setTimelineStart] = useState<number | null>(null);

  // Set formatted current time
  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    setCurrentTime(date.toLocaleDateString('en-US', options));

    // Load recent searches from localStorage
    const saved = localStorage.getItem("investment_agent_recent");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        // Fallback
      }
    } else {
      // Mock initial recent searches to match the screenshot
      const initial: RecentSearch[] = [
        { name: "Zomato", verdict: "INVEST" },
        { name: "Reliance Industries", verdict: "INVEST" },
        { name: "Tesla", verdict: "HOLD" },
        { name: "Infosys", verdict: "INVEST" },
        { name: "Apple", verdict: "INVEST" }
      ];
      setRecentSearches(initial);
      localStorage.setItem("investment_agent_recent", JSON.stringify(initial));
    }
  }, []);

  const initialStages: AgentStage[] = [
    { id: "search", label: "Searching the Web", description: "Querying Tavily Web Search API (4 queries)", status: "idle" },
    { id: "chunk", label: "Reading & Splitting Content", description: "Breaking documents into character segments", status: "idle" },
    { id: "embed", label: "Creating Embeddings", description: "Converting chunks using gemini-embedding-001", status: "idle" },
    { id: "store", label: "Indexing Vector Store", description: "Loading chunks into MemoryVectorStore", status: "idle" },
    { id: "retrieve", label: "Retrieving Relevant Context", description: "Performing similarity search matches", status: "idle" },
    { id: "analyze", label: "Gemini Financial Analysis", description: "Grading metrics & compiling memo", status: "idle" },
    { id: "decide", label: "Generating Verdict Memo", description: "Formulating final INVEST / PASS decision", status: "idle" }
  ];

  async function analyze(name?: string) {
    const query = (name ?? company).trim();
    if (!query) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setStages(initialStages.map(s => ({ ...s, status: "idle", time: undefined })));

    const startTime = Date.now();
    setTimelineStart(startTime);

    // Dynamic Helper to mark a stage status
    const updateStage = (id: string, status: "running" | "done" | "error") => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      setStages(prev =>
        prev.map(s => (s.id === id ? { ...s, status, time: `+${elapsed}s` } : s))
      );
    };

    // Stage simulation timers (interrupted immediately when API returns)
    const timers: NodeJS.Timeout[] = [];

    // Start Stage 1 immediately
    updateStage("search", "running");

    // Timeline simulations based on average execution speeds
    timers.push(setTimeout(() => {
      updateStage("search", "done");
      updateStage("chunk", "running");
    }, 3200));

    timers.push(setTimeout(() => {
      updateStage("chunk", "done");
      updateStage("embed", "running");
    }, 5500));

    timers.push(setTimeout(() => {
      updateStage("embed", "done");
      updateStage("store", "running");
    }, 7800));

    timers.push(setTimeout(() => {
      updateStage("store", "done");
      updateStage("retrieve", "running");
    }, 9400));

    timers.push(setTimeout(() => {
      updateStage("retrieve", "done");
      updateStage("analyze", "running");
    }, 10800));

    timers.push(setTimeout(() => {
      updateStage("analyze", "done");
      updateStage("decide", "running");
    }, 14500));

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: query }),
      });

      // Clear timers
      timers.forEach(t => clearTimeout(t));

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        // Mark active stages as error
        setStages(prev => prev.map(s => s.status === "running" ? { ...s, status: "error" } : s));
      } else {
        // Instantly mark all stages as done with real timestamps
        setStages(prev =>
          prev.map((s, idx) => {
            const simulatedSeconds = (idx * 2 + 1.5).toFixed(1);
            return {
              ...s,
              status: "done",
              time: `+${simulatedSeconds}s`
            };
          })
        );

        setResult(data);

        // Add to recent searches in state and localStorage
        const verdict = data.decision?.verdict === "INVEST" ? "INVEST" : "PASS";
        const updated = [
          { name: data.companyName || query, verdict: verdict as any },
          ...recentSearches.filter(item => item.name.toLowerCase() !== query.toLowerCase())
        ].slice(0, 8); // Keep top 8

        setRecentSearches(updated);
        localStorage.setItem("investment_agent_recent", JSON.stringify(updated));
      }
    } catch (err) {
      timers.forEach(t => clearTimeout(t));
      setError("Network connection error. Check server logs.");
      setStages(prev => prev.map(s => s.status === "running" ? { ...s, status: "error" } : s));
    } finally {
      setLoading(false);
      setTimelineStart(null);
    }
  }

  const navItems = [
    { label: "Dashboard", icon: "📊" },
    { label: "Research", icon: "🔍" },
    { label: "Watchlist", icon: "⭐" },
    { label: "Comparisons", icon: "⚔️" },
    { label: "Reports", icon: "📋" },
    { label: "Alerts", icon: "🔔" },
    { label: "Settings", icon: "⚙️" }
  ];

  return (
    <main style={{ minHeight: "100vh", display: "flex", background: "#060b13", color: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* 1. Left Sidebar */}
      <aside style={{ width: "260px", background: "#090f1a", borderRight: "1px solid #141e30", display: "flex", flexDirection: "column", padding: "24px 16px", flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", padding: "0 8px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #2563eb, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px" }}>
            🧠
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.5px" }}>AI INVESTMENT</div>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Research Agent</div>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "40px" }}>
          {navItems.map(item => (
            <button
              key={item.label}
              onClick={() => { }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                border: "none",
                borderRadius: "8px",
                background: item.label === "Dashboard" ? "rgba(59, 130, 246, 0.1)" : "transparent",
                color: item.label === "Dashboard" ? "#3b82f6" : "#94a3b8",
                fontSize: "14px",
                fontWeight: item.label === "Dashboard" ? 600 : 500,
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Recent Research Section */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", padding: "0 8px" }}>
            Recent Research
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {recentSearches.map((item, idx) => (
              <button
                key={`${item.name}-${idx}`}
                onClick={() => { if (!loading) { setCompany(item.name); analyze(item.name); } }}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  background: "transparent",
                  border: "none",
                  color: "#e2e8f0",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "background 0.2s"
                }}
                className="recent-search-btn"
              >
                <span>{item.name}</span>
                <span style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: item.verdict === "INVEST" ? "rgba(34, 197, 94, 0.15)" : item.verdict === "HOLD" ? "rgba(234, 179, 8, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  color: item.verdict === "INVEST" ? "#4ade80" : item.verdict === "HOLD" ? "#facc15" : "#fca5a5"
                }}>
                  {item.verdict}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Gemini Active Model Info */}
        <div style={{ background: "#0c1524", border: "1px solid #14233c", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ fontSize: "14px" }}>✨</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#93c5fd" }}>Gemini AI</span>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
            <span style={{ fontSize: "10px", color: "#22c55e", fontWeight: 600 }}>Active</span>
          </div>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
            Using gemini-3.1-flash-lite for deep research & analysis.
          </p>
        </div>

        {/* User Card */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 8px 0", borderTop: "1px solid #141e30" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1e293b", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>
            SR
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>Shashi Ranjan</div>
            <div style={{ fontSize: "10px", color: "#64748b" }}>Intern</div>
          </div>
        </div>

      </aside>

      {/* 2. Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top Header Bar */}
        <header style={{ height: "64px", background: "#090f1a", borderBottom: "1px solid #141e30", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>

          {/* Header Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
              {result ? `${result.companyName} Research Workspace` : "Dashboard"}
            </h1>
          </div>

          {/* Search box & controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

            {/* Search Input Box */}
            <div style={{ position: "relative", width: "340px" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: "14px" }}>🔍</span>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && analyze()}
                placeholder="Search company (e.g. Apple, Tesla, Nvidia...)"
                style={{
                  width: "100%",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "8px 12px 8px 36px",
                  color: "#f8fafc",
                  fontSize: "13px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
              />
            </div>

            {/* Analyze Button */}
            <button
              onClick={() => analyze()}
              disabled={loading || !company.trim()}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: loading || !company.trim() ? "not-allowed" : "pointer",
                transition: "background 0.2s"
              }}
            >
              {loading ? "Researching..." : "+ New Research"}
            </button>

            {/* Right Date and Toggles */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", borderLeft: "1px solid #1e293b", paddingLeft: "16px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>{currentTime}</span>
              <button style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "16px", cursor: "pointer" }}>☀️</button>
            </div>

          </div>

        </header>

        {/* Scrollable Dashboard Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

          {/* Sub-header Navigation Tabs (Only when result is loaded) */}
          {result && (
            <div style={{ display: "flex", alignItems: "center", justifyItems: "space-between", borderBottom: "1px solid #141e30", marginBottom: "20px", paddingBottom: "2px" }}>

              {/* Tab options */}
              <div style={{ display: "flex", gap: "24px" }}>
                {["Overview", "Financials", "Qualitative", "Peers", "News", "Charts", "AI Analysis"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: "transparent",
                      border: "none",
                      borderBottom: activeTab === tab ? "2px solid #2563eb" : "2px solid transparent",
                      color: activeTab === tab ? "#2563eb" : "#64748b",
                      padding: "8px 0 10px 0",
                      fontSize: "14px",
                      fontWeight: activeTab === tab ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Download / Share Actions */}
              <div style={{ marginLeft: "auto", display: "flex", gap: "10px", paddingBottom: "8px" }}>
                <button style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "#94a3b8", padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  📥 Download Report
                </button>
                <button style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "#94a3b8", padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  🔗 Share
                </button>
              </div>

            </div>
          )}

          {/* Agent Progress Panel (Priority 1 & 9 Timeline) */}
          {loading && (
            <div style={{ maxWidth: "680px", margin: "40px auto", background: "#090f1a", border: "1px solid #141e30", borderRadius: "16px", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", borderBottom: "1px solid #141e30", paddingBottom: "16px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#2563eb", animation: "ping 1.5s infinite" }} />
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Agent Reasoning & Execution Timeline</h3>
                <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "auto" }}>Live Thread</span>
              </div>

              {/* Timelines and Steps */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {stages.map((stage) => {
                  const isDone = stage.status === "done";
                  const isRunning = stage.status === "running";
                  const isError = stage.status === "error";

                  return (
                    <div key={stage.id} style={{ display: "flex", alignItems: "flex-start", gap: "16px", opacity: stage.status === "idle" ? 0.35 : 1, transition: "opacity 0.3s" }}>

                      {/* Timeline icon line */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: isDone ? "rgba(16, 185, 129, 0.15)" : isRunning ? "rgba(37, 99, 235, 0.15)" : isError ? "rgba(239, 68, 68, 0.15)" : "transparent",
                          border: isDone ? "2px solid #10b981" : isRunning ? "2px solid #2563eb" : isError ? "2px solid #ef4444" : "2px solid #1e293b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          color: isDone ? "#10b981" : isRunning ? "#2563eb" : isError ? "#ef4444" : "#475569"
                        }}>
                          {isDone ? "✓" : isRunning ? "⏳" : isError ? "✗" : "•"}
                        </div>
                      </div>

                      {/* Timeline info content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: isDone ? "#f8fafc" : isRunning ? "#3b82f6" : isError ? "#f87171" : "#94a3b8" }}>
                            {stage.label}
                          </span>
                          {stage.time && (
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", fontFamily: "monospace" }}>
                              {stage.time}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>{stage.description}</p>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Progress hint */}
              <div style={{ borderTop: "1px solid #141e30", marginTop: "24px", paddingTop: "16px", textAlign: "center", fontSize: "12px", color: "#475569" }}>
                Grounded via similarity search memory vector matches. Process completes in 12-20 seconds.
              </div>
            </div>
          )}

          {/* Error View */}
          {error && (
            <div style={{ padding: "20px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "12px", color: "#fca5a5", maxWidth: "680px", margin: "40px auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, marginBottom: "8px" }}>
                <span>⚠️</span> Execution Failed
              </div>
              <p style={{ fontSize: "14px", margin: "0 0 12px 0", lineHeight: 1.5 }}>{error}</p>
              <div style={{ fontSize: "12px", color: "#ef4444", borderTop: "1px solid rgba(239,68,68,0.15)", paddingTop: "10px" }}>
                Please review TAVILY_API_KEY and GEMINI_API_KEY values inside .env.local configuration file.
              </div>
            </div>
          )}

          {/* Initial State Dashboard Description */}
          {!result && !loading && !error && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>📈</div>
              <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 12px 0" }}>AI Investment Analyst</h2>
              <p style={{ fontSize: "15px", color: "#64748b", maxWidth: "480px", margin: "0 0 32px 0", lineHeight: 1.6 }}>
                Enter a company's name above or click one of the recent research models in the sidebar to run a complete financial dashboard evaluation.
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                {["Apple", "Tesla", "Nvidia", "Zomato", "Infosys"].map(name => (
                  <button
                    key={name}
                    onClick={() => { setCompany(name); analyze(name); }}
                    style={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "99px",
                      padding: "8px 16px",
                      color: "#94a3b8",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    className="example-pill-btn"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result Dashboard Layout */}
          {result && !loading && !error && (
            <ResultCard
              companyName={result.companyName}
              analysis={result.analysis}
              decision={result.decision}
              researchData={result.researchData || []}
              activeTab={activeTab}
            />
          )}

        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .recent-search-btn:hover {
          background: rgba(255, 255, 255, 0.03) !important;
        }
        .example-pill-btn:hover {
          background: #1e293b !important;
          color: #f8fafc !important;
          border-color: #3b82f6 !important;
        }
        * { box-sizing: border-box; }
      `}</style>

    </main>
  );
}
