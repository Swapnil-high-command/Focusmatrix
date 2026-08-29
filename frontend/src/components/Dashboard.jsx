 import "./Dashboard.css";
import { calculateAttentionScore } from "../utils/attentionScore";
import { getStudentStatus } from "../utils/studentStatus";

function Dashboard({ analytics }) {
  const attentionScore = calculateAttentionScore(analytics);
  const student = getStudentStatus(analytics);

  return (
    <div className="dashboard-container">

      <div className="dashboard-panel">

        <h2>📊 Live Status</h2>

        <div className="card">
          <span>🎯 Attention Score</span>
          <strong
            className={
              attentionScore >= 80
                ? "good"
                : attentionScore >= 60
                ? "warning"
                : "danger"
            }
          >
            {attentionScore}%
          </strong>
        </div>

        <div className="card">
          <span>🧠 Student Status</span>
          <strong style={{ color: student.color }}>
            {student.emoji} {student.status}
          </strong>
        </div>

        <div className="card">
          <span>😀 Face Status</span>
          <strong>{analytics.faceStatus}</strong>
        </div>

        <div className="card">
          <span>👀 Eye Contact</span>
          <strong>{analytics.eyeContact}</strong>
        </div>

        <div className="card">
          <span>🎯 Head Pose</span>
          <strong>{analytics.headPose}</strong>
        </div>

        <div className="card">
          <span>😊 Emotion</span>
          <strong>{analytics.emotion}</strong>
        </div>

      </div>


      <div className="dashboard-panel">

        <h2>📈 Analytics</h2>

        <div className="card">
          <span>😉 Blink Count</span>
          <strong>{analytics.blinkCount}</strong>
        </div>

        <div className="card">
          <span>🥱 Yawn Count</span>
          <strong>{analytics.yawnCount}</strong>
        </div>

        <div className="card">
          <span>⏱ Total Yawn Time</span>
          <strong>
            {(analytics.totalYawnTime || 0).toFixed(2)} sec
          </strong>
        </div>

        <div className="card">
          <span>🏆 Longest Yawn</span>
          <strong>
            {(analytics.longestYawn || 0).toFixed(2)} sec
          </strong>
        </div>

        <div className="card">
          <span>😴 Sleep Events</span>
          <strong>{analytics.drowsinessEvents || 0}</strong>
        </div>

        <div className="card">
          <span>👁 Longest Eye Closure</span>
          <strong>
            {(analytics.longestEyeClosure || 0).toFixed(2)} sec
          </strong>
        </div>

        <div className="card">
          <span>👤 Face Visible</span>
          <strong>
            {((analytics.faceVisibleTime || 0) / 1000).toFixed(1)} sec
          </strong>
        </div>

        <div className="card">
          <span>🙈 Face Missing</span>
          <strong>
            {((analytics.faceMissingTime || 0) / 1000).toFixed(1)} sec
          </strong>
        </div>

        <div className="card">
          <span>👀 Looking Away</span>
          <strong>
            {((analytics.lookingAwayTime || 0) / 1000).toFixed(1)} sec
          </strong>
        </div>

      </div>

      <div className="dashboard-panel">

        <h2>🤚 Gestures</h2>

        <div className="card">
          <span>✋ Current</span>
          <strong>{analytics.currentGesture || "None"}</strong>
        </div>

        {Object.entries(analytics.gestureCounts || {}).map(([gesture, count]) => (
          <div className="card" key={gesture}>
            <span>{gesture}</span>
            <strong className="good">{count}×</strong>
          </div>
        ))}

        {Object.keys(analytics.gestureCounts || {}).length === 0 && (
          <div className="card">
            <span style={{ opacity: 0.5 }}>No gestures yet</span>
          </div>
        )}

      </div>

    </div>
  );
}

export default Dashboard;