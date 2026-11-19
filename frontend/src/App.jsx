import "./App.css";
import { useRef, useState, useEffect } from "react";

import FaceTracker from "./components/FaceTracker";
import Dashboard from "./components/Dashboard";
import AuthPage from "./pages/AuthPage";
import SessionHistory from "./pages/SessionHistory";
import TeacherDashboard from "./pages/TeacherDashboard";
import { StudentLiveRoom, TeacherLiveRoom } from "./pages/LiveClassRoom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useSocket } from "./hooks/useSocket";
import { saveSession } from "./api";
import { calculateAttentionScore } from "./utils/attentionScore";
import { getStudentStatus } from "./utils/studentStatus";

function ClassroomApp() {
  const { user, logout } = useAuth();
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  const [page, setPage]               = useState("monitor");
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStart, setSessionStart]   = useState(null);
  const [saving, setSaving]               = useState(false);

  // ── class state ──
  const [classActive, setClassActive]   = useState(false);
  const [classInfo, setClassInfo]       = useState(null);
  const [classCode, setClassCode]       = useState("");
  const [inLiveRoom, setInLiveRoom]     = useState(false);
  const [liveStudents, setLiveStudents] = useState({});
  const [alerts, setAlerts]             = useState([]);

  // ── student join state ──
  const [inClass, setInClass]     = useState(false);
  const [classError, setClassError] = useState("");
  const [joinCode, setJoinCode]   = useState(
    () => new URLSearchParams(window.location.search).get("code")?.toUpperCase() || ""
  );

  const [analytics, setAnalytics] = useState({
    faceStatus: "No Face", eyeContact: "Unknown", blinkCount: 0,
    headPose: "Unknown", emotion: "Neutral", faceVisibleTime: 0,
    faceMissingTime: 0, eyeContactTime: 0, lookingAwayTime: 0,
    longestEyeClosure: 0, drowsinessEvents: 0, yawnCount: 0,
    totalYawnTime: 0, longestYawn: 0, currentGesture: "None", gestureCounts: {},
  });

  const socket = useSocket({
    role: user?.role,
    studentId:   user?.id,
    studentName: user?.name,
    onStudentAnalytics: (d) => setLiveStudents((p) => ({ ...p, [d.studentId]: d })),
    onStudentAlert:     (d) => setAlerts((p) => [d, ...p].slice(0, 30)),
    onStudentLeft:      (d) => setLiveStudents((p) => { const n = { ...p }; delete n[d.studentId]; return n; }),
    onClassState:   (d) => { if (d) { setClassActive(true); setClassInfo(d); if (d.classCode) setClassCode(d.classCode); } },
    onClassStarted: (d) => { setClassActive(true); setClassInfo(d); if (d.classCode) setClassCode(d.classCode); },
    onClassEnded:   ()  => { setClassActive(false); setClassInfo(null); setClassCode(""); setInLiveRoom(false); setInClass(false); },
    onClassCode:    ({ classCode }) => setClassCode(classCode),
    onClassStudentJoined: (d) => setClassInfo((p) => p ? { ...p, studentCount: d.count } : p),
    onClassStudentLeft:   (d) => setClassInfo((p) => p ? { ...p, studentCount: d.count } : p),
    onClassJoinSuccess: () => { setInClass(true); setClassError(""); setJoinCode(""); },
    onClassJoinError:   ({ message }) => setClassError(message),
  });

  useEffect(() => {
    if (user?.role === "teacher") setPage("teacher");
    else setPage("monitor");
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "student") return;
    const id = setInterval(() => {
      socket.emitAnalytics({ ...analytics, attentionScore: calculateAttentionScore(analytics) });
    }, 3000);
    return () => clearInterval(id);
  }, [analytics, user]);

  async function handleEndSession() {
    setSaving(true); setSessionActive(false);
    try {
      await saveSession({
        ...analytics,
        attentionScore: calculateAttentionScore(analytics),
        studentStatus:  getStudentStatus(analytics).status,
        startedAt:  new Date(sessionStart).toISOString(),
        endedAt:    new Date().toISOString(),
        durationMs: Date.now() - sessionStart,
      });
      alert("✅ Session saved successfully!");
    } catch { alert("❌ Failed to save session."); }
    finally { setSaving(false); }
  }

  if (!user) return <AuthPage />;

  // ── Teacher live room (full screen) ──
  if (user.role === "teacher" && inLiveRoom) {
    return (
      <TeacherLiveRoom
        user={user}
        classCode={classCode}
        onEnd={() => { socket.endClass(); setClassActive(false); setClassInfo(null); setClassCode(""); setInLiveRoom(false); }}
      />
    );
  }

  // ── Student live room (full screen) ──
  if (user.role === "student" && inClass) {
    return (
      <StudentLiveRoom
        user={user}
        socket={socket}
        onLeave={() => setInClass(false)}
      />
    );
  }

  const initials = user.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="container">
      <nav className="navbar">
        <div className="navbar-brand"><span className="logo-icon">🎓</span>AI Classroom Monitor</div>
        <div className="navbar-right">
          <div className="nav-user"><div className="avatar">{initials}</div>{user.name}</div>
          {user.role === "student" && (
            <>
              <button className={`nav-btn ${page === "join" ? "active" : ""}`} onClick={() => setPage("join")}>🏫 <span className="label">Join Class</span></button>
              <button className={`nav-btn ${page === "monitor" ? "active" : ""}`} onClick={() => setPage("monitor")}>📷 <span className="label">Monitor</span></button>
              <button className={`nav-btn ${page === "history" ? "active" : ""}`} onClick={() => setPage("history")}>📋 <span className="label">History</span></button>
            </>
          )}
          {user.role === "teacher" && (
            <button className={`nav-btn ${page === "teacher" ? "active" : ""}`} onClick={() => setPage("teacher")}>👨🏫 <span className="label">Dashboard</span></button>
          )}
          <button className="nav-btn danger" onClick={logout}>Logout</button>
        </div>
      </nav>

      {page === "history" && <SessionHistory />}

      {page === "teacher" && (
        <TeacherDashboard
          user={user}
          classCode={classCode}
          classActive={classActive}
          classInfo={classInfo}
          liveStudents={liveStudents}
          alerts={alerts}
          onStartClass={() => socket.startClass(user?.name || "Teacher")}
          onEndClass={() => { socket.endClass(); setClassActive(false); setClassInfo(null); setClassCode(""); }}
          onOpenLiveRoom={() => setInLiveRoom(true)}
        />
      )}

      {/* ── Student Join Class page ── */}
      {page === "join" && (
        <div style={js.page}>
          <div style={js.card}>
            <div style={js.icon}>🏫</div>
            <h2 style={js.title}>Join a Live Class</h2>
            <p style={js.sub}>Enter the code or use the link your teacher shared</p>
            <div style={js.inputRow}>
              <input
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setClassError(""); }}
                placeholder="e.g. A3X9KZ"
                maxLength={6}
                style={js.input}
                onKeyDown={(e) => e.key === "Enter" && joinCode.length >= 4 && socket.joinClass(joinCode)}
              />
              <button
                style={{ ...js.btn, opacity: joinCode.length < 4 ? 0.5 : 1 }}
                disabled={joinCode.length < 4}
                onClick={() => socket.joinClass(joinCode)}
              >
                Join →
              </button>
            </div>
            {classError && <p style={js.error}>{classError}</p>}
            <p style={js.hint}>💡 Your teacher will share a 6-character code or a direct link</p>
          </div>
        </div>
      )}

      {/* ── Monitor (always mounted) ── */}
      <div style={{ display: page === "monitor" ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <div className="session-bar">
          {!sessionActive ? (
            <button className="session-btn start" onClick={() => { setSessionActive(true); setSessionStart(Date.now()); }}>▶ Start Session</button>
          ) : (
            <button className="session-btn stop" onClick={handleEndSession} disabled={saving}>{saving ? "⏳ Saving..." : "⏹ End & Save"}</button>
          )}
          {sessionActive && <div className="recording-badge"><div className="recording-dot" />Recording</div>}
        </div>
        <div className="main-content">
          <div className="camera-section">
            <div className="camera-label">🎥 Live Camera</div>
            <div className="video-box">
              <video ref={videoRef} autoPlay muted playsInline />
              <canvas ref={canvasRef} />
              <div className="video-overlay">
                <div className={`video-status-badge ${analytics.faceStatus === "Detected" ? "detected" : "missing"}`}>
                  <span>{analytics.faceStatus === "Detected" ? "●" : "○"}</span>{analytics.faceStatus}
                </div>
                <div className={`video-status-badge ${analytics.faceStatus === "Detected" ? "detected" : "missing"}`}>{analytics.emotion}</div>
              </div>
              {analytics.faceStatus === "No Face" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(8,11,20,0.7)", gap: "0.75rem", pointerEvents: "none" }}>
                  <div style={{ width: 36, height: 36, border: "3px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Starting camera & loading AI models…</span>
                </div>
              )}
              {(analytics.faceStatus === "Camera Error" || analytics.faceStatus === "Model Load Failed" || analytics.faceStatus === "Startup Error") && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(8,11,20,0.85)", gap: "0.5rem", pointerEvents: "none" }}>
                  <span style={{ fontSize: "2rem" }}>⚠️</span>
                  <span style={{ color: "#f87171", fontWeight: 600 }}>{analytics.faceStatus}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "center", padding: "0 1rem" }}>
                    {analytics.faceStatus === "Camera Error" ? "Allow camera access and reload." : "Check internet and reload."}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Dashboard analytics={analytics} />
        </div>
      </div>

      <FaceTracker videoRef={videoRef} canvasRef={canvasRef} analytics={analytics} setAnalytics={setAnalytics} />
    </div>
  );
}

// Join class page styles
const js = {
  page:     { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" },
  card:     { background: "var(--bg-card)", border: "1px solid var(--border-bright)", borderRadius: "20px", padding: "2.5rem 2rem", maxWidth: "420px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" },
  icon:     { fontSize: "3rem" },
  title:    { fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 },
  sub:      { fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", margin: 0 },
  inputRow: { display: "flex", gap: "0.5rem", width: "100%" },
  input:    { flex: 1, padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontFamily: "monospace", fontSize: "1.1rem", letterSpacing: "0.15em", outline: "none", textTransform: "uppercase" },
  btn:      { padding: "0.75rem 1.25rem", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "Inter,sans-serif", whiteSpace: "nowrap" },
  error:    { color: "#f87171", fontSize: "0.82rem", margin: 0 },
  hint:     { fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", margin: 0 },
};

export default function App() {
  return (
    <AuthProvider>
      <ClassroomApp />
    </AuthProvider>
  );
}
