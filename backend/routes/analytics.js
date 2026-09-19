const router = require("express").Router();
const { all } = require("../db");
const { authMiddleware, teacherOnly } = require("../middleware/auth");

function buildSummary(rows) {
  if (!rows.length) return { totalSessions: 0 };
  const total = rows.length;
  const avg = (key) => rows.reduce((s, r) => s + (r[key] || 0), 0) / total;

  const emotions = {
    happy: rows.reduce((s, r) => s + (r.emotion_happy || 0), 0),
    neutral: rows.reduce((s, r) => s + (r.emotion_neutral || 0), 0),
    confused: rows.reduce((s, r) => s + (r.emotion_confused || 0), 0),
    sad: rows.reduce((s, r) => s + (r.emotion_sad || 0), 0),
    surprised: rows.reduce((s, r) => s + (r.emotion_surprised || 0), 0),
    angry: rows.reduce((s, r) => s + (r.emotion_angry || 0), 0),
  };
  const dominantEmotion = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0][0];

  return {
    totalSessions: total,
    avgAttentionScore: Math.round(avg("attention_score")),
    avgBlinkCount: Math.round(avg("blink_count")),
    avgYawnCount: Math.round(avg("yawn_count")),
    avgDrowsinessEvents: +avg("drowsiness_events").toFixed(2),
    dominantEmotion,
    emotionTotals: emotions,
    lastSession: rows[0]?.created_at,
  };
}

// GET /api/analytics/me
router.get("/me", authMiddleware, (req, res) => {
  try {
    const rows = all("SELECT * FROM sessions WHERE student_id = ?", [req.user.id]);
    res.json(buildSummary(rows));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/student/:studentId — teacher only
router.get("/student/:studentId", authMiddleware, teacherOnly, (req, res) => {
  try {
    const rows = all("SELECT * FROM sessions WHERE student_id = ?", [req.params.studentId]);
    res.json(buildSummary(rows));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/class — teacher only
router.get("/class", authMiddleware, teacherOnly, (req, res) => {
  try {
    const rows = all(`
      SELECT student_id, student_name,
        COUNT(*) as total_sessions,
        ROUND(AVG(attention_score), 1) as avg_attention_score,
        SUM(drowsiness_events) as total_drowsiness,
        SUM(yawn_count) as total_yawns,
        ROUND(AVG(blink_count), 1) as avg_blink_count
      FROM sessions
      GROUP BY student_id
      ORDER BY avg_attention_score DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/leaderboard — teacher only
router.get("/leaderboard", authMiddleware, teacherOnly, (req, res) => {
  try {
    const rows = all(`
      SELECT student_id, student_name,
        COUNT(*) as total_sessions,
        ROUND(AVG(attention_score), 1) as avg_attention_score
      FROM sessions
      GROUP BY student_id
      ORDER BY avg_attention_score DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
