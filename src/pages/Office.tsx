import { useEffect, useRef, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type AgentStatus = "working" | "idle" | "offline";
type AgentName =
  | "fred" | "scout" | "dusty" | "hugh" | "teky"
  | "buzz" | "mac"  | "dale"  | "rex"  | "karen" | "cash";

// ─── Floor dimensions ─────────────────────────────────────────────────────────
const FLOOR_W = 1200;
const FLOOR_H = 790;

// ─── Zone rectangles (absolute on floor) ──────────────────────────────────────
interface ZoneRect { x: number; y: number; w: number; h: number; }
const ZONES: Record<string, ZoneRect> = {
  conference: { x: 10,  y: 10,  w: 370, h: 205 },
  freds:      { x: 390, y: 10,  w: 380, h: 205 },
  breakroom:  { x: 780, y: 10,  w: 410, h: 205 },
  scout:      { x: 10,  y: 225, w: 285, h: 170 },
  dusty:      { x: 305, y: 225, w: 285, h: 170 },
  hugh:       { x: 600, y: 225, w: 285, h: 170 },
  teky:       { x: 895, y: 225, w: 295, h: 170 },
  buzz:       { x: 10,  y: 405, w: 285, h: 170 },
  mac:        { x: 305, y: 405, w: 285, h: 170 },
  dale:       { x: 600, y: 405, w: 285, h: 170 },
  rex:        { x: 895, y: 405, w: 295, h: 170 },
  karen:      { x: 10,  y: 585, w: 285, h: 195 },
  cash:       { x: 305, y: 585, w: 285, h: 195 },
  hallway:    { x: 600, y: 585, w: 590, h: 195 },
};

// ─── Agent config — work position is the character's absolute floor position ──
interface AgentCfg {
  label:      string;
  shirtColor: string;
  workX:      number; // top-left X of character sprite when at desk
  workY:      number; // top-left Y of character sprite when at desk
}

// workX = zoneX + (deskOffX + deskW/2) - charW/2
// workY = zoneY + deskOffY + deskH + 4
// standard desk: 120×18, deskOffX=82 → center@142; charW≈12 → workX = zoneX+136
// wide desk (fred): 160×18, deskOffX=110 → center@190; workX = zoneX+184
const AGENTS: Record<AgentName, AgentCfg> = {
  fred:  { label: "FRED",  shirtColor: "#2563eb", workX: 574,  workY: 122 },
  scout: { label: "SCOUT", shirtColor: "#16a34a", workX: 136,  workY: 337 },
  dusty: { label: "DUSTY", shirtColor: "#ea580c", workX: 431,  workY: 337 },
  hugh:  { label: "HUGH",  shirtColor: "#6b7280", workX: 726,  workY: 337 },
  teky:  { label: "TEKY",  shirtColor: "#9333ea", workX: 1028, workY: 337 },
  buzz:  { label: "BUZZ",  shirtColor: "#ca8a04", workX: 136,  workY: 517 },
  mac:   { label: "MAC",   shirtColor: "#92400e", workX: 431,  workY: 517 },
  dale:  { label: "DALE",  shirtColor: "#65a30d", workX: 726,  workY: 517 },
  rex:   { label: "REX",   shirtColor: "#dc2626", workX: 1028, workY: 517 },
  karen: { label: "KAREN", shirtColor: "#db2777", workX: 136,  workY: 717 },
  cash:  { label: "CASH",  shirtColor: "#b45309", workX: 431,  workY: 717 },
};

// ─── Mock / fetch status ───────────────────────────────────────────────────────
const MOCK_STATUS: Record<AgentName, AgentStatus> = {
  fred: "working", scout: "working", dusty: "working", hugh: "idle",
  teky: "working", buzz: "idle",    mac: "idle",       dale: "idle",
  rex:  "working", karen: "idle",   cash: "working",
};

async function fetchAgentStatus(): Promise<Record<AgentName, AgentStatus>> {
  try {
    const res = await fetch("/api/agent-status");
    if (res.ok) return res.json();
  } catch { /* fall through */ }
  return MOCK_STATUS;
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
@keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
.char-bob { animation: bob 1.2s ease-in-out infinite; }
@keyframes leg-l { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(20deg)} }
@keyframes leg-r { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-20deg)} }
.leg-left  { animation: leg-l 0.3s steps(2) infinite; transform-origin: top center; }
.leg-right { animation: leg-r 0.3s steps(2) infinite; transform-origin: top center; }
`;

// ─── Status dot ───────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: AgentStatus }) {
  const c = status === "working" ? "#22c55e" : status === "idle" ? "#f97316" : "#ef4444";
  return (
    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c,
      border: "1px solid rgba(255,255,255,0.4)", boxShadow: `0 0 5px ${c}` }} />
  );
}

// ─── Pixel-art desk (rendered INSIDE a zone div, coords relative to zone) ─────
function PixelDesk({ ox, oy, wide = false }: { ox: number; oy: number; wide?: boolean }) {
  const dW = wide ? 160 : 120;
  const dH = 18;
  const mW = 38;
  const mH = 26;
  const mOx = ox + (dW - mW) / 2;
  const mOy = oy - mH + 3;
  return (
    <>
      {/* Monitor */}
      <div style={{
        position: "absolute", left: mOx, top: mOy, width: mW, height: mH,
        background: "#4a4a4a", border: "2px solid #222",
        borderRadius: "3px 3px 0 0", boxSizing: "border-box",
      }}>
        {/* Screen */}
        <div style={{
          position: "absolute", left: 3, top: 3, right: 3, bottom: 5,
          background: "linear-gradient(160deg,#1e3a8a 50%,#3b82f6)",
          boxShadow: "0 0 5px rgba(59,130,246,0.7)",
        }}>
          <div style={{ position: "absolute", top: 2, left: 2, right: 2, height: 1, background: "rgba(255,255,255,0.2)" }} />
        </div>
        {/* Stand */}
        <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: 8, height: 5, background: "#333" }} />
      </div>
      {/* Desk surface */}
      <div style={{
        position: "absolute", left: ox, top: oy, width: dW, height: dH,
        background: "linear-gradient(180deg,#9b6543,#6b3e26)",
        border: "2px solid #a87050",
        borderRadius: 2,
        boxShadow: "0 3px 0 #3a1e0f",
        boxSizing: "border-box",
      }} />
    </>
  );
}

// ─── Pixel character (absolutely positioned on the floor canvas) ───────────────
interface CharPos { x: number; y: number; facingLeft: boolean; }

function PixelCharacter({ shirtColor, status, label, pos }: {
  shirtColor: string;
  status: AgentStatus;
  label: string;
  pos: CharPos;
}) {
  const isWorking = status === "working";
  const isIdle    = status === "idle";
  return (
    <div style={{
      position: "absolute",
      left: pos.x,
      top: pos.y,
      transition: "left 2s ease, top 2s ease",
      zIndex: 20,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      pointerEvents: "none",
    }}>
      {/* Sprite — flips horizontally when moving left */}
      <div
        className={isWorking ? "char-bob" : ""}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          opacity: status === "offline" ? 0.35 : 1,
          transform: pos.facingLeft ? "scaleX(-1)" : undefined,
        }}
      >
        {/* Head */}
        <div style={{ width: 10, height: 10, backgroundColor: "#f5c5a3", border: "1px solid #c49a7a", position: "relative" }}>
          <div style={{ position: "absolute", top: 3, left: 1,  width: 2, height: 2, backgroundColor: "#222" }} />
          <div style={{ position: "absolute", top: 3, right: 1, width: 2, height: 2, backgroundColor: "#222" }} />
        </div>
        {/* Body */}
        <div style={{ width: 12, height: 8, backgroundColor: shirtColor, border: "1px solid rgba(0,0,0,0.35)" }} />
        {/* Legs */}
        <div style={{ display: "flex", gap: 1 }}>
          <div className={isIdle ? "leg-left"  : ""} style={{ width: 4, height: 5, backgroundColor: "#374151", border: "1px solid #111" }} />
          <div className={isIdle ? "leg-right" : ""} style={{ width: 4, height: 5, backgroundColor: "#374151", border: "1px solid #111" }} />
        </div>
      </div>
      {/* Name tag — always upright (outside the flipped div) */}
      <div style={{
        fontSize: 5,
        color: "rgba(200,220,255,0.95)",
        fontFamily: "'Press Start 2P', monospace",
        whiteSpace: "nowrap",
        marginTop: 2,
        textShadow: "0 1px 3px #000, 0 0 8px rgba(0,0,0,0.9)",
        transform: pos.facingLeft ? "scaleX(-1)" : undefined,
      }}>
        {label}
      </div>
    </div>
  );
}

// ─── Status bar ───────────────────────────────────────────────────────────────
function StatusBar({ statuses }: { statuses: Record<AgentName, AgentStatus> }) {
  const entries = Object.entries(statuses) as [AgentName, AgentStatus][];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(5,10,25,0.97)", borderTop: "1px solid rgba(80,120,200,0.4)",
      padding: "6px 16px", display: "flex", flexWrap: "wrap", gap: "10px 18px",
      zIndex: 100, alignItems: "center",
    }}>
      {entries.map(([id, status]) => {
        const cfg = AGENTS[id];
        const c = status === "working" ? "#22c55e" : status === "idle" ? "#f97316" : "#ef4444";
        return (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c, boxShadow: `0 0 5px ${c}` }} />
            <span style={{ fontSize: 9, color: "rgba(200,220,255,0.85)", fontFamily: "monospace", letterSpacing: "0.05em" }}>{cfg.label}</span>
            <span style={{ fontSize: 9, color: "rgba(150,160,200,0.6)", fontFamily: "monospace" }}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Helper: shared zone style ────────────────────────────────────────────────
function zoneStyle(z: ZoneRect, extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    position: "absolute", left: z.x, top: z.y, width: z.w, height: z.h,
    background: "rgba(15,25,50,0.85)",
    border: "1px solid rgba(80,120,200,0.35)",
    borderRadius: 8, boxSizing: "border-box",
    ...extra,
  };
}

const labelBase: React.CSSProperties = {
  position: "absolute", top: 8, left: 0, right: 0, textAlign: "center",
  fontSize: 7, color: "rgba(180,210,255,0.7)",
  fontFamily: "'Press Start 2P', monospace", letterSpacing: "0.04em",
  pointerEvents: "none",
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OfficePage() {
  const [statuses, setStatuses] = useState<Record<AgentName, AgentStatus>>(MOCK_STATUS);

  // Character positions on the floor (absolute x,y + facing direction)
  const [positions, setPositions] = useState<Record<AgentName, CharPos>>(() => {
    const p = {} as Record<AgentName, CharPos>;
    for (const [k, cfg] of Object.entries(AGENTS)) {
      p[k as AgentName] = { x: cfg.workX, y: cfg.workY, facingLeft: false };
    }
    return p;
  });

  // Keep a ref so the movement interval always reads latest statuses
  const statusRef = useRef(statuses);
  useEffect(() => { statusRef.current = statuses; }, [statuses]);

  // Fetch agent statuses
  useEffect(() => {
    fetchAgentStatus().then(setStatuses);
    const id = setInterval(() => fetchAgentStatus().then(setStatuses), 30_000);
    return () => clearInterval(id);
  }, []);

  // Inject CSS
  useEffect(() => {
    const eid = "office-styles";
    if (!document.getElementById(eid)) {
      const el = document.createElement("style");
      el.id = eid; el.textContent = OFFICE_CSS;
      document.head.appendChild(el);
    }
    return () => { document.getElementById(eid)?.remove(); };
  }, []);

  // Idle wandering — one interval, always uses latest statuses via ref
  useEffect(() => {
    const tick = () => {
      const curr = statusRef.current;
      setPositions(prev => {
        const next = { ...prev };
        for (const [name, status] of Object.entries(curr)) {
          const id = name as AgentName;
          const cfg = AGENTS[id];
          if (status === "working") {
            // Return to desk
            next[id] = {
              x: cfg.workX, y: cfg.workY,
              facingLeft: prev[id].x > cfg.workX,
            };
          } else if (status === "idle") {
            // Wander to a random spot on the floor
            const nx = 20  + Math.random() * (FLOOR_W - 60);
            const ny = 30  + Math.random() * (FLOOR_H - 80);
            next[id] = { x: nx, y: ny, facingLeft: nx < prev[id].x };
          }
          // offline: don't move
        }
        return next;
      });
    };
    const id = setInterval(tick, 3500);
    return () => clearInterval(id);
  }, []); // runs once; reads statuses via ref

  return (
    <div className="office-bg" style={{ minHeight: "100vh", padding: "16px 16px 64px", fontFamily: "monospace", userSelect: "none", overflowX: "auto" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12, textAlign: "center" }}>
        <h1 style={{ fontSize: 12, fontFamily: "'Press Start 2P', monospace", color: "#7dd3fc", letterSpacing: "0.12em", textShadow: "0 0 10px rgba(125,211,252,0.6)", margin: 0 }}>
          🏢 B&amp;B Agrisales — AI Team HQ
        </h1>
        <p style={{ fontSize: 9, color: "rgba(150,170,220,0.6)", marginTop: 6, fontFamily: "monospace" }}>
          Fountain City, WI • Live Agent Dashboard
        </p>
      </div>

      {/* ── Office Floor Canvas ────────────────────────────────────────────── */}
      <div style={{ position: "relative", width: FLOOR_W, height: FLOOR_H, margin: "0 auto" }}>

        {/* ──────────────────────────────────────────────────────────────────
            ZONE LAYER — decorative only, NO characters inside
        ────────────────────────────────────────────────────────────────── */}

        {/* Conference Room */}
        <div style={zoneStyle(ZONES.conference)}>
          <div style={labelBase}>🏛️ CONFERENCE ROOM</div>
          {/* Oval table */}
          <div style={{
            position: "absolute", top: 65, left: "50%", transform: "translateX(-50%)",
            width: 200, height: 85,
            background: "rgba(90,60,20,0.65)", border: "2px solid rgba(160,100,40,0.8)",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 14 }}>📋</span>
          </div>
          {/* Chairs around table */}
          {[[-95,10],[100,10],[-95,65],[100,65],[-25,-20],[-25,95]].map(([cx,cy],i) => (
            <div key={i} style={{
              position: "absolute", left: "50%", top: 95,
              marginLeft: cx - 7, marginTop: cy - 7,
              width: 14, height: 14,
              background: "rgba(60,40,20,0.8)", border: "1px solid rgba(120,80,30,0.7)",
              borderRadius: 3,
            }} />
          ))}
          <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", fontSize: 6, color: "rgba(150,180,150,0.6)", fontFamily: "monospace" }}>
            Q1 Planning — AgriChem v2
          </div>
        </div>

        {/* Fred's Office */}
        <div style={zoneStyle(ZONES.freds, { border: "1px solid rgba(37,99,235,0.6)", background: "rgba(10,20,55,0.9)" })}>
          <div style={{ ...labelBase, color: "rgba(200,220,255,0.8)" }}>⭐ FRED'S OFFICE</div>
          <PixelDesk ox={110} oy={90} wide />
          <span style={{ position: "absolute", bottom: 12, right: 18, fontSize: 22, opacity: 0.7 }}>🌿</span>
          <div style={{ position: "absolute", top: 8, right: 8 }}><StatusDot status={statuses.fred} /></div>
        </div>

        {/* Break Room */}
        <div style={zoneStyle(ZONES.breakroom)}>
          <div style={labelBase}>☕ BREAK ROOM</div>
          <div style={{ position: "absolute", top: 50, left: 30, display: "flex", gap: 10, alignItems: "flex-end" }}>
            <span style={{ fontSize: 28 }}>☕</span>
            <span style={{ fontSize: 22 }}>📦</span>
            <span style={{ fontSize: 22 }}>🫧</span>
            <span style={{ fontSize: 18 }}>🍪</span>
          </div>
          {/* Counter */}
          <div style={{
            position: "absolute", bottom: 28, left: 20, right: 20, height: 22,
            background: "linear-gradient(180deg,#9b6543,#6b3e26)",
            border: "2px solid #a87050", borderRadius: 3, boxShadow: "0 3px 0 #3a1e0f",
          }} />
          <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", fontSize: 6, color: "rgba(150,200,150,0.7)", fontFamily: "monospace" }}>
            💧 Water Cooler
          </div>
        </div>

        {/* ── Row 2: Scout, Dusty, Hugh, Teky ───────────────────────────── */}
        {(["scout","dusty","hugh"] as const).map(id => (
          <div key={id} style={zoneStyle(ZONES[id])}>
            <div style={labelBase}>{AGENTS[id].label}</div>
            <PixelDesk ox={82} oy={95} />
            <div style={{ position: "absolute", top: 8, right: 8 }}><StatusDot status={statuses[id]} /></div>
          </div>
        ))}
        <div style={zoneStyle(ZONES.teky, { border: "1px solid rgba(147,51,234,0.5)", background: "rgba(15,5,30,0.85)" })}>
          <div style={{ ...labelBase, color: "rgba(196,181,253,0.8)" }}>💻 TEKY</div>
          <PixelDesk ox={87} oy={95} />
          <div style={{ position: "absolute", top: 8, right: 8 }}><StatusDot status={statuses.teky} /></div>
        </div>

        {/* ── Row 3: Buzz, Mac, Dale, Rex ───────────────────────────────── */}
        {(["buzz","dale"] as const).map(id => (
          <div key={id} style={zoneStyle(ZONES[id])}>
            <div style={labelBase}>{AGENTS[id].label}</div>
            <PixelDesk ox={82} oy={95} />
            <div style={{ position: "absolute", top: 8, right: 8 }}><StatusDot status={statuses[id]} /></div>
          </div>
        ))}

        {/* Mac / Garage */}
        <div style={zoneStyle(ZONES.mac, { border: "1px solid rgba(120,80,20,0.5)", background: "rgba(20,12,5,0.85)" })}>
          <div style={{ ...labelBase, color: "rgba(251,191,36,0.7)" }}>🔧 MAC / GARAGE</div>
          {/* Workbench (no monitor — it's a garage) */}
          <div style={{ position: "absolute", left: 40, top: 55, display: "flex", gap: 6 }}>
            <span style={{ fontSize: 16 }}>🔧</span>
            <span style={{ fontSize: 16 }}>🔩</span>
            <span style={{ fontSize: 16 }}>⚙️</span>
          </div>
          <div style={{
            position: "absolute", left: 30, top: 95, width: 220, height: 22,
            background: "linear-gradient(180deg,#78350f,#451a03)",
            border: "2px solid #92400e", borderRadius: 2, boxShadow: "0 3px 0 #1c0a00", boxSizing: "border-box",
          }} />
          <div style={{ position: "absolute", top: 8, right: 8 }}><StatusDot status={statuses.mac} /></div>
        </div>

        {/* Rex / Servers */}
        <div style={zoneStyle(ZONES.rex, { border: "1px solid rgba(220,38,38,0.5)", background: "rgba(20,5,5,0.85)" })}>
          <div style={{ ...labelBase, color: "rgba(252,165,165,0.75)" }}>🔐 REX / SERVERS</div>
          {/* Server rack pair */}
          {[0,1].map(i => (
            <div key={i} style={{
              position: "absolute", left: 50 + i * 70, top: 36,
              width: 55, height: 115,
              background: "rgba(25,8,8,0.95)", border: "1px solid rgba(180,30,30,0.45)",
              borderRadius: 3, padding: 4, boxSizing: "border-box",
            }}>
              {[0,1,2,3,4].map(j => (
                <div key={j} style={{
                  height: 14, marginBottom: 2,
                  background: "rgba(40,12,12,0.9)", border: "1px solid rgba(100,20,20,0.5)",
                  borderRadius: 1, display: "flex", alignItems: "center", padding: "0 3px", gap: 3,
                }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: (i+j)%3===1?"#f97316":"#22c55e", boxShadow: `0 0 3px ${(i+j)%3===1?"#f97316":"#22c55e"}` }} />
                  <div style={{ flex: 1, height: 2, background: "rgba(80,80,80,0.5)", borderRadius: 1 }} />
                </div>
              ))}
            </div>
          ))}
          <div style={{ position: "absolute", top: 8, right: 8 }}><StatusDot status={statuses.rex} /></div>
        </div>

        {/* ── Bottom row: Karen, Cash, Hallway ──────────────────────────── */}
        {(["karen","cash"] as const).map(id => (
          <div key={id} style={zoneStyle(ZONES[id])}>
            <div style={labelBase}>{AGENTS[id].label}</div>
            <PixelDesk ox={82} oy={110} />
            <div style={{ position: "absolute", top: 8, right: 8 }}><StatusDot status={statuses[id]} /></div>
          </div>
        ))}

        {/* Hallway / Common Area */}
        <div style={{
          ...zoneStyle(ZONES.hallway),
          background: "rgba(8,18,40,0.65)",
          border: "1px dashed rgba(60,90,160,0.3)",
        }}>
          <div style={labelBase}>🚶 HALLWAY / COMMON AREA</div>
          <div style={{ position: "absolute", bottom: 18, left: 20, display: "flex", gap: 18, alignItems: "center" }}>
            <span style={{ fontSize: 22 }}>🪴</span>
            <span style={{ fontSize: 18 }}>📌</span>
            <span style={{ fontSize: 22 }}>🗃️</span>
            <span style={{ fontSize: 8, color: "rgba(150,180,255,0.4)", fontFamily: "monospace" }}>Staff notices &amp; bulletin board</span>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            CHARACTER LAYER — floats above ALL zones, free to walk anywhere
        ────────────────────────────────────────────────────────────────── */}
        {(Object.keys(AGENTS) as AgentName[]).map(id => (
          <PixelCharacter
            key={id}
            shirtColor={AGENTS[id].shirtColor}
            status={statuses[id]}
            label={AGENTS[id].label}
            pos={positions[id]}
          />
        ))}
      </div>

      {/* Corner plants */}
      <div style={{ position: "fixed", bottom: 52, left: 8, fontSize: 24, opacity: 0.4, pointerEvents: "none" }}>🌱</div>
      <div style={{ position: "fixed", bottom: 52, right: 8, fontSize: 24, opacity: 0.4, pointerEvents: "none" }}>🌱</div>

      <StatusBar statuses={statuses} />
    </div>
  );
}
