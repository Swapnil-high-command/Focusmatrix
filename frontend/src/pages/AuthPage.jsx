import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { join } = useAuth();
  const [step, setStep]   = useState(1); // 1 = pick role, 2 = enter name
  const [role, setRole]   = useState("");
  const [name, setName]   = useState("");

  function pickRole(r) { setRole(r); setStep(2); }

  function handleSubmit(e) {
    e.preventDefault();
    if (name.trim()) join(name.trim(), role);
  }

  return (
    <div style={s.page}>
      {/* background blobs */}
      <div style={{ ...s.blob, top: "-160px", left: "-140px", background: "rgba(99,102,241,0.18)" }} />
      <div style={{ ...s.blob, bottom: "-120px", right: "-100px", background: "rgba(168,85,247,0.14)", width: "480px", height: "480px" }} />
      <div style={{ ...s.blob, top: "40%", left: "60%", background: "rgba(34,197,94,0.07)", width: "300px", height: "300px" }} />

      <div style={s.wrap}>
        {/* Hero */}
        <div style={s.hero}>
          <div style={s.heroIcon}>🎓</div>
          <h1 style={s.heroTitle}>AI Classroom Monitor</h1>
          <p style={s.heroSub}>Real-time engagement tracking powered by AI</p>
        </div>

        {/* Step 1 — Role picker */}
        {step === 1 && (
          <div style={s.stepWrap}>
            <p style={s.stepLabel}>Who are you joining as?</p>
            <div style={s.roleGrid}>
              <button style={{ ...s.roleCard, borderColor: "rgba(99,102,241,0.5)" }} onClick={() => pickRole("student")}>
                <span style={s.roleEmoji}>🎒</span>
                <span style={s.roleName}>Student</span>
                <span style={s.roleDesc}>Join a live class, get tracked for attention & engagement</span>
                <span style={{ ...s.roleArrow, background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>Join as Student →</span>
              </button>

              <button style={{ ...s.roleCard, borderColor: "rgba(34,197,94,0.5)" }} onClick={() => pickRole("teacher")}>
                <span style={s.roleEmoji}>👨🏫</span>
                <span style={s.roleName}>Teacher</span>
                <span style={s.roleDesc}>Start a live class, monitor students in real-time</span>
                <span style={{ ...s.roleArrow, background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>Join as Teacher →</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Name entry */}
        {step === 2 && (
          <div style={s.stepWrap}>
            <button style={s.backBtn} onClick={() => setStep(1)}>← Back</button>
            <div style={s.nameCard}>
              <div style={s.nameHeader}>
                <span style={s.nameEmoji}>{role === "teacher" ? "👨🏫" : "🎒"}</span>
                <div>
                  <p style={s.nameRole}>Joining as {role === "teacher" ? "Teacher" : "Student"}</p>
                  <p style={s.nameHint}>Enter your name to continue</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} style={s.form}>
                <input
                  style={s.input}
                  placeholder={role === "teacher" ? "e.g. Mr. Smith" : "e.g. Alex Johnson"}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                />
                <button
                  style={{
                    ...s.submitBtn,
                    background: role === "teacher"
                      ? "linear-gradient(135deg,#22c55e,#16a34a)"
                      : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    opacity: name.trim() ? 1 : 0.5,
                  }}
                  type="submit"
                  disabled={!name.trim()}
                >
                  Enter Classroom →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Features row */}
        <div style={s.features}>
          {[
            { icon: "🧠", text: "AI Attention Tracking" },
            { icon: "😴", text: "Drowsiness Detection" },
            { icon: "📊", text: "Live Analytics" },
            { icon: "🎥", text: "WebRTC Video" },
          ].map(f => (
            <div key={f.text} style={s.feature}>
              <span style={{ fontSize: "1.2rem" }}>{f.icon}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--bg-base)", position: "relative", overflow: "hidden", padding: "1.5rem",
  },
  blob: {
    position: "absolute", width: "560px", height: "560px",
    borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none",
  },
  wrap: {
    position: "relative", width: "100%", maxWidth: "640px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem",
  },
  hero: { textAlign: "center" },
  heroIcon: { fontSize: "3.5rem", marginBottom: "0.6rem" },
  heroTitle: { fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.4rem" },
  heroSub: { fontSize: "0.9rem", color: "var(--text-muted)", margin: 0 },

  stepWrap: { width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" },
  stepLabel: { fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)", margin: 0 },

  roleGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", width: "100%" },
  roleCard: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem",
    background: "var(--bg-card)", border: "1.5px solid", borderRadius: "18px",
    padding: "1.75rem 1.25rem", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
    fontFamily: "Inter,sans-serif",
  },
  roleEmoji: { fontSize: "2.8rem" },
  roleName: { fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" },
  roleDesc: { fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 },
  roleArrow: {
    marginTop: "0.4rem", padding: "0.5rem 1.1rem", borderRadius: "999px",
    color: "#fff", fontSize: "0.8rem", fontWeight: 700, border: "none",
  },

  backBtn: {
    alignSelf: "flex-start", background: "none", border: "none",
    color: "var(--text-muted)", fontSize: "0.85rem", cursor: "pointer",
    fontFamily: "Inter,sans-serif", padding: 0,
  },
  nameCard: {
    width: "100%", background: "var(--bg-card)", border: "1px solid var(--border-bright)",
    borderRadius: "18px", padding: "1.75rem",
    boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
  },
  nameHeader: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" },
  nameEmoji: { fontSize: "2.5rem" },
  nameRole: { fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", margin: 0 },
  nameHint: { fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.2rem 0 0" },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  input: {
    padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid var(--border)",
    background: "var(--bg-surface)", color: "var(--text-primary)",
    fontSize: "0.95rem", fontFamily: "Inter,sans-serif", outline: "none", width: "100%",
    boxSizing: "border-box",
  },
  submitBtn: {
    padding: "0.8rem", borderRadius: "10px", border: "none",
    color: "#fff", fontSize: "0.95rem", fontWeight: 700,
    fontFamily: "Inter,sans-serif", cursor: "pointer",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
  },

  features: {
    display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center",
  },
  feature: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
  },
};
