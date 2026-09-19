const router = require("express").Router();
const { run, get, all } = require("../db");
const { authMiddleware, teacherOnly } = require("../middleware/auth");

function toParams(data, studentId, studentName) {
  return [
    studentId,
    studentName,
    data.startedAt || new Date().toISOString(),
    data.endedAt || new Date().toISOString(),
    data.durationMs || 0,
    data.faceVisibleTime || 0,
    data.faceMissingTime || 0,
    data.eyeContactTime || 0,
    data.lookingAwayTime || 0,
    data.blinkCount || 0,
    data.longestEyeClosure || 0,
    data.drowsinessEvents || 0,
    data.yawnCount || 0,
    data.totalYawnTime || 0,
    data.longestYawn || 0,
    data.emotions?.happy || 0,
    data.emotions?.neutral || 0,
    data.emotions?.confused || 0,
    data.emotions?.sad || 0,
    data.emotions?.surprised || 0,
    data.emotions?.angry || 0,
    data.headPose?.straight || 0,
    data.headPose?.left || 0,
    data.headPose?.right || 0,
    data.headPose?.up || 0,
    data.headPose?.down || 0,
    JSON.stringify(data.gestureCounts || {}),
    data.attentionScore || 0,
    data.studentStatus || "Unknown",
    JSON.stringify(data.timeline || []),
    JSON.stringify(data.alerts || []),
  ];
}

function fromRow(row) {
  if (!row) return null;
  return {
    ...row,
    gesture_counts: JSON.parse(row.gesture_counts || "{}"),
    timeline: JSON.parse(row.timeline || "[]"),
    alerts: JSON.parse(row.alerts || "[]"),
  };
}

// POST /api/sessions
router.post("/", authMiddleware, (req, res) => {
  try {
    const result = run(
      `INSERT INTO sessions (
        student_id, student_name, started_at, ended_at, duration_ms,
        face_visible_time, face_missing_time, eye_contact_time, looking_away_time,
        blink_count, longest_eye_closure, drowsiness_events,
        yawn_count, total_yawn_time, longest_yawn,
        emotion_happy, emotion_neutral, emotion_confused, emotion_sad, emotion_surprised, emotion_angry,
        head_straight, head_left, head_right, head_up, head_down,
        gesture_counts, attention_score, student_status, timeline, alerts
      ) VALUES (${Array(31).fill("?").join(",")})`,
      toParams(req.body, req.user.id, req.user.name)
    );
    res.status(201).json({ id: result.lastInsertRowid, message: "Session saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sessions/me
router.get("/me", authMiddleware, (req, res) => {
  try {
    const rows = all("SELECT * FROM sessions WHERE student_id = ? ORDER BY created_at DESC", [req.user.id]);
    res.json(rows.map(fromRow));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sessions/me/:id
router.get("/me/:id", authMiddleware, (req, res) => {
  try {
    const row = get("SELECT * FROM sessions WHERE id = ? AND student_id = ?", [req.params.id, req.user.id]);
    if (!row) return res.status(404).json({ message: "Session not found" });
    res.json(fromRow(row));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sessions/all — teacher only
router.get("/all", authMiddleware, teacherOnly, (req, res) => {
  try {
    const rows = all("SELECT * FROM sessions ORDER BY created_at DESC");
    res.json(rows.map(fromRow));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sessions/student/:studentId — teacher only
router.get("/student/:studentId", authMiddleware, teacherOnly, (req, res) => {
  try {
    const rows = all("SELECT * FROM sessions WHERE student_id = ? ORDER BY created_at DESC", [req.params.studentId]);
    res.json(rows.map(fromRow));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/sessions/:id
router.delete("/:id", authMiddleware, (req, res) => {
  try {
    const row = get("SELECT id FROM sessions WHERE id = ? AND student_id = ?", [req.params.id, req.user.id]);
    if (!row) return res.status(404).json({ message: "Session not found" });
    run("DELETE FROM sessions WHERE id = ?", [req.params.id]);
    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
