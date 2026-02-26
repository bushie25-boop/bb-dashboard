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

// "main" agentId = Fred
const AGENT_ID_MAP: Record<string, string> = {
  main: "fred",
};

type AgentStatus = "working" | "idle" | "offline";

// ─── GET /api/agent-status ────────────────────────────────────────────────────
app.get("/api/agent-status", (_req, res) => {
  const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  const now = Date.now();

  // All known agents — default offline
  const statuses: Record<string, AgentStatus> = {
    fred: "offline", scout: "offline", dusty: "offline", hugh: "offline",
    teky: "offline", buzz: "offline", mac: "offline",   dale: "offline",
    rex: "offline",  karen: "offline", cash: "offline",
  };

  try {
    const jobsRaw = fs.readFileSync(JOBS_FILE, "utf8");
    const { jobs } = JSON.parse(jobsRaw) as {
      jobs: Array<{ id: string; agentId: string; enabled: boolean }>;
    };

    // Build map: jobId → agentName
    for (const job of jobs) {
      if (!job.enabled) continue;
      const agentName = AGENT_ID_MAP[job.agentId] ?? job.agentId;
      if (!(agentName in statuses)) continue;

      const runsFile = path.join(RUNS_DIR, `${job.id}.jsonl`);
      if (!fs.existsSync(runsFile)) continue;

      // Read last line of the JSONL file efficiently
      const content = fs.readFileSync(runsFile, "utf8").trim();
      const lines = content.split("\n").filter(Boolean);
      if (lines.length === 0) continue;

      try {
        const lastRun = JSON.parse(lines[lines.length - 1]);
        const age = now - (lastRun.ts ?? 0);

        if (age < WINDOW_MS) {
          // Ran within 10 min → working
          statuses[agentName] = "working";
        } else {
          // Has run before but not recently → idle
          if (statuses[agentName] === "offline") {
            statuses[agentName] = "idle";
          }
        }
      } catch (_) {
        // bad JSON line — skip
      }
    }
  } catch (err) {
    console.error("[agent-status] error reading cron data:", err);
  }

  res.json(statuses);
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
    // Interpret the output: look for "running" keyword
    info.gateway = out.toLowerCase().includes("running") ? "running" : out.split("\n")[0] ?? "unknown";
    info.gatewayRaw = out;
  } catch (err: unknown) {
    info.gateway = "error";
    info.gatewayError = String(err);
  }

  res.json(info);
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`[bb-dashboard server] API running on http://localhost:${PORT}`);
});
