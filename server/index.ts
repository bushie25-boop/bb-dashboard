import express from "express";
import cors from "cors";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const app = express();
app.use(cors());
app.use(express.json());

const HOME = os.homedir();
const CRON_DIR = path.join(HOME, ".openclaw", "cron");
const JOBS_FILE = path.join(CRON_DIR, "jobs.json");
const RUNS_DIR = path.join(CRON_DIR, "runs");

type AgentStatus = "working" | "idle" | "offline";

// Map agentId → dashboard agent name
const AGENT_ID_MAP: Record<string, string> = {
  main:  "fred",
  scout: "scout",
  dusty: "dusty",
  coder: "teky",
  buzz:  "buzz",
  hugh:  "hugh",
  mac:   "mac",
  rex:   "rex",
  dale:  "dale",
  karen: "karen",
  cash:  "cash",
};

// All known dashboard agents
const ALL_AGENTS = ["fred","scout","dusty","teky","buzz","hugh","mac","rex","dale","karen","cash"];

// ─── GET /api/agent-status ────────────────────────────────────────────────────
app.get("/api/agent-status", (_req, res) => {
  const WORKING_MS = 15 * 60 * 1000;  // ran within 15 min  → working
  const IDLE_MS    = 12 * 60 * 60 * 1000; // ran within 12 h → idle
  const now = Date.now();

  // Start everyone offline
  const statuses: Record<string, AgentStatus> = {};
  for (const a of ALL_AGENTS) statuses[a] = "offline";

  // Track best (most recent) run per agent
  const bestAge: Record<string, number> = {};

  try {
    const jobsRaw = fs.readFileSync(JOBS_FILE, "utf8");
    const { jobs } = JSON.parse(jobsRaw) as {
      jobs: Array<{ id: string; agentId: string; enabled: boolean }>;
    };

    for (const job of jobs) {
      if (!job.enabled) continue;
      const agentName = AGENT_ID_MAP[job.agentId];
      if (!agentName) continue;

      const runsFile = path.join(RUNS_DIR, `${job.id}.jsonl`);
      if (!fs.existsSync(runsFile)) continue;

      const content = fs.readFileSync(runsFile, "utf8").trim();
      const lines = content.split("\n").filter(Boolean);
      if (lines.length === 0) continue;

      try {
        const lastRun = JSON.parse(lines[lines.length - 1]);
        const age = now - (lastRun.ts ?? 0);
        if (!(agentName in bestAge) || age < bestAge[agentName]) {
          bestAge[agentName] = age;
        }
      } catch { /* bad line */ }
    }
  } catch (err) {
    console.error("[agent-status] error:", err);
  }

  // Convert age → status
  for (const [agent, age] of Object.entries(bestAge)) {
    if (age < WORKING_MS)  statuses[agent] = "working";
    else if (age < IDLE_MS) statuses[agent] = "idle";
    else                   statuses[agent] = "offline";
  }

  res.json({ statuses, ts: now });
});

// ─── GET /api/system ──────────────────────────────────────────────────────────
app.get("/api/system", (_req, res) => {
  const info: Record<string, unknown> = {
    time: new Date().toISOString(),
    hostname: os.hostname(),
    platform: os.platform(),
    uptime: Math.floor(os.uptime()),
    freemem: os.freemem(),
    totalmem: os.totalmem(),
    gateway: "unknown",
  };

  try {
    const out = execSync("openclaw gateway status 2>&1", { timeout: 5000 }).toString().trim();
    info.gateway = out.toLowerCase().includes("running") ? "running" : out.split("\n")[0] ?? "unknown";
    info.gatewayRaw = out;
  } catch (err: unknown) {
    info.gateway = "error";
    info.gatewayError = String(err);
  }

  res.json(info);
});

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ═══════════════════════════════════════════════════════════════════════════════
// KANBAN
// ═══════════════════════════════════════════════════════════════════════════════
const WORKSPACE   = path.join(HOME, ".openclaw", "workspace");
const KANBAN_FILE = path.join(WORKSPACE, "kanban.json");

interface KanbanTask {
  id:          string;
  title:       string;
  description: string;
  assignee:    string;
  priority:    "low" | "med" | "high" | "urgent";
  column:      "Backlog" | "In Progress" | "Review" | "Done";
  createdAt:   string;
  updatedAt:   string;
}

function readKanban(): { tasks: KanbanTask[] } {
  try {
    if (!fs.existsSync(KANBAN_FILE)) {
      const empty = { tasks: [] };
      fs.writeFileSync(KANBAN_FILE, JSON.stringify(empty, null, 2));
      return empty;
    }
    return JSON.parse(fs.readFileSync(KANBAN_FILE, "utf8"));
  } catch { return { tasks: [] }; }
}

