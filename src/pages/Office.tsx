import { useEffect, useRef, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type AgentStatus = "working" | "idle" | "offline";
type AgentName =
  | "fred" | "scout" | "dusty" | "hugh" | "teky"
  | "buzz" | "mac" | "dale" | "rex" | "karen" | "cash";

interface AgentConfig {
  name: string;
  label: string;
  shirtColor: string;
  room: string;
  deskEmoji: string;
  roomEmoji: string;
}

interface Pos { x: number; y: number; }

// ─── Agent Configs ─────────────────────────────────────────────────────────────
const AGENTS: Record<AgentName, AgentConfig> = {
  fred:  { name: "fred",  label: "FRED",  shirtColor: "#2563eb", room: "Fred's Office",     deskEmoji: "🖥️",  roomEmoji: "⭐" },
  scout: { name: "scout", label: "SCOUT", shirtColor: "#16a34a", room: "Scout",             deskEmoji: "🌍",  roomEmoji: "🗺️" },
  dusty: { name: "dusty", label: "DUSTY", shirtColor: "#ea580c", room: "Dusty",             deskEmoji: "🧪",  roomEmoji: "⚗️" },
  hugh:  { name: "hugh",  label: "HUGH",  shirtColor: "#6b7280", room: "Hugh",              deskEmoji: "🗄️",  roomEmoji: "📋" },
  teky:  { name: "teky",  label: "TEKY",  shirtColor: "#9333ea", room: "Teky",              deskEmoji: "💻",  roomEmoji: "🖥️" },
  buzz:  { name: "buzz",  label: "BUZZ",  shirtColor: "#ca8a04", room: "Buzz",              deskEmoji: "📣",  roomEmoji: "📊" },
  mac:   { name: "mac",   label: "MAC",   shirtColor: "#92400e", room: "Mac",               deskEmoji: "🔧",  roomEmoji: "🛠️" },
  dale:  { name: "dale",  label: "DALE",  shirtColor: "#65a30d", room: "Dale",              deskEmoji: "🌽",  roomEmoji: "🌾" },
  rex:   { name: "rex",   label: "REX",   shirtColor: "#dc2626", room: "Rex",               deskEmoji: "🔐",  roomEmoji: "🖧" },
  karen: { name: "karen", label: "KAREN", shirtColor: "#db2777", room: "Karen",             deskEmoji: "📊",  roomEmoji: "📑" },
  cash:  { name: "cash",  label: "CASH",  shirtColor: "#b45309", room: "Cash",              deskEmoji: "📈",  roomEmoji: "🌾" },
};

// ─── Desk positions on 1200×780 floor ─────────────────────────────────────────
const DESK_POS: Record<AgentName, Pos> = {
  fred:  { x: 520, y: 80  },
  scout: { x: 80,  y: 300 },
  dusty: { x: 280, y: 300 },
  hugh:  { x: 480, y: 300 },
  teky:  { x: 680, y: 300 },
  buzz:  { x: 80,  y: 480 },
  mac:   { x: 280, y: 480 },
  dale:  { x: 480, y: 480 },
  rex:   { x: 680, y: 480 },
  karen: { x: 80,  y: 640 },
  cash:  { x: 280, y: 640 },
};

// ─── Zone layout on 1200×780 floor ────────────────────────────────────────────
const ZONES = [
  { label: "Conference",  emoji: "🏛️", x: 20,  y: 20,  w: 220, h: 180, border: "rgba(80,120,200,0.45)",  bg: "rgba(10,20,45,0.85)",  hasDesk: false },
  { label: "Fred's Office", emoji: "⭐", x: 260, y: 20,  w: 220, h: 180, border: "rgba(37,99,235,0.6)",   bg: "rgba(10,20,55,0.9)",   hasDesk: true  },
  { label: "Break Room",  emoji: "☕", x: 500, y: 20,  w: 180, h: 180, border: "rgba(80,120,200,0.4)",   bg: "rgba(10,20,45,0.9)",   hasDesk: false },
  { label: "Scout",       emoji: "🗺️", x: 20,  y: 240, w: 160, h: 160, border: "rgba(80,120,200,0.35)",  bg: "rgba(15,25,50,0.85)",  hasDesk: true  },
  { label: "Dusty",       emoji: "⚗️", x: 200, y: 240, w: 160, h: 160, border: "rgba(80,120,200,0.35)",  bg: "rgba(15,25,50,0.85)",  hasDesk: true  },
  { label: "Hugh",        emoji: "📋", x: 380, y: 240, w: 160, h: 160, border: "rgba(80,120,200,0.35)",  bg: "rgba(15,25,50,0.85)",  hasDesk: true  },
  { label: "Teky",        emoji: "🖥️", x: 560, y: 240, w: 160, h: 160, border: "rgba(80,120,200,0.35)",  bg: "rgba(15,25,50,0.85)",  hasDesk: true  },
  { label: "Buzz",        emoji: "📊", x: 20,  y: 420, w: 160, h: 160, border: "rgba(80,120,200,0.35)",  bg: "rgba(15,25,50,0.85)",  hasDesk: true  },
  { label: "Mac",         emoji: "🛠️", x: 200, y: 420, w: 160, h: 160, border: "rgba(120,80,20,0.5)",    bg: "rgba(20,12,5,0.9)",    hasDesk: true  },
  { label: "Dale",        emoji: "🌾", x: 380, y: 420, w: 160, h: 160, border: "rgba(80,120,200,0.35)",  bg: "rgba(15,25,50,0.85)",  hasDesk: true  },
  { label: "Rex",         emoji: "🖧",  x: 560, y: 420, w: 160, h: 160, border: "rgba(220,38,38,0.5)",    bg: "rgba(20,5,5,0.9)",     hasDesk: true  },
  { label: "Karen",       emoji: "📑", x: 20,  y: 600, w: 160, h: 140, border: "rgba(80,120,200,0.35)",  bg: "rgba(15,25,50,0.85)",  hasDesk: true  },
  { label: "Cash",        emoji: "🌾", x: 200, y: 600, w: 160, h: 140, border: "rgba(80,120,200,0.35)",  bg: "rgba(15,25,50,0.85)",  hasDesk: true  },
];

// ─── Mock Status (fallback) ────────────────────────────────────────────────────
const MOCK_STATUS: Record<AgentName, AgentStatus> = {
  fred: "working", scout: "working", dusty: "working", hugh: "idle",
  teky: "working", buzz: "idle",    mac: "idle",       dale: "idle",
  rex: "working",  karen: "idle",   cash: "working",
};

async function fetchAgentStatus(): Promise<Record<AgentName, AgentStatus>> {
  try {
    const res = await fetch("/api/agent-status");
    if (res.ok) return res.json();
  } catch (_) {/* fall through */}
  return MOCK_STATUS;
}

// ─── Status dot ────────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: AgentStatus }) {
  const color = status === "working" ? "#22c55e" : status === "idle" ? "#f97316" : "#ef4444";
  return (
    <div title={status} style={{
      width: 10, height: 10, borderRadius: "50%",
      backgroundColor: color, border: "1px solid rgba(255,255,255,0.4)",
      boxShadow: `0 0 6px ${color}`, flexShrink: 0,
    }} />
  );
}

