import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  googleProvider,
  updateProfile,
  signOut,
} from "../firebase/firebase";
import { registerUser } from "../api/authApi";
import { SparklesIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        try { await updateProfile(cred.user, { displayName: name }); } catch {}
      }

      // Sync user to Backend MongoDB
      try {
        await registerUser({
          firebaseUID: cred.user.uid,
          email: cred.user.email,
          name: name || "",
          photoURL: cred.user.photoURL || "",
        });
      } catch (backendErr) {
        // Backend server is down or errored — roll back Firebase user immediately
        try {
          await cred.user.delete();
        } catch {
          await signOut(auth);
        }
        const isNetwork = !backendErr.response || backendErr.code === "ERR_NETWORK" || backendErr.message?.includes("Network Error");
        throw new Error(isNetwork 
          ? "Backend server is offline. Please start the backend server before signing up."
          : (backendErr.response?.data?.message || backendErr.message));
      }

      await sendEmailVerification(cred.user);
      toast.success("Account created! Check your email to verify.");
      navigate("/onboarding");
    } catch (err) {
      const msg = err.code === "auth/email-already-in-use" ? "Email already in use" : err.message;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);

      // Sync Google user to Backend MongoDB
      try {
        await registerUser({
          firebaseUID: cred.user.uid,
          email: cred.user.email,
          name: cred.user.displayName || "",
          photoURL: cred.user.photoURL || "",
        });
        navigate("/onboarding");
      } catch (backendErr) {
        // Backend server is down or errored — sign out immediately
        await signOut(auth);
        const isNetwork = !backendErr.response || backendErr.code === "ERR_NETWORK" || backendErr.message?.includes("Network Error");
        throw new Error(isNetwork 
          ? "Backend server is offline. Please start the backend server before signing up."
          : (backendErr.response?.data?.message || backendErr.message));
      }
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") toast.error(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--canvas)", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img
              src="/logo.png"
              alt="ReachAI Logo"
              style={{ width: 44, height: 44, borderRadius: 11, objectFit: "contain", flexShrink: 0 }}
            />
            <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", color: "var(--ink)" }}>
              ReachAI
            </span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 24, marginBottom: 6, letterSpacing: "-0.02em", color: "var(--ink)" }}>
            Create your account
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Start with 3 free video analyses
          </p>
        </div>

        <div className="card" style={{ padding: 32, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <button
            id="google-signup-btn"
            className="btn btn-secondary"
            style={{ width: "100%", marginBottom: 20, justifyContent: "center" }}
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? "Creating account..." : (
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
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>or sign up with email</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--ink-soft)" }}>Full Name</label>
              <input id="name-input" type="text" className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--ink-soft)" }}>Email</label>
              <input id="signup-email-input" type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--ink-soft)" }}>Password</label>
              <input id="signup-password-input" type="password" className="input" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button id="signup-btn" type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 4, justifyContent: "center" }} disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link to="/signin" style={{ color: "var(--brand-coral)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
