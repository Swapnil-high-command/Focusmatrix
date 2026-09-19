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

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

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
    if (socket.studentName) {
      io.to("teachers").emit("student:left", {
        studentId: socket.studentId,
        studentName: socket.studentName,
      });
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
