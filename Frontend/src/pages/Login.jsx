import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
  auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
} from "../firebase/firebase";
import { SparklesIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { refreshUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Fill in all fields");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await refreshUser();
      navigate("/app/upload");
    } catch (err) {
      toast.error(err.code === "auth/invalid-credential" ? "Invalid email or password" : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      await refreshUser();
      navigate("/app/upload");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") toast.error(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-base)", padding: 24,
      backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.2) 0%, transparent 60%)",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: "var(--gradient-brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--glow-subtle)",
            }}>
              <SparklesIcon style={{ width: 24, height: 24, color: "#fff" }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 22, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              ReachAI
            </span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 24, marginBottom: 6, letterSpacing: "-0.02em" }}>
            Welcome back
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Sign in to your account
          </p>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          {/* Google Sign In */}
          <button
            id="google-signin-btn"
            className="btn btn-secondary"
            style={{ width: "100%", marginBottom: 20, fontSize: 14 }}
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? "Signing in..." : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--text-secondary)" }}>
                Email
              </label>
              <input
                id="email-input"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: 13, color: "var(--text-accent)", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
              <input
                id="password-input"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button id="signin-btn" type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 4 }} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "var(--text-accent)", fontWeight: 600, textDecoration: "none" }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
