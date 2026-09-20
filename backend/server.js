require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { initDB } = require("./db");

const authRoutes = require("./routes/auth");
const sessionRoutes = require("./routes/sessions");
const analyticsRoutes = require("./routes/analytics");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ["GET", "POST"] },
});

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (_, res) => res.json({ status: "AI Classroom Backend running 🚀" }));

// ─── Socket.io ─────────────────────────────────────────────────────────────────
const ALERT_THRESHOLDS = { attentionScore: 40, drowsinessEvents: 1, yawnCount: 3 };
const MAX_STUDENTS = 10; // ← increase this to allow more students

// Live class state
let liveClass = null; // { teacherName, startedAt, studentCount }

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Send current class state to newly connected client
  socket.emit("class:state", liveClass);

  socket.on("student:join", ({ studentId, studentName }) => {
    socket.studentId = String(studentId);
    socket.studentName = studentName;
    socket.join("students");
    console.log(`👤 Student joined: ${studentName} (id: ${socket.studentId})`);
  });

  socket.on("teacher:join", () => {
    socket.join("teachers");
    console.log(`👨🏫 Teacher joined monitoring`);
  });

  // ── Live Class ──────────────────────────────────────────────────────────────
  socket.on("class:start", ({ teacherName }) => {
    liveClass = { teacherName, teacherSocketId: socket.id, startedAt: Date.now(), studentCount: 0 };
    socket.join("liveclass");
    io.emit("class:started", liveClass);
    console.log(`🏫 Live class started by ${teacherName}`);
  });

  socket.on("class:end", () => {
    liveClass = null;
    io.emit("class:ended");
    console.log(`🏫 Live class ended`);
  });

  socket.on("class:student:join", ({ studentId, studentName }) => {
    if (!liveClass) { socket.emit("class:join:error", { message: "No active class" }); return; }
    if (liveClass.studentCount >= MAX_STUDENTS) { socket.emit("class:join:error", { message: `Class is full (max ${MAX_STUDENTS} students)` }); return; }
    liveClass.studentCount++;
    socket.inClass = true;
    socket.join("liveclass");
    socket.emit("class:join:success");
    // Tell teacher a new student joined so teacher can initiate WebRTC offer
    io.to(liveClass.teacherSocketId).emit("class:student:joined", { studentId: String(studentId), studentName, socketId: socket.id, count: liveClass.studentCount });
    // Tell student the teacher's socketId so student can send offer too
    socket.emit("class:teacher:info", { teacherSocketId: liveClass.teacherSocketId });
    console.log(`📚 ${studentName} joined live class (${liveClass.studentCount}/${MAX_STUDENTS})`);
  });

  socket.on("class:student:leave", () => {
    if (liveClass && socket.inClass) {
      liveClass.studentCount = Math.max(0, liveClass.studentCount - 1);
      socket.inClass = false;
      socket.leave("liveclass");
      if (liveClass) io.to(liveClass.teacherSocketId).emit("class:student:left", { studentId: socket.studentId, studentName: socket.studentName, socketId: socket.id, count: liveClass.studentCount });
    }
  });

  // ── WebRTC Signaling ────────────────────────────────────────────────────────
  // Forward offer/answer/ice to the target socket
  socket.on("webrtc:offer",     ({ to, offer })     => io.to(to).emit("webrtc:offer",     { from: socket.id, offer }));
  socket.on("webrtc:answer",    ({ to, answer })    => io.to(to).emit("webrtc:answer",    { from: socket.id, answer }));
  socket.on("webrtc:ice",       ({ to, candidate }) => io.to(to).emit("webrtc:ice",       { from: socket.id, candidate }));

  // ── Analytics ───────────────────────────────────────────────────────────────
  socket.on("analytics:update", (data) => {
    io.to("teachers").emit("student:analytics", {
      studentId: socket.studentId,
      studentName: socket.studentName,
      ...data,
      timestamp: Date.now(),
    });

    const alerts = [];
    if (data.attentionScore < ALERT_THRESHOLDS.attentionScore)
      alerts.push(`⚠️ Low attention (${data.attentionScore}%)`);
    if (data.drowsinessEvents >= ALERT_THRESHOLDS.drowsinessEvents)
      alerts.push(`😴 Student may be sleeping`);
    if (data.yawnCount >= ALERT_THRESHOLDS.yawnCount)
      alerts.push(`🥱 Excessive yawning (${data.yawnCount} yawns)`);

    if (alerts.length) {
      io.to("teachers").emit("student:alert", {
        studentId: socket.studentId,
        studentName: socket.studentName,
        alerts,
        timestamp: Date.now(),
      });
    }
  });

  socket.on("disconnect", () => {
    if (socket.inClass && liveClass) {
      liveClass.studentCount = Math.max(0, liveClass.studentCount - 1);
      if (liveClass) io.to(liveClass.teacherSocketId).emit("class:student:left", { studentId: socket.studentId, studentName: socket.studentName, socketId: socket.id, count: liveClass.studentCount });
    }
    if (socket.studentName) {
      io.to("teachers").emit("student:left", { studentId: socket.studentId, studentName: socket.studentName });
    }
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

initDB().then(() => {
  server.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
});
