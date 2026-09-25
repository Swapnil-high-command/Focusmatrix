import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

 const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
// ── Single socket instance ────────────────────────────────────────────────────
let _socket = null;
function getSocket() {
  if (!_socket) {
    _socket = io(SOCKET_URL, { reconnectionAttempts: 10, timeout: 8000 });
  }
  return _socket;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useSocket({
  role, studentId, studentName,
  onStudentAnalytics, onStudentAlert, onStudentLeft,
  onClassStarted, onClassEnded, onClassState,
  onClassStudentJoined, onClassStudentLeft,
  onClassJoinError, onClassJoinSuccess, onClassTeacherInfo,
  onWebrtcOffer, onWebrtcAnswer, onWebrtcIce,
} = {}) {

  // Always-fresh ref — no stale closures
  const cb = useRef({});
  cb.current = {
    onStudentAnalytics, onStudentAlert, onStudentLeft,
    onClassStarted, onClassEnded, onClassState,
    onClassStudentJoined, onClassStudentLeft,
    onClassJoinError, onClassJoinSuccess, onClassTeacherInfo,
    onWebrtcOffer, onWebrtcAnswer, onWebrtcIce,
  };

  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      if (role === "student") socket.emit("student:join", { studentId, studentName });
      else if (role === "teacher") socket.emit("teacher:join");
    }
    if (socket.connected) onConnect();
    socket.on("connect", onConnect);

    // Each handler calls cb.current so it always uses the latest callback
    const h = {
      "student:analytics":    (d) => cb.current.onStudentAnalytics?.({ ...d, studentId: String(d.studentId) }),
      "student:alert":        (d) => cb.current.onStudentAlert?.(d),
      "student:left":         (d) => cb.current.onStudentLeft?.({ ...d, studentId: String(d.studentId) }),
      "class:state":          (d) => cb.current.onClassState?.(d),
      "class:started":        (d) => cb.current.onClassStarted?.(d),
      "class:ended":          (d) => cb.current.onClassEnded?.(d),
      "class:student:joined": (d) => cb.current.onClassStudentJoined?.(d),
      "class:student:left":   (d) => cb.current.onClassStudentLeft?.(d),
      "class:join:error":     (d) => cb.current.onClassJoinError?.(d),
      "class:join:success":   (d) => cb.current.onClassJoinSuccess?.(d),
      "class:teacher:info":   (d) => cb.current.onClassTeacherInfo?.(d),
      "webrtc:offer":         (d) => cb.current.onWebrtcOffer?.(d),
      "webrtc:answer":        (d) => cb.current.onWebrtcAnswer?.(d),
      "webrtc:ice":           (d) => cb.current.onWebrtcIce?.(d),
    };

    Object.entries(h).forEach(([ev, fn]) => socket.on(ev, fn));

    return () => {
      socket.off("connect", onConnect);
      Object.entries(h).forEach(([ev, fn]) => socket.off(ev, fn));
    };
  }, [role, studentId, studentName]);

  const emit = (ev, data) => getSocket().emit(ev, data);

  return {
    emitAnalytics: (data)          => emit("analytics:update", data),
    startClass:    (name)          => emit("class:start", { teacherName: name }),
    endClass:      ()              => emit("class:end"),
    joinClass:     ()              => emit("class:student:join", { studentId, studentName }),
    leaveClass:    ()              => emit("class:student:leave"),
    sendOffer:     (to, offer)     => emit("webrtc:offer",  { to, offer }),
    sendAnswer:    (to, answer)    => emit("webrtc:answer", { to, answer }),
    sendIce:       (to, candidate) => emit("webrtc:ice",    { to, candidate }),
  };
}
