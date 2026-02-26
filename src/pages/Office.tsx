import { useEffect, useState } from "react";

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

// ─── Agent Configs ─────────────────────────────────────────────────────────────
const AGENTS: Record<AgentName, AgentConfig> = {
  fred:  { name: "fred",  label: "FRED",  shirtColor: "#2563eb", room: "Fred's Office",     deskEmoji: "🖥️",  roomEmoji: "🌿" },
  scout: { name: "scout", label: "SCOUT", shirtColor: "#16a34a", room: "Scout's Desk",      deskEmoji: "🌍",  roomEmoji: "🗺️" },
  dusty: { name: "dusty", label: "DUSTY", shirtColor: "#ea580c", room: "Dusty's Desk",      deskEmoji: "🧪",  roomEmoji: "⚗️" },
  hugh:  { name: "hugh",  label: "HUGH",  shirtColor: "#6b7280", room: "HR Office",         deskEmoji: "🗄️",  roomEmoji: "📋" },
  teky:  { name: "teky",  label: "TEKY",  shirtColor: "#9333ea", room: "Dev Station",       deskEmoji: "💻",  roomEmoji: "🖥️" },
  buzz:  { name: "buzz",  label: "BUZZ",  shirtColor: "#ca8a04", room: "Marketing HQ",      deskEmoji: "📣",  roomEmoji: "📊" },
  mac:   { name: "mac",   label: "MAC",   shirtColor: "#92400e", room: "Shop / Garage",     deskEmoji: "🔧",  roomEmoji: "🛠️" },
  dale:  { name: "dale",  label: "DALE",  shirtColor: "#65a30d", room: "Agronomy Desk",     deskEmoji: "🌽",  roomEmoji: "🌾" },
  rex:   { name: "rex",   label: "REX",   shirtColor: "#dc2626", room: "Server Room",       deskEmoji: "🔐",  roomEmoji: "🖧" },
  karen: { name: "karen", label: "KAREN", shirtColor: "#db2777", room: "Audit Corner",      deskEmoji: "📊",  roomEmoji: "📑" },
  cash:  { name: "cash",  label: "CASH",  shirtColor: "#b45309", room: "Grain Market Desk", deskEmoji: "📈",  roomEmoji: "🌾" },
};

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
function PixelCharacter({ shirtColor, status, agentName }: {
  shirtColor: string; status: AgentStatus; agentName: string;
}) {
  const isWorking = status === "working";
  const isIdle    = status === "idle";
  const charClass = isWorking ? "char-bob" : isIdle ? "char-wander" : "char-offline";
  return (
    <div className={charClass} title={agentName} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
      opacity: status === "offline" ? 0.35 : 1, position: "relative", width: 16, flexShrink: 0,
    }}>
      <div style={{ width: 10, height: 10, backgroundColor: "#f5c5a3", border: "1px solid #c49a7a", imageRendering: "pixelated", position: "relative" }}>
        <div style={{ position: "absolute", top: 3, left: 1, width: 2, height: 2, backgroundColor: "#222" }} />
        <div style={{ position: "absolute", top: 3, right: 1, width: 2, height: 2, backgroundColor: "#222" }} />
      </div>
      <div style={{ width: 10, height: 8, backgroundColor: shirtColor, border: "1px solid rgba(0,0,0,0.3)" }} />
      <div style={{ display: "flex", gap: 1 }}>
        <div className={isIdle ? "leg-left" : ""} style={{ width: 4, height: 5, backgroundColor: "#374151", border: "1px solid #111" }} />
        <div className={isIdle ? "leg-right" : ""} style={{ width: 4, height: 5, backgroundColor: "#374151", border: "1px solid #111" }} />
      </div>
    </div>
  );
}

