import { useState } from "react";
import { Link } from "react-router-dom";
import { auth, sendPasswordResetEmail } from "../firebase/firebase";
import { SparklesIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast.success("Reset email sent!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-base)", padding: 24,
      backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.2) 0%, transparent 60%)",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--gradient-brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SparklesIcon style={{ width: 24, height: 24, color: "#fff" }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 22, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>ReachAI</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 24, marginBottom: 6 }}>Reset password</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>We'll send you a reset link</p>
        </div>
        <div className="glass-card" style={{ padding: 32 }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Check your inbox</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>We sent a reset link to <strong>{email}</strong></p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--text-secondary)" }}>Email address</label>
                <input id="reset-email-input" type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button id="reset-btn" type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-secondary)" }}>
          <Link to="/signin" style={{ color: "var(--text-accent)", fontWeight: 600, textDecoration: "none" }}>← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