function writeKanban(data: { tasks: KanbanTask[] }) {
  fs.writeFileSync(KANBAN_FILE, JSON.stringify(data, null, 2));
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

app.get("/api/kanban", (_req, res) => res.json(readKanban()));

app.post("/api/kanban", (req, res) => {
  const data = readKanban();
  const now  = new Date().toISOString();
  const task: KanbanTask = {
    id:          genId(),
    title:       req.body.title       ?? "Untitled",
    description: req.body.description ?? "",
    assignee:    req.body.assignee    ?? "lee",
    priority:    req.body.priority    ?? "low",
    column:      req.body.column      ?? "Backlog",
    createdAt:   now,
    updatedAt:   now,
  };
  data.tasks.push(task);
  writeKanban(data);
  res.status(201).json(task);
});

app.patch("/api/kanban/:id", (req, res) => {
  const data = readKanban();
  const idx  = data.tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const updated = { ...data.tasks[idx], ...req.body, updatedAt: new Date().toISOString() };
  data.tasks[idx] = updated;
  writeKanban(data);
  res.json(updated);
});

app.delete("/api/kanban/:id", (req, res) => {
  const data = readKanban();
  const prev = data.tasks.length;
  data.tasks = data.tasks.filter(t => t.id !== req.params.id);
  writeKanban(data);
  res.json({ deleted: data.tasks.length < prev });
});

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════════════════════
const AGENT_REPORTS = [
  { agent: "Scout", emoji: "🔭", file: "agents/scout/scout-report-latest.md"  },
  { agent: "Dusty", emoji: "🌾", file: "agents/dusty/dusty-report-latest.md"  },
  { agent: "Dale",  emoji: "📈", file: "agents/dale/dale-report-latest.md"    },
  { agent: "Cash",  emoji: "💰", file: "agents/cash/cash-report-latest.md"    },
  { agent: "Rex",   emoji: "🔐", file: "agents/rex/rex-report-latest.md"      },
  { agent: "Karen", emoji: "📋", file: "agents/karen/karen-report-latest.md"  },
  { agent: "Hugh",  emoji: "🤖", file: "agents/hugh/hugh-report-latest.md"    },
];

app.get("/api/reports", (_req, res) => {
  const results = AGENT_REPORTS.map(({ agent, emoji, file }) => {
    const full = path.join(WORKSPACE, file);
    if (!fs.existsSync(full)) return { agent, emoji, content: "", mtime: null, exists: false };
    const stat    = fs.statSync(full);
    const content = fs.readFileSync(full, "utf8");
    return { agent, emoji, content, mtime: stat.mtime.toISOString(), exists: true };
  });
  res.json(results);
});

// ═══════════════════════════════════════════════════════════════════════════════
// FILE BROWSER
// ═══════════════════════════════════════════════════════════════════════════════
const SKIP_NAMES = new Set(["node_modules", ".git"]);
const MAX_DEPTH  = 4;
const MAX_FILE_BYTES = 50 * 1024;

interface FileNode {
  name: string; path: string; type: "file" | "dir";
  size?: number; mtime?: string; children?: FileNode[];
}

function buildTree(dir: string, rel: string, depth: number): FileNode[] {
  if (depth > MAX_DEPTH) return [];
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return []; }

  const nodes: FileNode[] = [];
  for (const e of entries) {
    if (e.name.startsWith(".") || SKIP_NAMES.has(e.name)) continue;
    const fullPath = path.join(dir, e.name);
    const relPath  = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      nodes.push({ name: e.name, path: relPath, type: "dir", children: buildTree(fullPath, relPath, depth + 1) });
    } else if (e.isFile()) {
      let stat: fs.Stats | undefined;
      try { stat = fs.statSync(fullPath); } catch { /* skip */ }
      nodes.push({ name: e.name, path: relPath, type: "file", size: stat?.size, mtime: stat?.mtime.toISOString() });
    }
  }
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

app.get("/api/files/tree", (_req, res) => res.json({ tree: buildTree(WORKSPACE, "", 0) }));

app.get("/api/files/content", (req, res) => {
  const rel = (req.query.path as string) ?? "";
  if (!rel || rel.includes("..") || path.isAbsolute(rel)) {
    res.status(400).json({ error: "Invalid path" }); return;
  }
  const full = path.resolve(path.join(WORKSPACE, rel));
  if (!full.startsWith(WORKSPACE)) { res.status(403).json({ error: "Forbidden" }); return; }
  if (!fs.existsSync(full)) { res.status(404).json({ error: "Not found" }); return; }
  const stat = fs.statSync(full);
  if (!stat.isFile()) { res.status(400).json({ error: "Not a file" }); return; }
  const buf       = fs.readFileSync(full);
  const truncated = buf.length > MAX_FILE_BYTES;
  const content   = buf.slice(0, MAX_FILE_BYTES).toString("utf8");
  res.json({ content, truncated, size: stat.size, mtime: stat.mtime.toISOString() });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT
// ═══════════════════════════════════════════════════════════════════════════════
const AUDIT_LATEST  = path.join(WORKSPACE, "agents", "karen", "audit-latest.json");
const AUDIT_HISTORY = path.join(WORKSPACE, "agents", "karen", "audit-history");

app.get("/api/audit", (_req, res) => {
  let latest = null;
  if (fs.existsSync(AUDIT_LATEST)) {
    try { latest = JSON.parse(fs.readFileSync(AUDIT_LATEST, "utf8")); } catch { /* ignore */ }
  }
  const history: Array<{ date: string; data: unknown }> = [];
  if (fs.existsSync(AUDIT_HISTORY)) {
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const f = path.join(AUDIT_HISTORY, `${dateStr}.json`);
      if (fs.existsSync(f)) {
        try { history.push({ date: dateStr, data: JSON.parse(fs.readFileSync(f, "utf8")) }); } catch { /* skip */ }
      }
    }
  }
  res.json({ latest, history });
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`[bb-dashboard server] API running on http://localhost:${PORT}`);
});
