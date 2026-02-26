import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";

interface TreeNode {
  name:     string;
  path:     string;  // relative to workspace
  type:     "file" | "dir";
  size?:    number;
  mtime?:   string;
  children?: TreeNode[];
}

interface FileContent {
  content:   string;
  truncated: boolean;
  size:      number;
  mtime:     string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Tree node component ───────────────────────────────────────────────────────
function TreeItem({ node, depth, selected, onSelect }: {
  node:     TreeNode;
  depth:    number;
  selected: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 1);

  if (node.type === "dir") {
    return (
      <div>
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 6px", paddingLeft: 8 + depth * 14,
            cursor: "pointer", borderRadius: 4, fontSize: 12,
            color: "rgba(180,210,255,0.8)",
            userSelect: "none",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ fontSize: 10, color: "rgba(120,150,200,0.6)", minWidth: 10 }}>
            {open ? "▼" : "▶"}
          </span>
          <span style={{ fontSize: 14 }}>{open ? "📂" : "📁"}</span>
          <span>{node.name}</span>
        </div>
        {open && node.children?.map(child => (
          <TreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            selected={selected}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  const isSelected = selected === node.path;
  const isMd = node.name.endsWith(".md");
  const isJson = node.name.endsWith(".json");
  const fileIcon = isMd ? "📝" : isJson ? "📊" : "📄";

  return (
    <div
      onClick={() => onSelect(node.path)}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "3px 6px", paddingLeft: 8 + depth * 14,
        cursor: "pointer", borderRadius: 4, fontSize: 12,
        background: isSelected ? "rgba(37,99,235,0.2)" : "transparent",
        color: isSelected ? "#93c5fd" : "rgba(180,210,255,0.7)",
        userSelect: "none",
      }}
      onMouseEnter={e => {
        if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={e => {
        if (!isSelected) e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ minWidth: 10 }} />
      <span style={{ fontSize: 13 }}>{fileIcon}</span>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {node.name}
      </span>
      {node.size !== undefined && (
        <span style={{ fontSize: 9, color: "rgba(120,140,180,0.5)", whiteSpace: "nowrap" }}>
          {formatSize(node.size)}
        </span>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function FilesPage() {
  const [tree,         setTree]         = useState<TreeNode[]>([]);
  const [loadingTree,  setLoadingTree]  = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileData,     setFileData]     = useState<FileContent | null>(null);
  const [loadingFile,  setLoadingFile]  = useState(false);

  useEffect(() => {
    fetch("/api/files/tree")
      .then(r => r.json())
      .then(d => { setTree(d.tree ?? []); setLoadingTree(false); })
      .catch(() => setLoadingTree(false));
  }, []);

  const selectFile = useCallback(async (path: string) => {
    setSelectedPath(path);
    setFileData(null);
    setLoadingFile(true);
    try {
      const r = await fetch(`/api/files/content?path=${encodeURIComponent(path)}`);
      if (r.ok) setFileData(await r.json());
    } finally {
      setLoadingFile(false);
    }
  }, []);

  const isMd = selectedPath?.endsWith(".md");

  return (
    <div style={{
      minHeight: "100vh", background: "#060d1f", color: "#e2e8f0",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid rgba(80,120,200,0.2)" }}>
        <h1 style={{ fontSize: 18, fontFamily: "monospace", color: "#7dd3fc", letterSpacing: "0.06em", margin: 0 }}>
          📁 Workspace File Browser
        </h1>
        <p style={{ fontSize: 11, color: "rgba(150,170,220,0.45)", margin: "4px 0 0", fontFamily: "monospace" }}>
          ~/.openclaw/workspace
        </p>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── Left: tree ── */}
        <div style={{
          width: 280, minWidth: 200, maxWidth: 380,
          borderRight: "1px solid rgba(80,120,200,0.2)",
          overflowY: "auto", padding: "10px 4px",
          background: "rgba(5,10,25,0.5)",
        }}>
          {loadingTree ? (
            <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "rgba(150,180,255,0.4)" }}>
              Loading…
            </div>
          ) : tree.length === 0 ? (
            <div style={{ padding: 20, fontSize: 12, color: "rgba(150,180,255,0.4)" }}>
              Empty workspace
            </div>
          ) : (
            tree.map(node => (
              <TreeItem
                key={node.path}
                node={node}
                depth={0}
                selected={selectedPath}
                onSelect={selectFile}
              />
            ))
          )}
        </div>

        {/* ── Right: viewer ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {!selectedPath && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "60%", gap: 12,
              color: "rgba(120,150,200,0.45)",
            }}>
              <span style={{ fontSize: 48 }}>📂</span>
              <span style={{ fontSize: 14, fontFamily: "monospace" }}>Select a file to view</span>
            </div>
          )}

          {selectedPath && (
            <>
              {/* File meta */}
              <div style={{
                display: "flex", gap: 16, alignItems: "center",
                marginBottom: 14, paddingBottom: 10,
                borderBottom: "1px solid rgba(80,120,200,0.2)",
              }}>
                <span style={{ fontFamily: "monospace", fontSize: 13, color: "#93c5fd" }}>
                  {selectedPath}
                </span>
                {fileData && (
                  <div style={{ display: "flex", gap: 12, marginLeft: "auto" }}>
                    <span style={{ fontSize: 10, color: "rgba(150,170,220,0.5)" }}>
                      {formatSize(fileData.size)}
                    </span>
                    <span style={{ fontSize: 10, color: "rgba(150,170,220,0.5)" }}>
                      {formatDate(fileData.mtime)}
                    </span>
                  </div>
                )}
              </div>

              {fileData?.truncated && (
                <div style={{
                  background: "rgba(161,98,7,0.15)", border: "1px solid rgba(161,98,7,0.35)",
                  borderRadius: 6, padding: "6px 12px", marginBottom: 12,
                  fontSize: 11, color: "#fbbf24",
                }}>
                  ⚠️ File truncated at 50 KB — showing first portion only
                </div>
              )}

              {loadingFile && (
                <div style={{ padding: 30, textAlign: "center", color: "rgba(150,180,255,0.4)", fontSize: 13 }}>
                  Loading…
                </div>
              )}

              {!loadingFile && fileData && (
                isMd ? (
                  <div style={{ fontSize: 13, lineHeight: 1.75, color: "rgba(200,220,255,0.85)" }}>
                    <div className="md-content">
                      <ReactMarkdown>{fileData.content}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <pre style={{
                    fontSize: 12, lineHeight: 1.65, color: "rgba(180,210,240,0.85)",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                    background: "rgba(5,10,25,0.7)", border: "1px solid rgba(80,120,200,0.2)",
                    borderRadius: 6, padding: "12px 14px",
                    overflowX: "auto", margin: 0,
                  }}>
                    {fileData.content}
                  </pre>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
