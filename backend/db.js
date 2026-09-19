const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "classroom.db");

let db = null;

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
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

  persist();
  console.log("✅ SQLite (sql.js) database ready");
}

// Save DB to disk after every write
function persist() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Run a write statement and persist
function run(sql, params = []) {
  db.run(sql, params);
  persist();
  // Get last insert rowid
  const result = db.exec("SELECT last_insert_rowid() as id");
  return { lastInsertRowid: result[0]?.values[0][0] ?? null };
}

// Get one row
function get(sql, params = []) {
  const result = db.exec(sql, params);
  if (!result.length || !result[0].values.length) return null;
  const { columns, values } = result[0];
  return Object.fromEntries(columns.map((c, i) => [c, values[0][i]]));
}

// Get all rows
function all(sql, params = []) {
  const result = db.exec(sql, params);
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
}

module.exports = { initDB, run, get, all };
