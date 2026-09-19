import { useState, useEffect } from "react";
import { getLeaderboard, getClassAnalytics } from "../api";
import { useSocket } from "../hooks/useSocket";

export default function TeacherDashboard() {
  const [liveStudents, setLiveStudents] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [classStats, setClassStats] = useState([]);
  const [tab, setTab] = useState("live");

  useEffect(() => {
    getLeaderboard().then(setLeaderboard).catch(() => {});
    getClassAnalytics().then(setClassStats).catch(() => {});
  }, []);

  useSocket({
    role: "teacher",
    onStudentAnalytics: (data) => setLiveStudents((prev) => ({ ...prev, [data.studentId]: data })),
    onStudentAlert: (data) => setAlerts((prev) => [data, ...prev].slice(0, 30)),
    onStudentLeft: (data) => setLiveStudents((prev) => { const n = { ...prev }; delete n[data.studentId]; return n; }),
  });

  const liveList = Object.values(liveStudents);
  const unreadAlerts = alerts.length;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>👨🏫 Teacher Dashboard</h2>
          <p style={s.sub}>Monitor your students in real-time</p>
        </div>
        <div style={s.statsRow}>
          <StatPill icon="🟢" label="Online" value={liveList.length} color="#22c55e" />
          <StatPill icon="🚨" label="Alerts" value={unreadAlerts} color="#ef4444" />
          <StatPill icon="📅" label="Sessions" value={classStats.reduce((a, s) => a + (s.total_sessions || 0), 0)} color="#6366f1" />
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabBar}>
        {[["live", "🟢 Live"], ["alerts", `🚨 Alerts${unreadAlerts ? ` (${unreadAlerts})` : ""}`], ["class", "📊 Class"], ["board", "🏆 Leaderboard"]].map(([key, label]) => (
          <button key={key} style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Live Students */}
      {tab === "live" && (
        <div>
          {liveList.length === 0 ? (
            <EmptyState icon="📡" text="No students online" sub="Students appear here when they open the Monitor page" />
          ) : (
            <div style={s.grid}>
              {liveList.map((st) => <LiveCard key={st.studentId} student={st} />)}
            </div>
          )}
        </div>
      )}

      {/* Alerts */}
      {tab === "alerts" && (
        <div>
          {alerts.length === 0 ? (
            <EmptyState icon="✅" text="No alerts" sub="Alerts appear when students have low attention or sleep events" />
          ) : (
            <div style={s.alertList}>
              {alerts.map((a, i) => (
                <div key={i} style={s.alertRow}>
                  <div style={s.alertLeft}>
                    <div style={s.alertAvatar}>{a.studentName?.[0]?.toUpperCase()}</div>
                    <div>
                      <p style={s.alertName}>{a.studentName}</p>
                      <p style={s.alertMsg}>{a.alerts.join("  ·  ")}</p>
                    </div>
                  </div>
                  <span style={s.alertTime}>{new Date(a.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Class Overview */}
      {tab === "class" && (
        <div>
          {classStats.length === 0 ? (
            <EmptyState icon="📊" text="No data yet" sub="Class stats appear after students save sessions" />
          ) : (
            <div style={s.grid}>
              {classStats.map((st) => (
                <div key={st.student_id} style={s.classCard}>
                  <div style={s.classCardTop}>
                    <div style={s.classAvatar}>{st.student_name?.[0]?.toUpperCase()}</div>
                    <div>
                      <p style={s.className}>{st.student_name}</p>
                      <p style={s.classSub}>{st.total_sessions} session{st.total_sessions !== 1 ? "s" : ""}</p>
                    </div>
                    <div style={{ ...s.scorePill, ...scoreStyle(st.avg_attention_score) }}>
                      {st.avg_attention_score}%
                    </div>
                  </div>
                  <div style={s.classStats}>
                    <MiniStat label="Sleep" value={st.total_drowsiness} alert={st.total_drowsiness > 0} />
                    <MiniStat label="Yawns" value={st.total_yawns} />
                    <MiniStat label="Avg Blinks" value={st.avg_blink_count} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {tab === "board" && (
        <div>
          {leaderboard.length === 0 ? (
            <EmptyState icon="🏆" text="No leaderboard yet" sub="Students appear here after saving sessions" />
          ) : (
            <div style={s.leaderList}>
              {leaderboard.map((st, i) => (
                <div key={st.student_id} style={s.leaderRow}>
                  <div style={{ ...s.rank, ...(i === 0 ? s.rank1 : i === 1 ? s.rank2 : i === 2 ? s.rank3 : {}) }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  <div style={s.leaderAvatar}>{st.student_name?.[0]?.toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <p style={s.leaderName}>{st.student_name}</p>
                    <p style={s.leaderSub}>{st.total_sessions} sessions</p>
                  </div>
                  <div style={s.leaderBar}>
                    <div style={{ ...s.leaderFill, width: `${st.avg_attention_score}%`, background: scoreStyle(st.avg_attention_score).color }} />
                  </div>
                  <div style={{ ...s.leaderScore, color: scoreStyle(st.avg_attention_score).color }}>
                    {Math.round(st.avg_attention_score)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LiveCard({ student: st }) {
  const score = st.attentionScore ?? 0;
  const { color, bg } = scoreStyle(score);
  return (
    <div style={s.liveCard}>
      <div style={s.liveCardTop}>
        <div style={{ ...s.liveAvatar, background: `linear-gradient(135deg, ${color}44, ${color}22)`, border: `1px solid ${color}44` }}>
          {st.studentName?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={s.liveName}>{st.studentName}</p>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{st.emotion}</p>
        </div>
        <div style={{ ...s.liveScore, background: bg, color }}>{score}%</div>
      </div>
      <div style={s.liveStats}>
        <LiveStat icon="👀" label={st.eyeContact === "Looking at Camera" ? "Focused" : "Away"} ok={st.eyeContact === "Looking at Camera"} />
        <LiveStat icon="😴" label={`${st.drowsinessEvents} sleep`} ok={st.drowsinessEvents === 0} />
        <LiveStat icon="🥱" label={`${st.yawnCount} yawns`} ok={st.yawnCount < 3} />
        <LiveStat icon="😉" label={`${st.blinkCount} blinks`} ok />
      </div>
    </div>
  );
}

function LiveStat({ icon, label, ok }) {
  return (
    <div style={{ ...s.liveStat, color: ok ? "var(--text-secondary)" : "#f87171" }}>
      {icon} {label}
    </div>
  );
}

function MiniStat({ label, value, alert }) {
  return (
    <div style={s.miniStat}>
      <span style={{ ...s.miniVal, color: alert ? "#ef4444" : "var(--text-primary)" }}>{value}</span>
      <span style={s.miniLabel}>{label}</span>
    </div>
  );
}

function StatPill({ icon, label, value, color }) {
  return (
    <div style={{ ...s.pill, borderColor: `${color}33`, background: `${color}11` }}>
      <span>{icon}</span>
      <span style={{ color, fontWeight: "700", fontSize: "1rem" }}>{value}</span>
      <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{label}</span>
    </div>
  );
}

function EmptyState({ icon, text, sub }) {
  return (
    <div style={s.empty}>
      <div style={{ fontSize: "2.5rem" }}>{icon}</div>
      <p style={{ fontWeight: "600", color: "var(--text-primary)" }}>{text}</p>
      <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", textAlign: "center" }}>{sub}</p>
    </div>
  );
}

function scoreStyle(score) {
  if (score >= 80) return { color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  if (score >= 60) return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return { color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
}

const s = {
  page: { padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", color: "var(--text-primary)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" },
  title: { fontSize: "1.3rem", fontWeight: "700", marginBottom: "0.2rem" },
  sub: { fontSize: "0.8rem", color: "var(--text-muted)" },
  statsRow: { display: "flex", gap: "0.6rem", flexWrap: "wrap" },
  pill: { display: "flex", flexDirection: "column", alignItems: "center", padding: "0.5rem 0.9rem", borderRadius: "10px", border: "1px solid", gap: "0.1rem", minWidth: "64px" },
  tabBar: { display: "flex", gap: "0.4rem", marginBottom: "1.25rem", flexWrap: "wrap" },
  tab: { padding: "0.4rem 1rem", borderRadius: "999px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontFamily: "Inter,sans-serif", fontSize: "0.82rem", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" },
  tabActive: { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)", fontWeight: "600" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" },

  // Live card
  liveCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" },
  liveCardTop: { display: "flex", alignItems: "center", gap: "0.75rem" },
  liveAvatar: { width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "1rem", flexShrink: 0 },
  liveName: { fontWeight: "600", fontSize: "0.9rem" },
  liveScore: { padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.82rem", fontWeight: "700", flexShrink: 0 },
  liveStats: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem" },
  liveStat: { fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" },

  // Alerts
  alertList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  alertRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "10px", padding: "0.75rem 1rem" },
  alertLeft: { display: "flex", alignItems: "center", gap: "0.75rem" },
  alertAvatar: { width: "32px", height: "32px", borderRadius: "50%", background: "rgba(239,68,68,0.2)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.85rem", flexShrink: 0 },
  alertName: { fontWeight: "600", fontSize: "0.85rem" },
  alertMsg: { fontSize: "0.78rem", color: "#f87171", marginTop: "0.1rem" },
  alertTime: { fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap" },

  // Class card
  classCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" },
  classCardTop: { display: "flex", alignItems: "center", gap: "0.75rem" },
  classAvatar: { width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "#fff", flexShrink: 0 },
  className: { fontWeight: "600", fontSize: "0.88rem" },
  classSub: { fontSize: "0.72rem", color: "var(--text-muted)" },
  scorePill: { marginLeft: "auto", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "700", flexShrink: 0 },
  classStats: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" },
  miniStat: { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.4rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem" },
  miniVal: { fontSize: "0.9rem", fontWeight: "700" },
  miniLabel: { fontSize: "0.62rem", color: "var(--text-muted)" },

  // Leaderboard
  leaderList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  leaderRow: { display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.75rem 1rem" },
  rank: { width: "28px", textAlign: "center", fontSize: "0.85rem", fontWeight: "700", color: "var(--text-muted)", flexShrink: 0 },
  rank1: { fontSize: "1.2rem" }, rank2: { fontSize: "1.1rem" }, rank3: { fontSize: "1rem" },
  leaderAvatar: { width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "#fff", fontSize: "0.85rem", flexShrink: 0 },
  leaderName: { fontWeight: "600", fontSize: "0.88rem" },
  leaderSub: { fontSize: "0.7rem", color: "var(--text-muted)" },
  leaderBar: { width: "80px", height: "6px", background: "var(--bg-surface)", borderRadius: "999px", overflow: "hidden", flexShrink: 0 },
  leaderFill: { height: "100%", borderRadius: "999px", transition: "width 0.6s ease" },
  leaderScore: { fontWeight: "700", fontSize: "0.9rem", minWidth: "40px", textAlign: "right", flexShrink: 0 },

  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", minHeight: "40vh" },
};
