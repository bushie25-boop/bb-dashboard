import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/office",  icon: "🏢", label: "Office HQ" },
  { to: "/kanban",  icon: "📋", label: "Kanban"    },
  { to: "/reports", icon: "📊", label: "Reports"   },
  { to: "/files",   icon: "📁", label: "Files"     },
  { to: "/audit",   icon: "🔍", label: "Audit"     },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#060d1f" }}>
      {/* ── Fixed sidebar ─────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 64,
        background: "rgba(5,10,25,0.98)",
        borderRight: "1px solid rgba(80,120,200,0.25)",
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: 16, gap: 4, zIndex: 300,
      }}>
        {/* Logo */}
        <div style={{
          fontSize: 22, marginBottom: 10,
          filter: "drop-shadow(0 0 8px rgba(125,211,252,0.5))",
        }}>🌾</div>

        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            style={({ isActive }) => ({
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "8px 4px", borderRadius: 8, width: 52, textDecoration: "none",
              background: isActive ? "rgba(37,99,235,0.2)" : "transparent",
              border: isActive ? "1px solid rgba(37,99,235,0.5)" : "1px solid transparent",
              gap: 3, cursor: "pointer",
              transition: "background 0.15s, border 0.15s",
            })}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{
              fontSize: 7, color: "rgba(150,180,255,0.7)",
              fontFamily: "monospace", textAlign: "center", lineHeight: 1.3,
            }}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* ── Main content area ──────────────────────────────────────────── */}
      <div style={{ marginLeft: 64, flex: 1, minHeight: "100vh" }}>
        {children}
      </div>
    </div>
  );
}
