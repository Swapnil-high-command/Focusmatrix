import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.name, form.email, form.password, form.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      {/* Background blobs */}
      <div style={{ ...s.blob, top: "-120px", left: "-100px", background: "rgba(99,102,241,0.15)" }} />
      <div style={{ ...s.blob, bottom: "-100px", right: "-80px", background: "rgba(168,85,247,0.12)", width: "400px", height: "400px" }} />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>🎓</div>
          <h1 style={s.logoText}>AI Classroom Monitor</h1>
          <p style={s.logoSub}>Intelligent student engagement tracking</p>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(isLogin ? s.tabActive : {}) }} onClick={() => setIsLogin(true)}>Login</button>
          <button style={{ ...s.tab, ...(!isLogin ? s.tabActive : {}) }} onClick={() => setIsLogin(false)}>Register</button>
        </div>

        {error && (
          <div style={s.errorBox}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          {!isLogin && (
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input style={s.input} name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
            </div>
          )}

          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input style={s.input} name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
          </div>

          {!isLogin && (
            <div style={s.field}>
              <label style={s.label}>Role</label>
              <select style={s.input} name="role" value={form.role} onChange={handleChange}>
                <option value="student">🎒 Student</option>
                <option value="teacher">👨🏫 Teacher</option>
              </select>
            </div>
          )}

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Sign In →" : "Create Account →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-base)",
    position: "relative",
    overflow: "hidden",
    padding: "1rem",
  },
  blob: {
    position: "absolute",
    width: "500px", height: "500px",
    borderRadius: "50%",
    filter: "blur(80px)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: "400px",
    background: "var(--bg-card)",
    border: "1px solid var(--border-bright)",
    borderRadius: "20px",
    padding: "2rem",
    boxShadow: "0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
  },
  logoWrap: { textAlign: "center", marginBottom: "1.5rem" },
  logoIcon: { fontSize: "2.5rem", marginBottom: "0.5rem" },
  logoText: { fontSize: "1.2rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "0.25rem" },
  logoSub: { fontSize: "0.78rem", color: "var(--text-muted)" },
  tabs: {
    display: "flex",
    background: "var(--bg-surface)",
    borderRadius: "10px",
    padding: "3px",
    marginBottom: "1.25rem",
    border: "1px solid var(--border)",
  },
  tab: {
    flex: 1,
    padding: "0.45rem",
    border: "none",
    borderRadius: "8px",
    background: "transparent",
    color: "var(--text-muted)",
    fontFamily: "Inter, sans-serif",
    fontSize: "0.85rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "var(--accent)",
    color: "#fff",
    fontWeight: "600",
    boxShadow: "0 2px 8px rgba(99,102,241,0.4)",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.6rem 0.9rem",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: "8px",
    color: "#f87171",
    fontSize: "0.82rem",
    marginBottom: "1rem",
  },
  form: { display: "flex", flexDirection: "column", gap: "0.9rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)", letterSpacing: "0.3px" },
  input: {
    padding: "0.6rem 0.85rem",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: "0.88rem",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    transition: "border-color 0.2s",
  },
  btn: {
    marginTop: "0.25rem",
    padding: "0.7rem",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: "0.92rem",
    fontWeight: "700",
    fontFamily: "Inter, sans-serif",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
    transition: "all 0.2s",
  },
};
