"use client";

import { useState, useRef, useEffect } from "react";

const ADVISORS = [
  {
    id: "optimist",
    name: "The Visionary",
    role: "Best-case architect",
    color: "#00D4FF",
    bg: "rgba(0,212,255,0.08)",
    border: "rgba(0,212,255,0.25)",
    icon: "◈",
  },
  {
    id: "devil",
    name: "The Contrarian",
    role: "Risk stress-tester",
    color: "#FF4D6D",
    bg: "rgba(255,77,109,0.08)",
    border: "rgba(255,77,109,0.25)",
    icon: "◆",
  },
  {
    id: "pragmatist",
    name: "The Realist",
    role: "Ground-truth navigator",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.25)",
    icon: "◉",
  },
] as const;

type AdvisorId = "optimist" | "devil" | "pragmatist";
type VerdictType = "proceed" | "pause" | "avoid";

interface Synthesis {
  verdict: string;
  confidence: number;
  swingFactor: string;
  actions: string[];
  verdictType: VerdictType;
}

interface HistoryItem {
  decision: string;
  synthesis: Synthesis;
  timestamp: Date;
}

const VERDICT_COLORS: Record<VerdictType, string> = {
  proceed: "#00D4FF",
  pause: "#A78BFA",
  avoid: "#FF4D6D",
};

const VERDICT_LABELS: Record<VerdictType, string> = {
  proceed: "PROCEED",
  pause: "PAUSE & REFLECT",
  avoid: "AVOID",
};

