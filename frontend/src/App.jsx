import "./App.css";
import { useRef, useState, useEffect } from "react";

import FaceTracker from "./components/FaceTracker";
import Dashboard from "./components/Dashboard";
import AuthPage from "./pages/AuthPage";
import SessionHistory from "./pages/SessionHistory";
import TeacherDashboard from "./pages/TeacherDashboard";
import { StudentLiveRoom } from "./pages/LiveClassRoom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useSocket } from "./hooks/useSocket";
import { saveSession } from "./api";
import { calculateAttentionScore } from "./utils/attentionScore";
import { getStudentStatus } from "./utils/studentStatus";

function ClassroomApp() {
  const { user, logout } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [page, setPage] = useState("monitor");
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [saving, setSaving] = useState(false);
  const [liveClassActive, setLiveClassActive] = useState(false);
  const [inClass, setInClass] = useState(false);
  const [classError, setClassError] = useState("");

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
    onClassState:       (d) => setLiveClassActive(!!d),
    onClassStarted:     ()  => setLiveClassActive(true),
    onClassEnded:       ()  => { setLiveClassActive(false); setInClass(false); },
    onClassJoinSuccess: ()  => { setInClass(true); setClassError(""); },
    onClassJoinError:   ({ message }) => setClassError(message),
  });

  useEffect(() => {
    if (user?.role !== "student") return;
    const id = setInterval(() => {
      socket.emitAnalytics({ ...analytics, attentionScore: calculateAttentionScore(analytics) });
    }, 3000);
    return () => clearInterval(id);
  }, [analytics, user]);

  async function handleEndSession() {
    setSaving(true);
    setSessionActive(false);
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
    } catch {
      alert("❌ Failed to save session. Is the backend running?");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <AuthPage />;

  // Student in live class — show full-screen live room with the SAME socket
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

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="logo-icon">🎓</span>
          AI Classroom Monitor
        </div>

        <div className="navbar-right">
          <div className="nav-user">
            <div className="avatar">{initials}</div>
            {user.name}
          </div>

          {user.role === "student" && (
            <>
              <button className={`nav-btn ${page === "monitor" ? "active" : ""}`} onClick={() => setPage("monitor")}>
                📷 <span className="label">Monitor</span>
              </button>
              <button className={`nav-btn ${page === "history" ? "active" : ""}`} onClick={() => setPage("history")}>
                📋 <span className="label">History</span>
              </button>
            </>
          )}

          {user.role === "teacher" && (
            <button className={`nav-btn ${page === "teacher" ? "active" : ""}`} onClick={() => setPage("teacher")}>
              👨🏫 <span className="label">Dashboard</span>
            </button>
          )}

          <button className="nav-btn danger" onClick={logout}>Logout</button>
        </div>
      </nav>

      {/* ── Pages ── */}
      {page === "history" && <SessionHistory />}
      {page === "teacher" && <TeacherDashboard user={user} />}

      {/* ── Monitor (always mounted to preserve counts) ── */}
      <div style={{ display: page === "monitor" ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* Session bar */}
        <div className="session-bar">
          {!sessionActive ? (
            <button className="session-btn start" onClick={() => { setSessionActive(true); setSessionStart(Date.now()); }}>
              ▶ Start Session
            </button>
          ) : (
            <button className="session-btn stop" onClick={handleEndSession} disabled={saving}>
              {saving ? "⏳ Saving..." : "⏹ End & Save"}
            </button>
          )}
          {sessionActive && (
            <div className="recording-badge">
              <div className="recording-dot" />
              Recording
            </div>
          )}

          {/* Live Class join for students */}
          {user?.role === "student" && liveClassActive && !inClass && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button className="session-btn start" style={{ background: "#6366f1" }} onClick={() => setInClass(true)}>
                🏫 Join Live Class
              </button>
              {classError && <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>{classError}</span>}
            </div>
          )}
        </div>

        {/* Camera + Dashboard */}
        <div className="main-content">
          <div className="camera-section">
            <div className="camera-label">🎥 Live Camera</div>
            <div className="video-box">
              <video ref={videoRef} autoPlay muted playsInline />
              <canvas ref={canvasRef} />
              <div className="video-overlay">
                <div className={`video-status-badge ${analytics.faceStatus === "Detected" ? "detected" : "missing"}`}>
                  <span>{analytics.faceStatus === "Detected" ? "●" : "○"}</span>
                  {analytics.faceStatus}
                </div>
                <div className={`video-status-badge ${analytics.faceStatus === "Detected" ? "detected" : "missing"}`}>
                  {analytics.emotion}
                </div>
              </div>
              {/* Loading overlay while models initialise */}
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
                    {analytics.faceStatus === "Camera Error" ? "Allow camera access in your browser and reload." : "Check your internet connection and reload."}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Dashboard analytics={analytics} />
        </div>
      </div>

      {/* FaceTracker always mounted */}
      <FaceTracker
        videoRef={videoRef}
        canvasRef={canvasRef}
        analytics={analytics}
        setAnalytics={setAnalytics}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ClassroomApp />
    </AuthProvider>
  );
}