// ─── Pixel Character ──────────────────────────────────────────────────────────
function PixelCharacter({ shirtColor, status, agentName, facingLeft }: {
  shirtColor: string; status: AgentStatus; agentName: string; facingLeft?: boolean;
}) {
  const isWorking = status === "working";
  const isIdle    = status === "idle";
  const charClass = isWorking ? "char-bob" : isIdle ? "char-bounce" : "char-offline";
  return (
    <div
      className={charClass}
      title={agentName}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
        opacity: status === "offline" ? 0.35 : 1,
        width: 16, flexShrink: 0,
        transform: facingLeft ? "scaleX(-1)" : "scaleX(1)",
      }}
    >
      {/* Head */}
      <div style={{ width: 10, height: 10, backgroundColor: "#f5c5a3", border: "1px solid #c49a7a", position: "relative" }}>
        <div style={{ position: "absolute", top: 3, left: 1, width: 2, height: 2, backgroundColor: "#222" }} />
        <div style={{ position: "absolute", top: 3, right: 1, width: 2, height: 2, backgroundColor: "#222" }} />
      </div>
      {/* Shirt */}
      <div style={{ width: 10, height: 8, backgroundColor: shirtColor, border: "1px solid rgba(0,0,0,0.3)" }} />
      {/* Legs */}
      <div style={{ display: "flex", gap: 1 }}>
        <div className={isIdle ? "leg-left" : ""} style={{ width: 4, height: 5, backgroundColor: "#374151", border: "1px solid #111" }} />
        <div className={isIdle ? "leg-right" : ""} style={{ width: 4, height: 5, backgroundColor: "#374151", border: "1px solid #111" }} />
      </div>
    </div>
  );
}

