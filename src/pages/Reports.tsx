import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

interface AgentReport {
  agent:   string;
  emoji:   string;
  content: string;
  mtime:   string | null;
  exists:  boolean;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<AgentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reports")
      .then(r => r.json())
      .then(d => { setReports(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#060d1f", color: "#e2e8f0", padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, fontFamily: "monospace", color: "#7dd3fc", letterSpacing: "0.06em", margin: 0 }}>
          📊 Daily Agent Reports
        </h1>
        <span style={{ fontSize: 11, color: "rgba(150,170,220,0.5)", fontFamily: "monospace" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(150,180,255,0.5)" }}>Loading reports…</div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}>
          {reports.map(r => (
            <ReportCard
              key={r.agent}
              report={r}
              isExpanded={expanded === r.agent}
              onToggle={() => setExpanded(prev => prev === r.agent ? null : r.agent)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, isExpanded, onToggle }: {
  report: AgentReport;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { agent, emoji, content, mtime, exists } = report;

  const dateStr = mtime
    ? new Date(mtime).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div style={{
      background: exists ? "rgba(15,25,50,0.9)" : "rgba(30,30,35,0.6)",
      border: exists
        ? "1px solid rgba(80,120,200,0.35)"
        : "1px solid rgba(80,80,90,0.3)",
      borderRadius: 10, padding: 16,
      display: "flex", flexDirection: "column", gap: 10,
      opacity: exists ? 1 : 0.7,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>{emoji}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#c4d4f0", fontFamily: "monospace", letterSpacing: "0.05em" }}>
              {agent.toUpperCase()}
            </div>
            {dateStr && (
              <div style={{ fontSize: 10, color: "rgba(150,170,220,0.55)", marginTop: 1 }}>
                {dateStr}
              </div>
            )}
          </div>
        </div>
        {exists && (
          <span style={{
            fontSize: 9, padding: "2px 8px", borderRadius: 10,
            background: "rgba(22,163,74,0.2)", color: "#4ade80",
            border: "1px solid rgba(22,163,74,0.35)",
          }}>
            ✓ Filed
          </span>
        )}
      </div>

      {/* Preview / No report */}
      {!exists ? (
        <p style={{ fontSize: 12, color: "rgba(150,160,180,0.55)", margin: 0, fontStyle: "italic" }}>
          No report yet — check back later.
        </p>
      ) : (
        <>
          {!isExpanded && (
            <p style={{ fontSize: 12, color: "rgba(180,200,240,0.75)", margin: 0, lineHeight: 1.6 }}>
              {content.slice(0, 300)}{content.length > 300 ? "…" : ""}
            </p>
          )}

          {isExpanded && (
            <div style={{
              fontSize: 12, color: "rgba(200,220,255,0.85)", lineHeight: 1.7,
              maxHeight: 480, overflowY: "auto",
            }}>
              <MarkdownView content={content} />
            </div>
          )}

          <button
            onClick={onToggle}
            style={{
              alignSelf: "flex-start",
              background: "rgba(37,99,235,0.15)",
              border: "1px solid rgba(37,99,235,0.4)",
              borderRadius: 6, padding: "4px 12px",
              color: "#93c5fd", fontSize: 11, cursor: "pointer",
            }}
          >
            {isExpanded ? "▲ Collapse" : "▼ View Full Report"}
          </button>
        </>
      )}
    </div>
  );
}

function MarkdownView({ content }: { content: string }) {
  return (
    <div className="md-content">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
