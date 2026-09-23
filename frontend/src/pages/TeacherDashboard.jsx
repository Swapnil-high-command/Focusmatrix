import { useState, useEffect } from "react";
import { getLeaderboard, getClassAnalytics } from "../api";
import { useSocket } from "../hooks/useSocket";
import { TeacherLiveRoom } from "./LiveClassRoom";

const MAX_STUDENTS = 10;

export default function TeacherDashboard({ user }) {
  const [liveStudents, setLiveStudents] = useState({});
  const [alerts, setAlerts]             = useState([]);
  const [leaderboard, setLeaderboard]   = useState([]);
  const [classStats, setClassStats]     = useState([]);
  const [tab, setTab]                   = useState("live");
  const [classActive, setClassActive]   = useState(false);
  const [classInfo, setClassInfo]       = useState(null);
  const [inLiveRoom, setInLiveRoom]     = useState(false);

  useEffect(() => {
    getLeaderboard().then(setLeaderboard).catch(() => {});
    getClassAnalytics().then(setClassStats).catch(() => {});
  }, []);

  const socket = useSocket({
    role: "teacher",
    onStudentAnalytics: (d) => setLiveStudents((p) => ({ ...p, [d.studentId]: d })),
    onStudentAlert:     (d) => setAlerts((p) => [d, ...p].slice(0, 30)),
    onStudentLeft:      (d) => setLiveStudents((p) => { const n = { ...p }; delete n[d.studentId]; return n; }),
    onClassState:       (d) => { if (d) { setClassActive(true); setClassInfo(d); } },
    onClassStarted:     (d) => { setClassActive(true); setClassInfo(d); },
    onClassEnded:       ()  => { setClassActive(false); setClassInfo(null); setInLiveRoom(false); },
    onClassStudentJoined: (d) => setClassInfo((p) => p ? { ...p, studentCount: d.count } : p),
    onClassStudentLeft:   (d) => setClassInfo((p) => p ? { ...p, studentCount: d.count } : p),
  });

  // If teacher is in live room, show it full-page (same socket passed down)
  if (inLiveRoom) {
    return (
      <TeacherLiveRoom
        user={user}
        onEnd={() => { setInLiveRoom(false); setClassActive(false); setClassInfo(null); }}
      />
    );
  }

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

      {/* Live Class Banner */}
      <div style={s.classBanner}>
        <div style={s.classInfo}>
          {classActive ? (
            <>
              <span style={s.liveDot} />
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Live Class Active</span>
              <span style={s.classSeat}>{classInfo?.studentCount ?? 0} / {MAX_STUDENTS} students</span>
            </>
          ) : (
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No active class — start one to go live</span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {classActive && (
            <button style={{ ...s.classBtn, background: "#6366f1" }} onClick={() => setInLiveRoom(true)}>
              📺 Open Live Room
            </button>
          )}
          <button
            style={{ ...s.classBtn, background: classActive ? "#ef4444" : "#22c55e" }}
            onClick={classActive
              ? () => { socket.endClass(); setClassActive(false); setClassInfo(null); }
              : () => { socket.startClass(user?.name || "Teacher"); setInLiveRoom(true); }
            }
          >
            {classActive ? "⏹ End Class" : "▶ Start Live Class"}
          </button>
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
          <ClassAvgDropdown students={liveList} />
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

function ClassAvgDropdown({ students }) {
  const [open, setOpen] = useState(true);
  const n = students.length;

  const avg = (key) => n === 0 ? 0 : Math.round(students.reduce((s, st) => s + (st[key] ?? 0), 0) / n);
  const avgAttn    = avg("attentionScore");
  const avgBlinks  = avg("blinkCount");
  const avgYawns   = avg("yawnCount");
  const avgDrowsy  = avg("drowsinessEvents");
  const focusedPct = n === 0 ? 0 : Math.round(students.filter(st => st.eyeContact === "Looking at Camera").length / n * 100);

  // Merge all gesture counts
  const gestures = {};
  students.forEach(st => {
    Object.entries(st.gestureCounts || {}).forEach(([g, c]) => {
      gestures[g] = (gestures[g] || 0) + c;
    });
  });
  const gestureEntries = Object.entries(gestures).sort((a, b) => b[1] - a[1]);

  const { color } = scoreStyle(avgAttn);

  return (
    <div style={s.avgWrap}>
      <button style={s.avgHeader} onClick={() => setOpen(o => !o)}>
        <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>📊 Class Average — {n} student{n !== 1 ? "s" : ""}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ ...s.liveScore, background: scoreStyle(avgAttn).bg, color, fontSize: "0.8rem" }}>{avgAttn}% avg</span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div style={s.avgBody}>
          {n === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No students online yet — data will appear here when students connect.</p>
          ) : (
            <>
              <div style={s.avgGrid}>
                <AvgStat icon="🎯" label="Avg Attention" value={`${avgAttn}%`} color={color} />
                <AvgStat icon="👀" label="Focused" value={`${focusedPct}%`} color={focusedPct >= 60 ? "#22c55e" : "#ef4444"} />
                <AvgStat icon="😉" label="Avg Blinks" value={avgBlinks} />
                <AvgStat icon="🥱" label="Avg Yawns" value={avgYawns} color={avgYawns >= 3 ? "#ef4444" : undefined} />
                <AvgStat icon="😴" label="Avg Drowsy" value={avgDrowsy} color={avgDrowsy > 0 ? "#ef4444" : undefined} />
              </div>
              {gestureEntries.length > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  <p style={{ ...s.sectionLabel, marginBottom: "0.4rem" }}>🤚 Gesture Counts (all students)</p>
                  <div style={s.gestureGrid}>
                    {gestureEntries.map(([g, c]) => (
                      <div key={g} style={s.gestureChip}>
                        <span style={{ fontSize: "0.82rem" }}>{g}</span>
                        <span style={s.gestureBadge}>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AvgStat({ icon, label, value, color }) {
  return (
    <div style={s.avgStat}>
      <span style={{ fontSize: "1.1rem" }}>{icon}</span>
      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: color || "var(--text-primary)" }}>{value}</span>
      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

function LiveCard({ student: st }) {
  const [open, setOpen] = useState(false);
  const score = st.attentionScore ?? 0;
  const { color, bg } = scoreStyle(score);
  const gestureEntries = Object.entries(st.gestureCounts || {}).sort((a, b) => b[1] - a[1]);
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
        <button style={s.chevron} onClick={() => setOpen(o => !o)}>{open ? "▲" : "▼"}</button>
      </div>
      <div style={s.liveStats}>
        <LiveStat icon="👀" label={st.eyeContact === "Looking at Camera" ? "Focused" : "Away"} ok={st.eyeContact === "Looking at Camera"} />
        <LiveStat icon="😴" label={`${st.drowsinessEvents} sleep`} ok={st.drowsinessEvents === 0} />
        <LiveStat icon="🥱" label={`${st.yawnCount} yawns`} ok={st.yawnCount < 3} />
        <LiveStat icon="😉" label={`${st.blinkCount} blinks`} ok />
      </div>
      {open && gestureEntries.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
          <p style={{ ...s.sectionLabel, marginBottom: "0.35rem" }}>🤚 Gestures</p>
          <div style={s.gestureGrid}>
            {gestureEntries.map(([g, c]) => (
              <div key={g} style={s.gestureChip}>
                <span style={{ fontSize: "0.78rem" }}>{g}</span>
                <span style={s.gestureBadge}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {open && gestureEntries.length === 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>🤚 No gestures detected yet</p>
        </div>
      )}
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
  chevron: { background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.7rem", padding: "0.2rem", flexShrink: 0 },

  // Class avg dropdown
  avgWrap: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", marginBottom: "1rem", overflow: "hidden" },
  avgHeader: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", fontFamily: "Inter,sans-serif" },
  avgBody: { padding: "0 1rem 1rem" },
  avgGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.5rem" },
  avgStat: { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.5rem 0.4rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem" },

  // Gestures
  sectionLabel: { fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-muted)", margin: 0 },
  gestureGrid: { display: "flex", flexWrap: "wrap", gap: "0.4rem" },
  gestureChip: { display: "flex", alignItems: "center", gap: "0.35rem", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "999px", padding: "0.2rem 0.6rem" },
  gestureBadge: { background: "var(--accent)", color: "#fff", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 700, padding: "0.05rem 0.4rem" },

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

  // Live class banner
  classBanner: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.75rem 1rem", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" },
  classInfo: { display: "flex", alignItems: "center", gap: "0.6rem" },
  liveDot: { width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", flexShrink: 0, animation: "pulse 1.5s infinite" },
  classSeat: { background: "rgba(99,102,241,0.12)", color: "#6366f1", borderRadius: "999px", padding: "0.15rem 0.6rem", fontSize: "0.75rem", fontWeight: "600" },
  classBtn: { padding: "0.4rem 1.1rem", borderRadius: "999px", border: "none", color: "#fff", fontWeight: "600", fontSize: "0.82rem", cursor: "pointer", fontFamily: "Inter,sans-serif" },
};