// ─── Desk Component ────────────────────────────────────────────────────────────
function Desk() {
  return (
    <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)" }}>
      {/* desk surface */}
      <div style={{ width: 80, height: 12, background: "#8B6914", borderRadius: 2 }} />
      {/* monitor */}
      <div style={{ width: 28, height: 22, background: "#333", margin: "-22px auto 0", borderRadius: 2, border: "2px solid #555" }}>
        <div style={{ width: 20, height: 14, background: "#1a9fff", margin: "4px auto", borderRadius: 1 }} />
      </div>
    </div>
  );
}

// ─── Conference Table ──────────────────────────────────────────────────────────
function ConferenceTable() {
  return (
    <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)" }}>
      <div style={{ width: 100, height: 44, background: "rgba(90,60,20,0.6)", border: "2px solid rgba(160,100,40,0.8)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 14 }}>📋</span>
      </div>
      <div style={{ fontSize: 8, color: "rgba(200,220,255,0.6)", fontFamily: "monospace", textAlign: "center", marginTop: 2 }}>Q1 Planning</div>
    </div>
  );
}

// ─── Break Room Furniture ──────────────────────────────────────────────────────
function BreakRoomFurniture() {
  return (
    <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10 }}>
      <span style={{ fontSize: 20 }}>☕</span>
      <span style={{ fontSize: 20 }}>📦</span>
      <span style={{ fontSize: 20 }}>🫧</span>
    </div>
  );
}

