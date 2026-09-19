const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token");
}

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: headers(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// Auth
export const register = (body) =>
  request("/auth/register", { method: "POST", body: JSON.stringify(body) });

export const login = (body) =>
  request("/auth/login", { method: "POST", body: JSON.stringify(body) });

// Sessions
export const saveSession = (sessionData) =>
  request("/sessions", { method: "POST", body: JSON.stringify(sessionData) });

export const getMySessions = () => request("/sessions/me");

export const getMySession = (id) => request(`/sessions/me/${id}`);

export const deleteSession = (id) =>
  request(`/sessions/${id}`, { method: "DELETE" });

export const getAllSessions = () => request("/sessions/all");

export const getStudentSessions = (studentId) =>
  request(`/sessions/student/${studentId}`);

// Analytics
export const getMyAnalytics = () => request("/analytics/me");

export const getStudentAnalytics = (studentId) =>
  request(`/analytics/student/${studentId}`);

export const getClassAnalytics = () => request("/analytics/class");

export const getLeaderboard = () => request("/analytics/leaderboard");
