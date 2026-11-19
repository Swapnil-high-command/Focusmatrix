import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const socket = io(SOCKET_URL, { reconnectionAttempts: 10, timeout: 8000 });

const _cb = {};

socket.on("student:analytics",    (d) => _cb.onStudentAnalytics?.({ ...d, studentId: String(d.studentId) }));
socket.on("student:alert",        (d) => _cb.onStudentAlert?.(d));
socket.on("student:left",         (d) => _cb.onStudentLeft?.({ ...d, studentId: String(d.studentId) }));
socket.on("class:state",          (d) => _cb.onClassState?.(d));
socket.on("class:started",        (d) => { console.log("[socket] class:started", d); _cb.onClassStarted?.(d); });
socket.on("class:ended",          (d) => _cb.onClassEnded?.(d));
socket.on("class:student:joined", (d) => _cb.onClassStudentJoined?.(d));
socket.on("class:student:left",   (d) => _cb.onClassStudentLeft?.(d));
socket.on("class:join:error",     (d) => _cb.onClassJoinError?.(d));
socket.on("class:join:success",   (d) => _cb.onClassJoinSuccess?.(d));
socket.on("class:teacher:info",   (d) => _cb.onClassTeacherInfo?.(d));
socket.on("class:code",           (d) => _cb.onClassCode?.(d));
socket.on("webrtc:offer",         (d) => _cb.onWebrtcOffer?.(d));
socket.on("webrtc:answer",        (d) => _cb.onWebrtcAnswer?.(d));
socket.on("webrtc:ice",           (d) => _cb.onWebrtcIce?.(d));

export function useSocket({
  role, studentId, studentName,
  onStudentAnalytics, onStudentAlert, onStudentLeft,
  onClassStarted, onClassEnded, onClassState,
  onClassStudentJoined, onClassStudentLeft,
  onClassJoinError, onClassJoinSuccess, onClassTeacherInfo, onClassCode,
  onWebrtcOffer, onWebrtcAnswer, onWebrtcIce,
} = {}) {

  // Always keep callbacks fresh
  _cb.onStudentAnalytics   = onStudentAnalytics;
  _cb.onStudentAlert       = onStudentAlert;
  _cb.onStudentLeft        = onStudentLeft;
  _cb.onClassState         = onClassState;
  _cb.onClassStarted       = onClassStarted;
  _cb.onClassEnded         = onClassEnded;
  _cb.onClassStudentJoined = onClassStudentJoined;
  _cb.onClassStudentLeft   = onClassStudentLeft;
  _cb.onClassJoinError     = onClassJoinError;
  _cb.onClassJoinSuccess   = onClassJoinSuccess;
  _cb.onClassTeacherInfo   = onClassTeacherInfo;
  _cb.onClassCode          = onClassCode;
  _cb.onWebrtcOffer        = onWebrtcOffer;
  _cb.onWebrtcAnswer       = onWebrtcAnswer;
  _cb.onWebrtcIce          = onWebrtcIce;

  useEffect(() => {
    if (!role) return;

    function doJoin() {
      if (role === "teacher") {
        console.log("[socket] emitting teacher:join");
        socket.emit("teacher:join");
      } else if (role === "student") {
        socket.emit("student:join", { studentId, studentName });
      }
    }

    // Always emit immediately — whether connected or not
    // socket.io queues emits until connected automatically
    doJoin();

    // Also re-emit on reconnect
    socket.on("connect", doJoin);
    return () => socket.off("connect", doJoin);

  }, [role, studentId, studentName]);

  return {
    emitAnalytics: (data)          => socket.emit("analytics:update", data),
    startClass:    (name)          => { console.log("[socket] emitting class:start", name); socket.emit("class:start", { teacherName: name }); },
    endClass:      ()              => socket.emit("class:end"),
    joinClass:     (classCode)     => socket.emit("class:student:join", { studentId, studentName, classCode }),
    readyInClass:  ()              => socket.emit("class:student:ready"),
    leaveClass:    ()              => socket.emit("class:student:leave"),
    sendOffer:     (to, offer)     => socket.emit("webrtc:offer",  { to, offer }),
    sendAnswer:    (to, answer)    => socket.emit("webrtc:answer", { to, answer }),
    sendIce:       (to, candidate) => socket.emit("webrtc:ice",    { to, candidate }),
  };
}
