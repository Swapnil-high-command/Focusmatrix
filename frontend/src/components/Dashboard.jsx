import { useState } from "react";
import { calculateAttentionScore } from "../utils/attentionScore";
import { getStudentStatus } from "../utils/studentStatus";

function AttentionRing({ score }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <svg className="ring-svg" width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx="30" cy="30" r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 30 30)"
        style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.4s ease" }}
      />
      <text x="30" y="34" textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">
        {score}%
      </text>
    </svg>
  );
}

function StatCard({ label, value, valueClass }) {
  return (
    <div className="card">
      <span>{label}</span>
      <strong className={valueClass}>{value}</strong>
    </div>
  );
}

export default function Dashboard({ analytics }) {
  const score = calculateAttentionScore(analytics);
  const student = getStudentStatus(analytics);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const faceVisible = ((analytics.faceVisibleTime || 0) / 1000).toFixed(1);
  const faceMissing = ((analytics.faceMissingTime || 0) / 1000).toFixed(1);
  const lookingAway = ((analytics.lookingAwayTime || 0) / 1000).toFixed(1);

  return (
    <div className="dashboard-container">

      {/* ── Status panel ── */}
      <div className="dashboard-panel">
        <p className="panel-title">📊 Live Status</p>

        <div className="attention-ring-wrap">
          <AttentionRing score={score} />
          <div className="ring-info">
            <div className="ring-label">Attention Score</div>
            <div className="ring-status" style={{ color: student.color }}>
              {student.emoji} {student.status}
            </div>
          </div>
        </div>

        <StatCard label="😀 Face" value={analytics.faceStatus} />
        <StatCard label="👀 Eye Contact" value={analytics.eyeContact} />
        <StatCard label="🧭 Head Pose" value={analytics.headPose} />
        <StatCard label="😊 Emotion" value={analytics.emotion} />
        <StatCard label="🤚 Gesture" value={analytics.currentGesture || "None"} valueClass={analytics.currentGesture && analytics.currentGesture !== "None" ? "good" : ""} />
      </div>

      {/* ── Analytics dropdown panel ── */}
      <div className="dashboard-panel">
        <button
          onClick={() => setAnalyticsOpen(o => !o)}
          style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <p className="panel-title" style={{ margin: 0 }}>📈 Analytics</p>
          <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "inline-block", transition: "transform 0.25s", transform: analyticsOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
        </button>

        {analyticsOpen && (
          <div style={{ marginTop: "0.5rem" }}>
            <StatCard label="😉 Blinks" value={analytics.blinkCount} />
            <StatCard label="🥱 Yawns" value={analytics.yawnCount} />
            <StatCard label="⏱ Yawn Time" value={`${(analytics.totalYawnTime || 0).toFixed(1)}s`} />
            <StatCard label="😴 Sleep Events" value={analytics.drowsinessEvents || 0} valueClass={analytics.drowsinessEvents > 0 ? "danger" : ""} />
            <StatCard label="👁 Longest Closure" value={`${(analytics.longestEyeClosure || 0).toFixed(1)}s`} />
            <StatCard label="👤 Face Visible" value={`${faceVisible}s`} valueClass="good" />
            <StatCard label="🙈 Face Missing" value={`${faceMissing}s`} valueClass={parseFloat(faceMissing) > 5 ? "warning" : ""} />
            <StatCard label="👀 Looking Away" value={`${lookingAway}s`} valueClass={parseFloat(lookingAway) > 10 ? "warning" : ""} />
          </div>
        )}
      </div>

    </div>
  );
}
