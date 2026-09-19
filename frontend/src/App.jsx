import "./App.css";
import { useRef, useState, useEffect } from "react";

import FaceTracker from "./components/FaceTracker";
import Dashboard from "./components/Dashboard";
import AuthPage from "./pages/AuthPage";
import SessionHistory from "./pages/SessionHistory";
import TeacherDashboard from "./pages/TeacherDashboard";
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

  const [analytics, setAnalytics] = useState({
    faceStatus: "No Face",
    eyeContact: "Unknown",
    blinkCount: 0,
    headPose: "Unknown",
    emotion: "Neutral",
    faceVisibleTime: 0,
    faceMissingTime: 0,
    eyeContactTime: 0,
    lookingAwayTime: 0,
    longestEyeClosure: 0,
    drowsinessEvents: 0,
    yawnCount: 0,
    totalYawnTime: 0,
    longestYawn: 0,
    currentGesture: "None",
    gestureCounts: {},
  });

  const { emitAnalytics } = useSocket({
    role: user?.role,
    studentId: user?.id,
    studentName: user?.name,
  });

  useEffect(() => {
    if (user?.role !== "student") return;
    const interval = setInterval(() => {
      emitAnalytics({ ...analytics, attentionScore: calculateAttentionScore(analytics) });
    }, 3000);
    return () => clearInterval(interval);
  }, [analytics, user]);

  async function handleEndSession() {
    setSaving(true);
    setSessionActive(false);
    const attentionScore = calculateAttentionScore(analytics);
    const studentStatus = getStudentStatus(analytics).status;
    try {
      await saveSession({
        ...analytics,
        attentionScore,
        studentStatus,
        startedAt: new Date(sessionStart).toISOString(),
        endedAt: new Date().toISOString(),
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
      {page === "teacher" && <TeacherDashboard />}

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