// ─── Status Bar ───────────────────────────────────────────────────────────────
function StatusBar({ statuses }: { statuses: Record<AgentName, AgentStatus> }) {
  const entries = Object.entries(statuses) as [AgentName, AgentStatus][];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(5,10,25,0.97)", borderTop: "1px solid rgba(80,120,200,0.4)", padding: "6px 16px", display: "flex", flexWrap: "wrap", gap: "10px 18px", zIndex: 100, alignItems: "center" }}>
      {entries.map(([id, status]) => {
        const cfg = AGENTS[id];
        const color = status === "working" ? "#22c55e" : status === "idle" ? "#f97316" : "#ef4444";
        return (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, boxShadow: `0 0 5px ${color}` }} />
            <span style={{ fontSize: 9, color: "rgba(200,220,255,0.85)", fontFamily: "monospace", letterSpacing: "0.05em" }}>{cfg.label}</span>
            <span style={{ fontSize: 9, color: "rgba(150,160,200,0.6)", fontFamily: "monospace" }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────────
const OFFICE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
.office-bg {
  background-color: #060d1f;
  background-image:
    linear-gradient(rgba(40,80,160,0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(40,80,160,0.07) 1px, transparent 1px);
  background-size: 24px 24px;
}
@keyframes bob { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-2px); } }
.char-bob { animation: bob 1.2s ease-in-out infinite; }
@keyframes bounce { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-3px); } }
.char-bounce { animation: bounce 0.8s steps(2) infinite; }
@keyframes leg-l { 0%,100% { transform:rotate(0deg); } 50% { transform:rotate(20deg); } }
@keyframes leg-r { 0%,100% { transform:rotate(0deg); } 50% { transform:rotate(-20deg); } }
.leg-left  { animation: leg-l 0.3s steps(2) infinite; transform-origin: top center; }
.leg-right { animation: leg-r 0.3s steps(2) infinite; transform-origin: top center; }
.char-offline { filter: grayscale(1); }
`;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OfficePage() {
  const [statuses, setStatuses] = useState<Record<AgentName, AgentStatus>>(MOCK_STATUS);
  const [positions, setPositions] = useState<Record<AgentName, Pos>>(() => {
    // initialise at desk positions
    const init = {} as Record<AgentName, Pos>;
    (Object.keys(DESK_POS) as AgentName[]).forEach((k) => { init[k] = { ...DESK_POS[k] }; });
    return init;
  });
  const [facingLeft, setFacingLeft] = useState<Record<AgentName, boolean>>(() => {
    const init = {} as Record<AgentName, boolean>;
    (Object.keys(DESK_POS) as AgentName[]).forEach((k) => { init[k] = false; });
    return init;
  });

  // fetch statuses
  useEffect(() => {
    fetchAgentStatus().then(setStatuses);
    const interval = setInterval(() => fetchAgentStatus().then(setStatuses), 30_000);
    return () => clearInterval(interval);
  }, []);

  // inject CSS
  useEffect(() => {
    const id = "office-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = OFFICE_CSS;
      document.head.appendChild(style);
    }
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  // wander logic — idle agents roam every 3500ms
  const statusesRef = useRef(statuses);
  statusesRef.current = statuses;

  useEffect(() => {
    const AGENTS_LIST = Object.keys(DESK_POS) as AgentName[];
    const timer = setInterval(() => {
      const currentStatuses = statusesRef.current;
      setPositions((prev) => {
        const next = { ...prev };
        AGENTS_LIST.forEach((id) => {
          if (currentStatuses[id] === "working") {
            next[id] = { ...DESK_POS[id] };
          } else {
            next[id] = {
              x: Math.random() * 1100 + 40,
              y: Math.random() * 680 + 40,
            };
          }
        });
        return next;
      });
      setFacingLeft((prev) => {
        const next = { ...prev };
        AGENTS_LIST.forEach((id) => {
          if (currentStatuses[id] !== "working") {
            next[id] = Math.random() > 0.5;
          } else {
            next[id] = false;
          }
        });
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="office-bg" style={{ minHeight: "100vh", padding: "16px 16px 60px", fontFamily: "monospace", userSelect: "none" }}>
      {/* Header */}
      <div style={{ marginBottom: 16, textAlign: "center" }}>
        <h1 style={{ fontSize: 12, fontFamily: "'Press Start 2P', monospace", color: "#7dd3fc", letterSpacing: "0.12em", textShadow: "0 0 10px rgba(125,211,252,0.6)", margin: 0 }}>
          🏢 B&amp;B Agrisales — AI Team HQ
        </h1>
        <p style={{ fontSize: 9, color: "rgba(150,170,220,0.6)", marginTop: 6, fontFamily: "monospace" }}>
          Fountain City, WI • Live Agent Dashboard
        </p>
      </div>

      {/* ── Office Floor Canvas ── */}
      <div style={{
        position: "relative",
        width: 1200,
        height: 780,
        margin: "0 auto",
        background: "rgba(8,16,38,0.95)",
        border: "2px solid rgba(80,120,200,0.4)",
        borderRadius: 12,
        overflow: "hidden",
      }}>
        {/* Floor grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(40,80,160,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(40,80,160,0.06) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }} />

        {/* ── Zone Boxes ── */}
        {ZONES.map((z) => (
          <div
            key={z.label}
            style={{
              position: "absolute",
              left: z.x, top: z.y, width: z.w, height: z.h,
              background: z.bg,
              border: `1px solid ${z.border}`,
              borderRadius: 8,
              overflow: "visible",  // never clip characters
            }}
          >
            {/* Zone label */}
            <div style={{ padding: "6px 8px", fontSize: 8, color: "rgba(180,210,255,0.65)", fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4 }}>
              {z.emoji} {z.label}
            </div>

            {/* Furniture */}
            {z.label === "Conference" && <ConferenceTable />}
            {z.label === "Break Room" && <BreakRoomFurniture />}
            {z.hasDesk && z.label !== "Conference" && z.label !== "Break Room" && <Desk />}
          </div>
        ))}

        {/* ── Agent Characters — all on the floor, not inside zones ── */}
        {(Object.keys(DESK_POS) as AgentName[]).map((id) => {
          const cfg = AGENTS[id];
          const status = statuses[id] ?? "offline";
          const pos = positions[id] ?? DESK_POS[id];
          return (
            <div
              key={id}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                transition: "left 2.5s ease-in-out, top 2.5s ease-in-out",
                zIndex: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                transform: "translate(-50%, -50%)",
              }}
            >
              <PixelCharacter
                shirtColor={cfg.shirtColor}
                status={status}
                agentName={id}
                facingLeft={facingLeft[id]}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <StatusDot status={status} />
                <span style={{ fontSize: 6, color: "rgba(200,220,255,0.8)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                  {cfg.label}
                </span>
              </div>
            </div>
          );
        })}

        {/* Corner decorations */}
        <div style={{ position: "absolute", bottom: 8, right: 8, fontSize: 20, opacity: 0.4, pointerEvents: "none" }}>🌱</div>
        <div style={{ position: "absolute", bottom: 8, left: 8, fontSize: 20, opacity: 0.4, pointerEvents: "none" }}>🌱</div>
      </div>

      <StatusBar statuses={statuses} />
    </div>
  );
}