function AdvisorCard({
  advisor,
  text,
  loading,
}: {
  advisor: (typeof ADVISORS)[number];
  text: string;
  loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current && loading)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [text, loading]);

  return (
    <div
      style={{
        background: advisor.bg,
        border: `1px solid ${advisor.border}`,
        borderRadius: 12,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxShadow: loading ? `0 0 24px ${advisor.color}22` : "none",
        transition: "box-shadow 0.3s",
        minHeight: 220,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22, color: advisor.color }}>{advisor.icon}</span>
        <div>
          <div style={{ color: advisor.color, fontWeight: 700, fontSize: 15 }}>
            {advisor.name}
          </div>
          <div style={{ color: "#666", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {advisor.role}
          </div>
        </div>
        {loading && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: advisor.color,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>
      <div
        ref={scrollRef}
        style={{
          color: "#C8C8D8", fontSize: 14, lineHeight: 1.75,
          overflowY: "auto", maxHeight: 200,
        }}
      >
        {text || (
          <span style={{ color: "#444", fontStyle: "italic" }}>
            {loading ? "Analyzing…" : "Awaiting debate…"}
          </span>
        )}
      </div>
    </div>
  );
}

function ConfidenceMeter({ value, type }: { value: number; type: VerdictType }) {
  const color = VERDICT_COLORS[type];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#888", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Decision Clarity
        </span>
        <span style={{ color, fontWeight: 800, fontSize: 22, fontFamily: "monospace" }}>
          {value}%
        </span>
      </div>
      <div style={{ height: 4, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
        <div
          style={{
            height: "100%", width: `${value}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 2, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [decision, setDecision] = useState("");
  const [context, setContext] = useState("");
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [opinions, setOpinions] = useState<Record<AdvisorId, string>>({
    optimist: "", devil: "", pragmatist: "",
  });
  const [synthesis, setSynthesis] = useState<Synthesis | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showContext, setShowContext] = useState(false);
  const [error, setError] = useState("");

  const canRun = decision.trim().length > 10 && phase === "idle";

  async function runSimulation() {
    if (!canRun) return;
    setPhase("running");
    setOpinions({ optimist: "", devil: "", pragmatist: "" });
    setSynthesis(null);
    setError("");

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, context }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Simulation failed");
      }

      const data = await res.json();

      // Animate opinions word by word
      await Promise.all(
        (["optimist", "devil", "pragmatist"] as AdvisorId[]).map(async (id) => {
          const words = (data.opinions[id] as string).split(" ");
          for (let i = 0; i < words.length; i++) {
            await new Promise((r) => setTimeout(r, 18));
            setOpinions((prev) => ({
              ...prev,
              [id]: prev[id] + (i > 0 ? " " : "") + words[i],
            }));
          }
        })
      );

      setSynthesis(data.synthesis);
      setPhase("done");
      setHistory((prev) => [
        { decision, synthesis: data.synthesis, timestamp: new Date() },
        ...prev.slice(0, 4),
      ]);
    } catch (e) {
      setError((e as Error).message);
      setPhase("idle");
    }
  }

  function reset() {
    setPhase("idle");
    setDecision("");
    setContext("");
    setOpinions({ optimist: "", devil: "", pragmatist: "" });
    setSynthesis(null);
    setError("");
    setShowContext(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#E8E8F0", fontFamily: "inherit" }}>
      {/* Ambient grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.03) 1px,transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      <style>{`
        .simulate-btn:hover:not(:disabled){background:linear-gradient(135deg,#00D4FF22,#A78BFA22)!important;border-color:#A78BFA!important;transform:translateY(-1px);box-shadow:0 8px 32px rgba(0,212,255,.2)!important}
        .simulate-btn:disabled{opacity:.4;cursor:not-allowed}
        .history-item:hover{border-color:#2a2a4a!important;background:#0d0d20!important;cursor:pointer}
        textarea:focus{outline:none;border-color:rgba(0,212,255,.4)!important;box-shadow:0 0 0 3px rgba(0,212,255,.08)!important}
        .ctx-btn:hover{color:#A78BFA!important}
        .reset-small:hover{border-color:rgba(255,77,109,.5)!important;color:#FF4D6D!important}
      `}</style>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeUp .6s ease" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(0,212,255,.08)", border: "1px solid rgba(0,212,255,.2)",
            borderRadius: 100, padding: "6px 16px", marginBottom: 20,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF", animation: "glow 2s ease infinite" }} />
            <span style={{ color: "#00D4FF", fontSize: 11, letterSpacing: "0.15em", fontWeight: 600 }}>
              MULTI-AGENT DECISION ENGINE
            </span>
          </div>
          <h1 style={{
            fontSize: "clamp(36px,6vw,60px)", fontWeight: 900,
            lineHeight: 1.05, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg,#fff 30%,#A78BFA 70%,#00D4FF)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: 12,
          }}>
            Decide with clarity.
          </h1>
          <p style={{ color: "#666", fontSize: 16, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Three AI advisors debate your decision in parallel. One synthesis tells you what to do.
          </p>
        </div>

        {/* Input */}
        <div style={{
          background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 16, padding: 28, marginBottom: 32, animation: "fadeUp .6s ease .1s both",
        }}>
          <label style={{ display: "block", color: "#888", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
            Your Decision
          </label>
          <textarea
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            placeholder="e.g. Should I quit my job to build a startup this year?"
            disabled={phase !== "idle"}
            rows={3}
            style={{
              width: "100%", background: "rgba(255,255,255,.03)",
              border: "1px solid rgba(255,255,255,.1)", borderRadius: 10,
              color: "#E8E8F0", fontSize: 16, lineHeight: 1.6,
              padding: "14px 16px", resize: "none", transition: "all .2s", fontFamily: "inherit",
            }}
          />

          <button className="ctx-btn" onClick={() => setShowContext(!showContext)} disabled={phase !== "idle"}
            style={{ background: "none", border: "none", color: "#555", fontSize: 12, cursor: "pointer", padding: "8px 0 0", letterSpacing: "0.06em", transition: "color .2s" }}>
            {showContext ? "▾" : "▸"} Add context (optional)
          </button>

          {showContext && (
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. I have 6 months runway, a co-founder, and early user interest…"
              disabled={phase !== "idle"}
              rows={2}
              style={{
                width: "100%", background: "rgba(255,255,255,.02)",
                border: "1px solid rgba(255,255,255,.06)", borderRadius: 10,
                color: "#C8C8D8", fontSize: 14, lineHeight: 1.6,
                padding: "12px 16px", resize: "none", marginTop: 8,
                transition: "all .2s", fontFamily: "inherit",
              }}
            />
          )}

          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,77,109,.1)", border: "1px solid rgba(255,77,109,.3)", borderRadius: 8, color: "#FF4D6D", fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button className="simulate-btn" onClick={runSimulation} disabled={!canRun}
              style={{
                flex: 1, background: "linear-gradient(135deg,rgba(0,212,255,.1),rgba(167,139,250,.1))",
                border: "1px solid rgba(0,212,255,.3)", color: "#E8E8F0", borderRadius: 10,
                padding: "14px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                letterSpacing: "0.06em", transition: "all .2s", fontFamily: "inherit",
              }}>
              {phase === "running" ? "⟳  Debating…" : "◈  Run Simulation"}
            </button>
            {phase !== "idle" && (
              <button className="reset-small" onClick={reset}
                style={{
                  background: "rgba(255,77,109,.1)", border: "1px solid rgba(255,77,109,.25)",
                  color: "#FF4D6D", borderRadius: 10, padding: "14px 18px",
                  fontSize: 14, cursor: "pointer", fontWeight: 600,
                  transition: "all .2s", fontFamily: "inherit",
                }}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Advisor Cards */}
        {phase !== "idle" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginBottom: 32, animation: "fadeUp .5s ease" }}>
            {ADVISORS.map((a) => (
              <AdvisorCard key={a.id} advisor={a} text={opinions[a.id]} loading={phase === "running" && !opinions[a.id]} />
            ))}
          </div>
        )}

        {/* Synthesis */}
        {synthesis && phase === "done" && (
          <div style={{
            background: "rgba(255,255,255,.02)",
            border: `1px solid ${VERDICT_COLORS[synthesis.verdictType]}44`,
            borderRadius: 16, padding: 32, animation: "fadeUp .6s ease",
            boxShadow: `0 0 40px ${VERDICT_COLORS[synthesis.verdictType]}11`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.06)" }} />
              <span style={{ color: "#555", fontSize: 11, letterSpacing: "0.15em" }}>SYNTHESIS</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.06)" }} />
            </div>

            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                display: "inline-block",
                background: `${VERDICT_COLORS[synthesis.verdictType]}15`,
                border: `1px solid ${VERDICT_COLORS[synthesis.verdictType]}44`,
                borderRadius: 100, padding: "8px 24px", marginBottom: 16,
              }}>
                <span style={{ color: VERDICT_COLORS[synthesis.verdictType], fontWeight: 800, fontSize: 12, letterSpacing: "0.2em" }}>
                  {VERDICT_LABELS[synthesis.verdictType]}
                </span>
              </div>
              <p style={{ color: "#E8E8F0", fontSize: 18, fontWeight: 600, lineHeight: 1.5, maxWidth: 600, margin: "0 auto" }}>
                {synthesis.verdict}
              </p>
            </div>

            <ConfidenceMeter value={synthesis.confidence} type={synthesis.verdictType} />

            {synthesis.swingFactor && (
              <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(167,139,250,.06)", border: "1px solid rgba(167,139,250,.15)", borderRadius: 10 }}>
                <div style={{ color: "#888", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>⚡ Swing Factor</div>
                <div style={{ color: "#C8C8D8", fontSize: 14, lineHeight: 1.6 }}>{synthesis.swingFactor}</div>
              </div>
            )}

            {synthesis.actions?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ color: "#888", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                  If You Proceed — Do These
                </div>
                {synthesis.actions.map((action, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 14, alignItems: "flex-start",
                    padding: "12px 16px", marginBottom: 8,
                    background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8,
                  }}>
                    <span style={{ color: "#00D4FF", fontWeight: 800, fontSize: 12, minWidth: 20, fontFamily: "monospace", paddingTop: 1 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ color: "#C8C8D8", fontSize: 14, lineHeight: 1.6 }}>{action}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={reset} style={{
              marginTop: 28, width: "100%", background: "none",
              border: "1px solid rgba(255,255,255,.08)", color: "#666", borderRadius: 10,
              padding: 12, fontSize: 13, cursor: "pointer", letterSpacing: "0.06em",
              transition: "all .2s", fontFamily: "inherit",
            }}>
              ↩ Simulate another decision
            </button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && phase === "idle" && (
          <div style={{ marginTop: 48, animation: "fadeUp .5s ease" }}>
            <div style={{ color: "#444", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
              Recent Simulations
            </div>
            {history.map((item, i) => (
              <div key={i} className="history-item" onClick={() => setDecision(item.decision)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", marginBottom: 8,
                  background: "rgba(255,255,255,.01)", border: "1px solid rgba(255,255,255,.05)",
                  borderRadius: 8, transition: "all .2s",
                }}>
                <div>
                  <div style={{ color: "#C8C8D8", fontSize: 13, marginBottom: 2 }}>
                    {item.decision.length > 70 ? item.decision.slice(0, 70) + "…" : item.decision}
                  </div>
                  <div style={{ color: "#444", fontSize: 11 }}>
                    {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div style={{
                  color: VERDICT_COLORS[item.synthesis.verdictType],
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                  background: `${VERDICT_COLORS[item.synthesis.verdictType]}15`,
                  padding: "4px 10px", borderRadius: 100,
                  border: `1px solid ${VERDICT_COLORS[item.synthesis.verdictType]}33`,
                }}>
                  {VERDICT_LABELS[item.synthesis.verdictType]}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 60, color: "#333", fontSize: 12, letterSpacing: "0.06em" }}>
          Built with Claude · Multi-Agent Architecture · Parallel Inference
        </div>
      </div>
    </div>
  );
}
