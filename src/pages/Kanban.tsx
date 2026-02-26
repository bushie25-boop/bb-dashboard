import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Priority = "low" | "med" | "high" | "urgent";
type Column   = "Backlog" | "In Progress" | "Review" | "Done";

interface Task {
  id:          string;
  title:       string;
  description: string;
  assignee:    string;
  priority:    Priority;
  column:      Column;
  createdAt:   string;
  updatedAt:   string;
}

const COLUMNS: Column[] = ["Backlog", "In Progress", "Review", "Done"];

const COL_COLORS: Record<Column, string> = {
  Backlog:       "rgba(80,90,120,0.3)",
  "In Progress": "rgba(37,99,235,0.2)",
  Review:        "rgba(161,98,7,0.2)",
  Done:          "rgba(22,163,74,0.2)",
};

const COL_BORDER: Record<Column, string> = {
  Backlog:       "rgba(80,90,120,0.5)",
  "In Progress": "rgba(37,99,235,0.45)",
  Review:        "rgba(161,98,7,0.45)",
  Done:          "rgba(22,163,74,0.45)",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low:    "#6b7280",
  med:    "#3b82f6",
  high:   "#f59e0b",
  urgent: "#ef4444",
};

const AGENTS = [
  { id: "fred",  label: "Fred",  emoji: "⭐" },
  { id: "scout", label: "Scout", emoji: "🔭" },
  { id: "dusty", label: "Dusty", emoji: "🌾" },
  { id: "hugh",  label: "Hugh",  emoji: "🤖" },
  { id: "teky",  label: "Teky",  emoji: "💻" },
  { id: "buzz",  label: "Buzz",  emoji: "⚡" },
  { id: "mac",   label: "Mac",   emoji: "🔧" },
  { id: "dale",  label: "Dale",  emoji: "📈" },
  { id: "rex",   label: "Rex",   emoji: "🔐" },
  { id: "karen", label: "Karen", emoji: "📋" },
  { id: "cash",  label: "Cash",  emoji: "💰" },
  { id: "lee",   label: "Lee",   emoji: "👤" },
];

function agentInfo(id: string) {
  return AGENTS.find(a => a.id === id) ?? { id, label: id, emoji: "👤" };
}

// ─── Add Card Form ─────────────────────────────────────────────────────────────
function AddCardForm({ column, onAdd, onCancel }: {
  column: Column;
  onAdd: (t: Partial<Task>) => void;
  onCancel: () => void;
}) {
  const [title,    setTitle]    = useState("");
  const [assignee, setAssignee] = useState("lee");
  const [desc,     setDesc]     = useState("");
  const [priority, setPriority] = useState<Priority>("low");

  return (
    <div style={{
      background: "rgba(15,25,50,0.95)", border: "1px solid rgba(80,120,200,0.4)",
      borderRadius: 8, padding: 12, marginTop: 8,
    }}>
      <input
        autoFocus
        placeholder="Card title…"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={inputStyle}
      />
      <textarea
        placeholder="Description (optional)"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        rows={2}
        style={{ ...inputStyle, resize: "none", marginTop: 6 }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <select value={assignee} onChange={e => setAssignee(e.target.value)} style={selectStyle}>
          {AGENTS.map(a => (
            <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>
          ))}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value as Priority)} style={selectStyle}>
          <option value="low">Low</option>
          <option value="med">Medium</option>
          <option value="high">High</option>
          <option value="urgent">🔴 Urgent</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button
          onClick={() => {
            if (!title.trim()) return;
            onAdd({ title: title.trim(), description: desc.trim(), assignee, priority, column });
          }}
          style={btnPrimary}
        >
          Add Card
        </button>
        <button onClick={onCancel} style={btnSecondary}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onUpdate, onDelete }: {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc,  setEditDesc]  = useState(task.description);
  const [editAssignee, setEditAssignee] = useState(task.assignee);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
  };

  const agent = agentInfo(task.assignee);

  const saveEdit = () => {
    onUpdate(task.id, {
      title: editTitle.trim() || task.title,
      description: editDesc.trim(),
      assignee: editAssignee,
      priority: editPriority,
    });
    setExpanded(false);
  };

  if (expanded) {
    return (
      <div style={{
        background: "rgba(20,35,70,0.95)", border: "1px solid rgba(80,120,200,0.5)",
        borderRadius: 8, padding: 12, marginBottom: 6,
      }}>
        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={inputStyle} />
        <textarea
          value={editDesc} onChange={e => setEditDesc(e.target.value)}
          rows={3} style={{ ...inputStyle, resize: "none", marginTop: 6 }}
        />
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <select value={editAssignee} onChange={e => setEditAssignee(e.target.value)} style={selectStyle}>
            {AGENTS.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>)}
          </select>
          <select value={editPriority} onChange={e => setEditPriority(e.target.value as Priority)} style={selectStyle}>
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
            <option value="urgent">🔴 Urgent</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={saveEdit} style={btnPrimary}>Save</button>
          <button onClick={() => setExpanded(false)} style={btnSecondary}>Cancel</button>
          <button
            onClick={() => { if (confirm("Delete this card?")) onDelete(task.id); }}
            style={{ ...btnSecondary, marginLeft: "auto", color: "#f87171" }}
          >
            🗑 Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: "rgba(15,25,50,0.85)",
        border: "1px solid rgba(80,120,200,0.3)",
        borderRadius: 8, padding: "10px 12px", marginBottom: 6,
        userSelect: "none",
      }}
      onClick={() => setExpanded(true)}
      {...attributes}
      {...listeners}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600, lineHeight: 1.35 }}>
          {task.title}
        </span>
        <span style={{
          fontSize: 10, padding: "2px 6px", borderRadius: 12, whiteSpace: "nowrap",
          background: PRIORITY_COLORS[task.priority] + "33",
          color: PRIORITY_COLORS[task.priority],
          border: `1px solid ${PRIORITY_COLORS[task.priority]}55`,
        }}>
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p style={{ fontSize: 11, color: "rgba(160,180,220,0.75)", margin: "5px 0 0", lineHeight: 1.4 }}>
          {task.description.slice(0, 80)}{task.description.length > 80 ? "…" : ""}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7 }}>
        <span style={{ fontSize: 13 }}>{agent.emoji}</span>
        <span style={{ fontSize: 10, color: "rgba(150,170,220,0.7)" }}>{agent.label}</span>
      </div>
    </div>
  );
}

