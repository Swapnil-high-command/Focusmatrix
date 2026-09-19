import { useEffect, useState } from "react";
import { getMySessions, deleteSession } from "../api";

export default function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMySessions().then(setSessions).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this session?")) return;
    await deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) return <div style={s.center}><div style={s.spinner} /><p style={s.muted}>Loading sessions...</p></div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>📋 Session History</h2>
          <p style={s.sub}>{sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📭</div>
          <p style={s.emptyText}>No sessions yet</p>
          <p style={s.muted}>Start a monitoring session to see your history here</p>
        </div>
      ) : (
        <div style={s.grid}>
          {sessions.map((sess) => {
            const score = sess.attention_score ?? sess.attentionScore ?? 0;
            const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
            const bg = score >= 80 ? "rgba(34,197,94,0.1)" : score >= 60 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";
            const status = sess.student_status ?? sess.studentStatus ?? "Unknown";
            const date = sess.created_at ?? sess.createdAt;

            return (
              <div key={sess.id} style={s.card}>
                {/* Score badge */}
                <div style={{ ...s.scoreBadge, background: bg, color }}>
                  {score}%
                </div>

                <p style={s.date}>{date ? new Date(date).toLocaleString() : "—"}</p>
                <p style={{ ...s.statusChip, color }}>{status}</p>

                <div style={s.statsGrid}>
                  <Stat icon="😴" label="Sleep" value={sess.drowsiness_events ?? sess.drowsinessEvents ?? 0} alert={(sess.drowsiness_events ?? sess.drowsinessEvents ?? 0) > 0} />
                  <Stat icon="🥱" label="Yawns" value={sess.yawn_count ?? sess.yawnCount ?? 0} />
                  <Stat icon="😉" label="Blinks" value={sess.blink_count ?? sess.blinkCount ?? 0} />
                  <Stat icon="⏱" label="Duration" value={`${Math.round(((sess.duration_ms ?? sess.durationMs ?? 0) / 60000))}m`} />
                </div>

                <button style={s.deleteBtn} onClick={() => handleDelete(sess.id)}>🗑 Delete</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, alert }) {
  return (
    <div style={s.stat}>
      <span style={s.statIcon}>{icon}</span>
      <span style={{ ...s.statVal, color: alert ? "#ef4444" : "var(--text-primary)" }}>{value}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
  );
}

const s = {
  page: { padding: "1.5rem", color: "var(--text-primary)", maxWidth: "1200px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  title: { fontSize: "1.3rem", fontWeight: "700", marginBottom: "0.2rem" },
  sub: { fontSize: "0.8rem", color: "var(--text-muted)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" },
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    padding: "1.1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    transition: "border-color 0.2s, transform 0.2s",
    position: "relative",
  },
  scoreBadge: {
    position: "absolute", top: "1rem", right: "1rem",
    padding: "0.2rem 0.6rem",
    borderRadius: "999px",
    fontSize: "0.8rem",
    fontWeight: "700",
  },
  date: { fontSize: "0.75rem", color: "var(--text-muted)" },
  statusChip: { fontSize: "0.82rem", fontWeight: "600" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginTop: "0.25rem" },
  stat: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "0.4rem 0.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.1rem",
  },
  statIcon: { fontSize: "0.9rem" },
  statVal: { fontSize: "0.9rem", fontWeight: "700" },
  statLabel: { fontSize: "0.65rem", color: "var(--text-muted)" },
  deleteBtn: {
    marginTop: "0.25rem",
    background: "rgba(239,68,68,0.1)",
    color: "#f87171",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "8px",
    padding: "0.4rem",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontFamily: "Inter, sans-serif",
    transition: "background 0.2s",
  },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", minHeight: "50vh" },
  spinner: {
    width: "32px", height: "32px",
    border: "3px solid var(--border)",
    borderTop: "3px solid var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", minHeight: "50vh" },
  emptyIcon: { fontSize: "3rem", marginBottom: "0.5rem" },
  emptyText: { fontSize: "1.1rem", fontWeight: "600" },
  muted: { color: "var(--text-muted)", fontSize: "0.85rem" },
};