// ─── Room Card ────────────────────────────────────────────────────────────────
function RoomCard({ title, emoji, deskEmoji, agent, status, shirtColor, children, style }: {
  title: string; emoji: string; deskEmoji?: string; agent?: AgentName;
  status?: AgentStatus; shirtColor?: string; children?: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "rgba(15,25,50,0.85)", border: "1px solid rgba(80,120,200,0.35)",
      borderRadius: 8, padding: "8px 10px 10px", position: "relative",
      minHeight: 110, display: "flex", flexDirection: "column", gap: 4, ...style,
    }}>
      {status && <div style={{ position: "absolute", top: 8, right: 8 }}><StatusDot status={status} /></div>}
      <div style={{ fontSize: 9, color: "rgba(180,210,255,0.65)", fontFamily: "'Press Start 2P', monospace", lineHeight: 1.4 }}>
        {emoji} {title}
      </div>
      {deskEmoji && <div style={{ fontSize: 18, lineHeight: 1 }}>{deskEmoji}</div>}
      {agent && status && shirtColor && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginTop: "auto" }}>
          <PixelCharacter shirtColor={shirtColor} status={status} agentName={agent} />
          <span style={{ fontSize: 7, color: "rgba(200,220,255,0.7)", fontFamily: "monospace" }}>
            {agent.toUpperCase()}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Conference Room ──────────────────────────────────────────────────────────
function ConferenceRoom() {
  return (
    <div style={{ background: "rgba(10,20,45,0.9)", border: "1px solid rgba(80,120,200,0.4)", borderRadius: 8, padding: "8px 10px", minHeight: 110, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 9, color: "rgba(180,210,255,0.65)", fontFamily: "'Press Start 2P', monospace" }}>🏛️ Conference Room</div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 80, height: 36, background: "rgba(90,60,20,0.6)", border: "2px solid rgba(160,100,40,0.8)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11 }}>📋</span>
          </div>
          {[[-10,-20],[30,-20],[70,-20],[-10,30],[30,30],[70,30]].map(([x,y],i) => (
            <div key={i} style={{ position: "absolute", left: x, top: y, width: 10, height: 10, background: "rgba(60,40,20,0.8)", border: "1px solid rgba(120,80,30,0.8)", borderRadius: 2 }} />
          ))}
        </div>
      </div>
      <div style={{ fontSize: 8, background: "rgba(240,240,255,0.08)", border: "1px solid rgba(180,180,255,0.3)", borderRadius: 3, padding: "2px 4px", color: "rgba(200,220,255,0.6)", fontFamily: "monospace" }}>
        🖊️ Q1 Planning — AgriChem v2
      </div>
    </div>
  );
}

// ─── Break Room ───────────────────────────────────────────────────────────────
function BreakRoom() {
  return (
    <div style={{ background: "rgba(10,20,45,0.9)", border: "1px solid rgba(80,120,200,0.4)", borderRadius: 8, padding: "8px 10px", minHeight: 110, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 9, color: "rgba(180,210,255,0.65)", fontFamily: "'Press Start 2P', monospace" }}>☕ Break Room</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
        <span style={{ fontSize: 20 }}>☕</span>
        <span style={{ fontSize: 20 }}>📦</span>
        <span style={{ fontSize: 20 }}>🫧</span>
      </div>
      <div style={{ fontSize: 8, color: "rgba(150,200,150,0.7)", marginTop: "auto", fontFamily: "monospace" }}>💧 Water Cooler</div>
    </div>
  );
}

// ─── Server Closet ────────────────────────────────────────────────────────────
function ServerCloset() {
  return (
    <div style={{ background: "rgba(20,8,8,0.9)", border: "1px solid rgba(200,40,40,0.35)", borderRadius: 8, padding: "8px 10px", minHeight: 90, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 9, color: "rgba(255,140,140,0.7)", fontFamily: "'Press Start 2P', monospace" }}>🔌 Server Closet</div>
      {[0,1,2].map((i) => (
        <div key={i} style={{ height: 8, background: "rgba(30,20,20,0.9)", border: "1px solid rgba(100,20,20,0.7)", borderRadius: 2, display: "flex", alignItems: "center", paddingLeft: 4, gap: 3 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: i===0?"#22c55e":i===1?"#f97316":"#22c55e", boxShadow:`0 0 4px ${i===1?"#f97316":"#22c55e"}` }} />
          <div style={{ flex: 1, height: 2, background: "rgba(80,80,80,0.5)", borderRadius: 1 }} />
        </div>
      ))}
    </div>
  );
}