// ─── Column ────────────────────────────────────────────────────────────────────
function KanbanColumn({ column, tasks, onAdd, onUpdate, onDelete }: {
  column: Column;
  tasks: Task[];
  onAdd: (t: Partial<Task>) => void;
  onUpdate: (id: string, up: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div style={{
      flex: "1 1 230px", minWidth: 200, maxWidth: 320,
      background: COL_COLORS[column],
      border: `1px solid ${COL_BORDER[column]}`,
      borderRadius: 10, padding: "12px 10px",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#c4d4f0", fontFamily: "monospace" }}>
          {column}
        </span>
        <span style={{
          fontSize: 10, color: "rgba(150,170,220,0.6)",
          background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "1px 7px",
        }}>
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ flex: 1, minHeight: 60 }}>
          {tasks.map(t => (
            <TaskCard key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>

      {adding ? (
        <AddCardForm
          column={column}
          onAdd={(t) => { onAdd(t); setAdding(false); }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button onClick={() => setAdding(true)} style={{
          marginTop: 8, background: "rgba(255,255,255,0.05)",
          border: "1px dashed rgba(100,130,200,0.35)",
          borderRadius: 6, padding: "6px 10px", cursor: "pointer",
          color: "rgba(150,180,255,0.6)", fontSize: 12, width: "100%",
        }}>
          + Add card
        </button>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/kanban");
      if (r.ok) setTasks((await r.json()).tasks ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTask = async (partial: Partial<Task>) => {
    const r = await fetch("/api/kanban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (r.ok) {
      const t = await r.json();
      setTasks(prev => [...prev, t]);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const r = await fetch(`/api/kanban/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (r.ok) {
      const updated = await r.json();
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    }
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/kanban/${id}`, { method: "DELETE" });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveTask(tasks.find(t => t.id === e.active.id) ?? null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const draggedTask = tasks.find(t => t.id === active.id);
    if (!draggedTask) return;

    // Check if `over` is a column id or a task id
    const isColumnId = COLUMNS.includes(over.id as Column);
    const newColumn = isColumnId
      ? (over.id as Column)
      : (tasks.find(t => t.id === over.id)?.column ?? draggedTask.column);

    if (newColumn !== draggedTask.column) {
      await updateTask(draggedTask.id, { column: newColumn });
    }
  };

  const tasksFor = (col: Column) => tasks.filter(t => t.column === col);

  if (loading) return <PageShell><Spinner /></PageShell>;

  return (
    <PageShell>
      <div style={{ padding: "20px 24px 24px" }}>
        <h1 style={h1Style}>📋 Kanban Board</h1>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", overflowX: "auto", paddingBottom: 8 }}>
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col}
                column={col}
                tasks={tasksFor(col)}
                onAdd={addTask}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <div style={{
                background: "rgba(30,50,100,0.97)", border: "1px solid rgba(80,120,200,0.6)",
                borderRadius: 8, padding: "10px 12px", width: 240, boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              }}>
                <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{activeTask.title}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </PageShell>
  );
}

// ─── Shared mini-components ────────────────────────────────────────────────────
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#060d1f", color: "#e2e8f0" }}>
      {children}
    </div>
  );
}
function Spinner() {
  return <div style={{ padding: 40, textAlign: "center", color: "rgba(150,180,255,0.5)" }}>Loading…</div>;
}

// ─── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(10,20,45,0.9)", border: "1px solid rgba(80,120,200,0.4)",
  borderRadius: 6, padding: "6px 10px", color: "#e2e8f0", fontSize: 13, outline: "none",
  fontFamily: "inherit",
};
const selectStyle: React.CSSProperties = {
  flex: 1, background: "rgba(10,20,45,0.9)", border: "1px solid rgba(80,120,200,0.4)",
  borderRadius: 6, padding: "5px 8px", color: "#e2e8f0", fontSize: 12, outline: "none",
};
const btnPrimary: React.CSSProperties = {
  background: "rgba(37,99,235,0.6)", border: "1px solid rgba(37,99,235,0.8)",
  borderRadius: 6, padding: "5px 14px", color: "#e2e8f0", fontSize: 12, cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 6, padding: "5px 14px", color: "rgba(180,200,240,0.8)", fontSize: 12, cursor: "pointer",
};
const h1Style: React.CSSProperties = {
  fontSize: 18, fontFamily: "monospace", color: "#7dd3fc",
  marginBottom: 20, letterSpacing: "0.06em",
};
