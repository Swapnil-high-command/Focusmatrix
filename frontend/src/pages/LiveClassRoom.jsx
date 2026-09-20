import { useEffect, useRef, useState, useCallback } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import { useSocket } from "../hooks/useSocket";

// ── Video tile ────────────────────────────────────────────────────────────────
function VideoTile({ stream, label, muted = false }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null;
  }, [stream]);
  return (
    <div style={s.tile}>
      <video ref={ref} autoPlay playsInline muted={muted} style={s.video} />
      <div style={s.tileLabel}>{label}</div>
      {!stream && (
        <div style={s.tileOverlay}>
          <div style={s.spinner} />
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Connecting…</span>
        </div>
      )}
    </div>
  );
}

// ── Teacher Live Room ─────────────────────────────────────────────────────────
export function TeacherLiveRoom({ user, onEnd }) {
  const localVideoRef = useRef(null);
  const [studentStreams, setStudentStreams] = useState({});
  const [camReady, setCamReady] = useState(false);
  const [error, setError]       = useState("");

  const onTrack = useCallback((socketId, stream) => {
    setStudentStreams((prev) => ({ ...prev, [socketId]: { ...prev[socketId], stream } }));
  }, []);

  // callPeer/handleAnswer/handleIce need to be stable refs so useSocket callbacks stay fresh
  const webrtcRef = useRef({});

  const { setLocalStream, callPeer, handleAnswer, handleIce, removePeer, closeAll } = useWebRTC({
    onTrack,
    sendOffer:  (to, offer)     => webrtcRef.current.sendOffer?.(to, offer),
    sendAnswer: (to, answer)    => webrtcRef.current.sendAnswer?.(to, answer),
    sendIce:    (to, candidate) => webrtcRef.current.sendIce?.(to, candidate),
  });

  // useSocket for teacher role — handles class:student:joined and webrtc signals
  const socket = useSocket({
    role: "teacher",
    onClassStudentJoined: async ({ socketId, studentName }) => {
      console.log("[TeacherRoom] student joined, calling peer:", socketId);
      setStudentStreams((prev) => ({ ...prev, [socketId]: { stream: null, name: studentName } }));
      await callPeer(socketId);
    },
    onClassStudentLeft: ({ socketId }) => {
      removePeer(socketId);
      setStudentStreams((prev) => { const n = { ...prev }; delete n[socketId]; return n; });
    },
    onWebrtcAnswer: ({ from, answer })    => handleAnswer(from, answer),
    onWebrtcIce:    ({ from, candidate }) => handleIce(from, candidate),
    onClassEnded:   () => { closeAll(); onEnd(); },
  });

  // Keep socket send functions in ref so WebRTC can use them
  useEffect(() => {
    webrtcRef.current = socket;
  });

  // Start teacher camera
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setLocalStream(stream);
        setCamReady(true);
        console.log("[TeacherRoom] camera ready");
      })
      .catch(() => setError("Camera/mic access denied. Please allow and retry."));
    return () => closeAll();
  }, []);

  const students = Object.entries(studentStreams);

  return (
    <div style={s.room}>
      <div style={s.roomHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={s.liveBadge}>● LIVE</span>
          <span style={{ fontWeight: 700, fontSize: "1rem" }}>Your Live Class</span>
          <span style={s.countBadge}>{students.length} student{students.length !== 1 ? "s" : ""}</span>
        </div>
        <button style={s.endBtn} onClick={() => { socket.endClass(); closeAll(); onEnd(); }}>
          ⏹ End Class
        </button>
      </div>

      {error && <div style={s.errorBar}>{error}</div>}

      <div style={s.roomBody}>
        <div style={s.section}>
          <p style={s.sectionLabel}>📷 Your Camera</p>
          <div style={s.tile}>
            <video ref={localVideoRef} autoPlay playsInline muted style={s.video} />
            <div style={s.tileLabel}>You (Teacher)</div>
            {!camReady && <div style={s.tileOverlay}><div style={s.spinner} /></div>}
          </div>
        </div>

        <div style={s.section}>
          <p style={s.sectionLabel}>👥 Students ({students.length})</p>
          {students.length === 0 ? (
            <div style={s.waitingBox}>
              <div style={{ fontSize: "2rem" }}>📡</div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Waiting for students to join…</p>
            </div>
          ) : (
            <div style={s.grid}>
              {students.map(([sid, { stream, name }]) => (
                <VideoTile key={sid} stream={stream} label={name} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Student Live Room ─────────────────────────────────────────────────────────
export function StudentLiveRoom({ user, onLeave }) {
  const localVideoRef = useRef(null);
  const [teacherStream, setTeacherStream] = useState(null);
  const [camReady, setCamReady] = useState(false);
  const [error, setError]       = useState("");

  const webrtcRef = useRef({});

  const onTrack = useCallback((_socketId, stream) => {
    console.log("[StudentRoom] received teacher stream");
    setTeacherStream(stream);
  }, []);

  const { setLocalStream, handleOffer, handleAnswer, handleIce, closeAll } = useWebRTC({
    onTrack,
    sendOffer:  (to, offer)     => webrtcRef.current.sendOffer?.(to, offer),
    sendAnswer: (to, answer)    => webrtcRef.current.sendAnswer?.(to, answer),
    sendIce:    (to, candidate) => webrtcRef.current.sendIce?.(to, candidate),
  });

  const socket = useSocket({
    role: "student",
    studentId:   user.id,
    studentName: user.name,
    onWebrtcOffer:  ({ from, offer })     => { console.log("[StudentRoom] got offer from", from); handleOffer(from, offer); },
    onWebrtcAnswer: ({ from, answer })    => handleAnswer(from, answer),
    onWebrtcIce:    ({ from, candidate }) => handleIce(from, candidate),
    onClassEnded:   () => { closeAll(); onLeave(); },
  });

  useEffect(() => {
    webrtcRef.current = socket;
  });

  // Start student camera
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setLocalStream(stream);
        setCamReady(true);
        console.log("[StudentRoom] camera ready");
      })
      .catch(() => setError("Camera/mic access denied."));
    return () => closeAll();
  }, []);

  return (
    <div style={s.room}>
      <div style={s.roomHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={s.liveBadge}>● LIVE</span>
          <span style={{ fontWeight: 700, fontSize: "1rem" }}>Live Class</span>
        </div>
        <button style={{ ...s.endBtn, background: "#6366f1" }}
          onClick={() => { socket.leaveClass(); closeAll(); onLeave(); }}>
          🚪 Leave Class
        </button>
      </div>

      {error && <div style={s.errorBar}>{error}</div>}

      <div style={s.roomBody}>
        <div style={s.section}>
          <p style={s.sectionLabel}>👨🏫 Teacher</p>
          <VideoTile stream={teacherStream} label="Teacher" />
        </div>

        <div style={s.section}>
          <p style={s.sectionLabel}>📷 Your Camera</p>
          <div style={s.tile}>
            <video ref={localVideoRef} autoPlay playsInline muted style={s.video} />
            <div style={s.tileLabel}>You ({user.name})</div>
            {!camReady && <div style={s.tileOverlay}><div style={s.spinner} /></div>}
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.5rem" }}>
            💡 AI tracking continues in the background
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  room:         { display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" },
  roomHeader:   { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.5rem", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 },
  liveBadge:    { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "999px", padding: "0.15rem 0.6rem", fontSize: "0.75rem", fontWeight: 700 },
  countBadge:   { background: "rgba(99,102,241,0.12)", color: "#818cf8", borderRadius: "999px", padding: "0.15rem 0.6rem", fontSize: "0.75rem", fontWeight: 600 },
  endBtn:       { padding: "0.4rem 1rem", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", fontFamily: "Inter,sans-serif" },
  errorBar:     { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", padding: "0.5rem 1.5rem", fontSize: "0.82rem", flexShrink: 0 },
  roomBody:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", padding: "1.25rem 1.5rem", flex: 1, minHeight: 0, overflow: "auto" },
  section:      { display: "flex", flexDirection: "column", gap: "0.5rem" },
  sectionLabel: { fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-muted)", margin: 0 },
  grid:         { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.6rem" },
  tile:         { position: "relative", borderRadius: "12px", overflow: "hidden", background: "var(--bg-card)", border: "1px solid var(--border)", aspectRatio: "16/9" },
  video:        { width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scaleX(-1)" },
  tileLabel:    { position: "absolute", bottom: 0, left: 0, right: 0, padding: "0.3rem 0.6rem", background: "linear-gradient(to top,rgba(0,0,0,0.7),transparent)", fontSize: "0.75rem", fontWeight: 600, color: "#fff" },
  tileOverlay:  { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "rgba(8,11,20,0.75)" },
  spinner:      { width: 28, height: 28, border: "3px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  waitingBox:   { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", minHeight: 180, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px" },
};
