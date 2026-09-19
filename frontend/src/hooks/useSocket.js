import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export function useSocket({
  role,
  studentId,
  studentName,
  onStudentAnalytics,
  onStudentAlert,
  onStudentLeft,
}) {
  const socketRef = useRef(null);

  // Keep callback refs fresh so socket always calls the latest version
  const onAnalyticsRef = useRef(onStudentAnalytics);
  const onAlertRef = useRef(onStudentAlert);
  const onLeftRef = useRef(onStudentLeft);

  useEffect(() => { onAnalyticsRef.current = onStudentAnalytics; }, [onStudentAnalytics]);
  useEffect(() => { onAlertRef.current = onStudentAlert; }, [onStudentAlert]);
  useEffect(() => { onLeftRef.current = onStudentLeft; }, [onStudentLeft]);

  useEffect(() => {
    let socket;
    try {
      socket = io(SOCKET_URL, { reconnectionAttempts: 3, timeout: 5000 });
      socketRef.current = socket;

      socket.on("connect", () => {
        if (role === "student") {
          socket.emit("student:join", { studentId, studentName });
        } else if (role === "teacher") {
          socket.emit("teacher:join");
        }
      });

      socket.on("connect_error", () => {});

      socket.on("student:analytics", (data) => onAnalyticsRef.current?.({ ...data, studentId: String(data.studentId) }));
      socket.on("student:alert", (data) => onAlertRef.current?.(data));
      socket.on("student:left", (data) => onLeftRef.current?.({ ...data, studentId: String(data.studentId) }));

    } catch {
      // Socket unavailable — app still works without real-time
    }

    return () => socket?.disconnect();
  }, [role, studentId, studentName]);

  function emitAnalytics(data) {
    socketRef.current?.emit("analytics:update", data);
  }

  return { emitAnalytics };
}
