import { useEffect, useState } from "react";

type AuditStatus = "ok" | "warning" | "critical";

interface AuditSection {
  name:     string;
  status:   AuditStatus;
  findings: string[];
  notes?:   string;
}

interface AuditData {
  date:          string;
  runAt:         string;
  overallStatus: AuditStatus;
  sections:      AuditSection[];
  summary:       string;
}

interface AuditResponse {
  latest:  AuditData | null;
  history: Array<{ date: string; data: AuditData }>;
}

// ─── Colors ────────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<AuditStatus, string> = {
  ok:       "#22c55e",
  warning:  "#f59e0b",
  critical: "#ef4444",
};
const STATUS_BG: Record<AuditStatus, string> = {
  ok:       "rgba(22,163,74,0.15)",
  warning:  "rgba(161,98,7,0.15)",
  critical: "rgba(220,38,38,0.15)",
};
const STATUS_BORDER: Record<AuditStatus, string> = {
  ok:       "rgba(22,163,74,0.4)",
  warning:  "rgba(161,98,7,0.4)",
  critical: "rgba(220,38,38,0.4)",
};

function StatusBadge({ status }: { status: AuditStatus }) {
  const icons: Record<AuditStatus, string> = { ok: "✅", warning: "⚠️", critical: "🔴" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 12px", borderRadius: 12, fontSize: 11,
      background: STATUS_BG[status], color: STATUS_COLOR[status],
      border: `1px solid ${STATUS_BORDER[status]}`, fontWeight: 600,
    }}>
      {icons[status]} {status.toUpperCase()}
    </span>
  );
}

function SectionCard({ section }: { section: AuditSection }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{
      background: STATUS_BG[section.status], border: `1px solid ${STATUS_BORDER[section.status]}`,
      borderRadius: 8, overflow: "hidden",
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 14px", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <StatusBadge status={section.status} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#d4e4ff" }}>{section.name}</span>
        </div>
        <span style={{ fontSize: 10, color: "rgba(150,170,220,0.6)" }}>
          {section.findings.length} finding{section.findings.length !== 1 ? "s" : ""} {open ? "▲" : "▼"}
        </span>
      </div>

      {open && (
        <div style={{ padding: "0 14px 12px" }}>
          {section.findings.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20, color: "rgba(200,220,255,0.8)", fontSize: 12, lineHeight: 1.8 }}>
              {section.findings.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          ) : (
            <p style={{ fontSize: 12, color: "rgba(150,180,220,0.5)", margin: 0 }}>No findings.</p>
          )}
          {section.notes && (
            <p style={{
              marginTop: 8, marginBottom: 0,
              fontSize: 11, color: "rgba(160,190,230,0.65)",
              fontStyle: "italic", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 8,
            }}>
              📝 {section.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryDot({ date, status }: { date: string; status: AuditStatus }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        width: 14, height: 14, borderRadius: "50%",
        background: STATUS_COLOR[status],
        boxShadow: `0 0 6px ${STATUS_COLOR[status]}`,
      }} />
      <span style={{ fontSize: 9, color: "rgba(150,170,220,0.5)", fontFamily: "monospace" }}>
        {date.slice(5)} {/* MM-DD */}
      </span>
    </div>
  );
}

export default function AuditPage() {
  const [data,    setData]    = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handlePrint = () => window.print();

  return (
    <div style={{
      minHeight: "100vh", background: "#060d1f", color: "#e2e8f0",
      padding: "20px 24px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontFamily: "monospace", color: "#7dd3fc", margin: 0, letterSpacing: "0.06em" }}>
            Daily Audit — Karen 📋
          </h1>
          {data?.latest && (
            <p style={{ fontSize: 11, color: "rgba(150,170,220,0.5)", margin: "5px 0 0", fontFamily: "monospace" }}>
              Last run: {new Date(data.latest.runAt).toLocaleString("en-US", {
                month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <button
          onClick={handlePrint}
          style={{
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6, padding: "7px 16px", color: "rgba(180,200,240,0.8)",
            fontSize: 12, cursor: "pointer",
          }}
        >
          🖨 Export PDF
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(150,180,255,0.4)" }}>Loading audit…</div>
      )}

      {!loading && !data?.latest && (
        <div style={{
          background: "rgba(30,30,40,0.6)", border: "1px solid rgba(80,80,100,0.3)",
          borderRadius: 10, padding: "40px 30px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🕐</div>
          <h2 style={{ fontSize: 16, color: "rgba(180,200,240,0.6)", margin: 0 }}>
            No audit run yet today
          </h2>
          <p style={{ fontSize: 12, color: "rgba(150,170,220,0.4)", marginTop: 8 }}>
            Karen's audit will appear here once she runs her daily check.
          </p>
        </div>
      )}

      {!loading && data?.latest && (
        <>
          {/* Overall status banner */}
          <div style={{
            display: "flex", gap: 16, alignItems: "center",
            background: STATUS_BG[data.latest.overallStatus],
            border: `1px solid ${STATUS_BORDER[data.latest.overallStatus]}`,
            borderRadius: 10, padding: "14px 18px", marginBottom: 20,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "rgba(160,180,220,0.6)", fontFamily: "monospace" }}>
                  OVERALL STATUS
                </span>
                <StatusBadge status={data.latest.overallStatus} />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(200,220,255,0.85)", lineHeight: 1.6 }}>
                {data.latest.summary}
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 22, color: STATUS_COLOR[data.latest.overallStatus] }}>
                {data.latest.sections.filter(s => s.status === "ok").length}
                <span style={{ fontSize: 11, color: "rgba(150,180,220,0.5)" }}> ok</span>
              </div>
              <div style={{ fontSize: 22, color: STATUS_COLOR["warning"] }}>
                {data.latest.sections.filter(s => s.status === "warning").length}
                <span style={{ fontSize: 11, color: "rgba(150,180,220,0.5)" }}> warn</span>
              </div>
              <div style={{ fontSize: 22, color: STATUS_COLOR["critical"] }}>
                {data.latest.sections.filter(s => s.status === "critical").length}
                <span style={{ fontSize: 11, color: "rgba(150,180,220,0.5)" }}> crit</span>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {data.latest.sections.map((s, i) => (
              <SectionCard key={i} section={s} />
            ))}
          </div>

          {/* History timeline */}
          {data.history.length > 0 && (
            <div style={{
              background: "rgba(10,18,45,0.7)", border: "1px solid rgba(80,120,200,0.2)",
              borderRadius: 10, padding: "14px 18px",
            }}>
              <h3 style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(150,180,255,0.6)", margin: "0 0 14px" }}>
                LAST 7 DAYS
              </h3>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                {data.history.map(h => (
                  <HistoryDot key={h.date} date={h.date} status={h.data.overallStatus} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                {([["ok", "✅ OK"], ["warning", "⚠️ Warning"], ["critical", "🔴 Critical"]] as const).map(([s, label]) => (
                  <span key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "rgba(150,170,220,0.55)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[s], display: "inline-block" }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
