const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "classroom.db");

const db = new Database(DB_PATH);

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      student_name TEXT,
      started_at TEXT,
      ended_at TEXT,
      duration_ms INTEGER DEFAULT 0,
      face_visible_time REAL DEFAULT 0,
      face_missing_time REAL DEFAULT 0,
      eye_contact_time REAL DEFAULT 0,
      looking_away_time REAL DEFAULT 0,
      blink_count INTEGER DEFAULT 0,
      longest_eye_closure REAL DEFAULT 0,
      drowsiness_events INTEGER DEFAULT 0,
      yawn_count INTEGER DEFAULT 0,
      total_yawn_time REAL DEFAULT 0,
      longest_yawn REAL DEFAULT 0,
      emotion_happy INTEGER DEFAULT 0,
      emotion_neutral INTEGER DEFAULT 0,
      emotion_confused INTEGER DEFAULT 0,
      emotion_sad INTEGER DEFAULT 0,
      emotion_surprised INTEGER DEFAULT 0,
      emotion_angry INTEGER DEFAULT 0,
      head_straight INTEGER DEFAULT 0,
      head_left INTEGER DEFAULT 0,
      head_right INTEGER DEFAULT 0,
      head_up INTEGER DEFAULT 0,
      head_down INTEGER DEFAULT 0,
      gesture_counts TEXT DEFAULT '{}',
      attention_score INTEGER DEFAULT 0,
      student_status TEXT DEFAULT 'Unknown',
      timeline TEXT DEFAULT '[]',
      alerts TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);

  console.log("✅ SQLite (better-sqlite3) database ready");
  return Promise.resolve();
}

function run(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.run(params);
  return { lastInsertRowid: result.lastInsertRowid };
}

function get(sql, params = []) {
  return db.prepare(sql).get(params) ?? null;
}

function all(sql, params = []) {
  return db.prepare(sql).all(params);
}

module.exports = { initDB, run, get, all };
