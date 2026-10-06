import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { join } = useAuth();
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");

  function handleSubmit(e) {
    e.preventDefault();
    if (name.trim()) join(name.trim(), role);
  }

  return (
    <div style={s.page}>
      <div style={{ ...s.blob, top: "-120px", left: "-100px", background: "rgba(99,102,241,0.15)" }} />
      <div style={{ ...s.blob, bottom: "-100px", right: "-80px", background: "rgba(168,85,247,0.12)", width: "400px", height: "400px" }} />

      <div style={s.card}>
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>🎓</div>
          <h1 style={s.logoText}>AI Classroom Monitor</h1>
          <p style={s.logoSub}>Intelligent student engagement tracking</p>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Your Name</label>
            <input
              style={s.input}
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Join as</label>
            <div style={s.roleRow}>
              {["student", "teacher"].map(r => (
                <button
                  key={r}
                  type="button"
                  style={{ ...s.roleBtn, ...(role === r ? s.roleBtnActive : {}) }}
                  onClick={() => setRole(r)}
                >
                  {r === "student" ? "🎒 Student" : "👨🏫 Teacher"}
                </button>
              ))}
            </div>
          </div>

          <button style={s.btn} type="submit">
            Enter Classroom →
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "var(--bg-base)",
    position: "relative", overflow: "hidden", padding: "1rem",
  },
  blob: {
    position: "absolute", width: "500px", height: "500px",
    borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none",
  },
  card: {
    position: "relative", width: "100%", maxWidth: "380px",
    background: "var(--bg-card)", border: "1px solid var(--border-bright)",
    borderRadius: "20px", padding: "2rem",
    boxShadow: "0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
  },
  logoWrap: { textAlign: "center", marginBottom: "1.75rem" },
  logoIcon: { fontSize: "2.5rem", marginBottom: "0.5rem" },
  logoText: { fontSize: "1.2rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "0.25rem" },
  logoSub: { fontSize: "0.78rem", color: "var(--text-muted)" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: { fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)", letterSpacing: "0.3px" },
  input: {
    padding: "0.65rem 0.9rem", borderRadius: "8px",
    border: "1px solid var(--border)", background: "var(--bg-surface)",
    color: "var(--text-primary)", fontSize: "0.9rem",
    fontFamily: "Inter, sans-serif", outline: "none",
  },
  roleRow: { display: "flex", gap: "0.6rem" },
  roleBtn: {
    flex: 1, padding: "0.65rem", borderRadius: "10px",
    border: "1px solid var(--border)", background: "var(--bg-surface)",
    color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: "500",
    fontFamily: "Inter, sans-serif", cursor: "pointer", transition: "all 0.2s",
  },
  roleBtnActive: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "1px solid #6366f1", color: "#fff", fontWeight: "700",
    boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
  },
  btn: {
    marginTop: "0.25rem", padding: "0.75rem", borderRadius: "10px",
    border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff", fontSize: "0.92rem", fontWeight: "700",
    fontFamily: "Inter, sans-serif", cursor: "pointer",
    boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
  },
};