// ─── Parking Lot ─────────────────────────────────────────────────────────────
function ParkingLot() {
  return (
    <div style={{ background: "rgba(10,15,10,0.7)", border: "1px dashed rgba(80,100,80,0.4)", borderRadius: 8, padding: "8px 10px", minHeight: 90, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 9, color: "rgba(120,160,120,0.6)", fontFamily: "'Press Start 2P', monospace" }}>🚗 Lot</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {["🚛","🚐","🚗"].map((v,i) => <span key={i} style={{ fontSize: 16 }}>{v}</span>)}
      </div>
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
        const color = status==="working"?"#22c55e":status==="idle"?"#f97316":"#ef4444";
        return (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, boxShadow: `0 0 5px ${color}` }} />
            <span style={{ fontSize: 9, color: "rgba(200,220,255,0.85)", fontFamily: "monospace", letterSpacing: "0.05em" }}>{cfg.label}</span>
            <span style={{ fontSize: 9, color: "rgba(150,160,200,0.6)", fontFamily: "monospace" }}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── CSS Keyframes ────────────────────────────────────────────────────────────
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
@keyframes wander {
  0%   { transform:translate(0px,0px); } 20% { transform:translate(8px,-6px); }
  40%  { transform:translate(-5px,-10px); } 60% { transform:translate(12px,4px); }
  80%  { transform:translate(-8px,2px); } 100% { transform:translate(0px,0px); }
}
.char-wander { animation: wander 5s ease-in-out infinite; }
@keyframes leg-l { 0%,100% { transform:rotate(0deg); } 50% { transform:rotate(20deg); } }
@keyframes leg-r { 0%,100% { transform:rotate(0deg); } 50% { transform:rotate(-20deg); } }
.leg-left  { animation: leg-l 0.3s steps(2) infinite; transform-origin: top center; }
.leg-right { animation: leg-r 0.3s steps(2) infinite; transform-origin: top center; }
.char-offline { filter: grayscale(1); }
`;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OfficePage() {
  const [statuses, setStatuses] = useState<Record<AgentName, AgentStatus>>(MOCK_STATUS);

  useEffect(() => {
    fetchAgentStatus().then(setStatuses);
    const interval = setInterval(() => fetchAgentStatus().then(setStatuses), 30_000);
    return () => clearInterval(interval);
  }, []);

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

      {/* TOP ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <ConferenceRoom />
        <RoomCard title="Fred's Corner Office" emoji="⭐" deskEmoji="🖥️" agent="fred" status={statuses.fred} shirtColor={AGENTS.fred.shirtColor} style={{ border: "1px solid rgba(37,99,235,0.6)", background: "rgba(10,20,55,0.9)" }}>
          <span style={{ fontSize: 16, position: "absolute", bottom: 8, right: 10 }}>🌿</span>
        </RoomCard>
        <BreakRoom />
      </div>

      {/* MIDDLE ROW 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        {(["scout","dusty","hugh","teky"] as AgentName[]).map((id) => {
          const cfg = AGENTS[id];
          return <RoomCard key={id} title={cfg.room} emoji={cfg.roomEmoji} deskEmoji={cfg.deskEmoji} agent={id} status={statuses[id]} shirtColor={cfg.shirtColor} />;
        })}
      </div>

      {/* MIDDLE ROW 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        {(["buzz","mac","dale","rex"] as AgentName[]).map((id) => {
          const cfg = AGENTS[id];
          return <RoomCard key={id} title={cfg.room} emoji={cfg.roomEmoji} deskEmoji={cfg.deskEmoji} agent={id} status={statuses[id]} shirtColor={cfg.shirtColor}
            style={id==="rex"?{border:"1px solid rgba(220,38,38,0.5)",background:"rgba(20,5,5,0.9)"}:id==="mac"?{border:"1px solid rgba(120,80,20,0.5)",background:"rgba(20,12,5,0.9)"}:{}} />;
        })}
      </div>

      {/* BOTTOM ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
        {(["karen","cash"] as AgentName[]).map((id) => {
          const cfg = AGENTS[id];
          return <RoomCard key={id} title={cfg.room} emoji={cfg.roomEmoji} deskEmoji={cfg.deskEmoji} agent={id} status={statuses[id]} shirtColor={cfg.shirtColor} />;
        })}
        <ParkingLot />
        <ServerCloset />
      </div>

      {/* Corner plants */}
      <div style={{ position: "fixed", bottom: 52, left: 8, fontSize: 24, opacity: 0.5, pointerEvents: "none" }}>🌱</div>
      <div style={{ position: "fixed", bottom: 52, right: 8, fontSize: 24, opacity: 0.5, pointerEvents: "none" }}>🌱</div>

      <StatusBar statuses={statuses} />
    </div>
  );
}
