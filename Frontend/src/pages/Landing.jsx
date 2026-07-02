import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  SparklesIcon,
  VideoCameraIcon,
  ChartBarIcon,
  LightBulbIcon,
  StarIcon,
  ArrowRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

const FEATURES = [
  {
    icon: VideoCameraIcon,
    title: "Deep Video Understanding",
    desc: "AI watches your video, extracts transcript, tone, topic, keywords, and audience — automatically.",
    color: "#818cf8",
  },
  {
    icon: ChartBarIcon,
    title: "Platform Intelligence",
    desc: "Ranked platform recommendations with scores, confidence levels, pros & cons, and full reasoning.",
    color: "#a855f7",
  },
  {
    icon: SparklesIcon,
    title: "7 Specialized AI Agents",
    desc: "Each agent is an expert — video analysis, audience prediction, SEO, content generation, quality review.",
    color: "#ec4899",
  },
  {
    icon: LightBulbIcon,
    title: "Full Explainability",
    desc: "Every recommendation includes a 'Why?' explanation. No black boxes. Understand every decision.",
    color: "#f59e0b",
  },
  {
    icon: StarIcon,
    title: "Content Generation",
    desc: "Platform-specific titles, descriptions, threads, hashtags — in 5 different tones per platform.",
    color: "#10b981",
  },
  {
    icon: ArrowRightIcon,
    title: "Publishing Strategy",
    desc: "Best platform, publishing order, optimal posting times, and cross-promotion strategy — all from one upload.",
    color: "#06b6d4",
  },
];

const PLATFORMS = [
  { name: "YouTube", color: "#ff4444", desc: "SEO titles, descriptions, chapters, tags & thumbnail advice" },
  { name: "LinkedIn", color: "#3b9eff", desc: "Professional hooks, posts, CTAs & 3 tone variations" },
  { name: "X (Twitter)", color: "#e7e9ea", desc: "Punchy tweets, full threads & 3 angle variations" },
];

const SCORES = [
  { label: "Platform Fit", value: 92 },
  { label: "SEO Score", value: 88 },
  { label: "Engagement", value: 85 },
  { label: "Virality", value: 74 },
];

export default function Landing() {
  const { userLoggedIn } = useAuth();

  return (
    <div className="page-container" style={{ position: "relative", overflow: "hidden" }}>

      {/* Background glow blobs */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.25) 0%, transparent 60%)",
      }} />

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(6,6,20,0.85)",
        backdropFilter: "blur(20px)",
      }}>
        <div className="content-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "var(--gradient-brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--glow-subtle)",
            }}>
              <SparklesIcon style={{ width: 20, height: 20, color: "#fff" }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.02em" }}>
              ReachAI
            </span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {userLoggedIn ? (
              <Link to="/app/upload" className="btn btn-primary btn-sm">Open App</Link>
            ) : (
              <>
                <Link to="/signin" className="btn btn-ghost btn-sm">Sign In</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px 0 80px" }}>
        <div className="content-container" style={{ textAlign: "center" }}>

          <div className="badge badge-brand animate-fadeInUp" style={{ marginBottom: 24, display: "inline-flex" }}>
            <SparklesIcon style={{ width: 14, height: 14 }} />
            Powered by Gemini 2.5 Flash · 7 AI Agents
          </div>

          <h1 className="animate-fadeInUp font-display" style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: 24,
            animationDelay: "80ms",
          }}>
            Your Video Deserves a{" "}
            <span className="gradient-text">Smarter Strategy</span>
          </h1>

          <p className="animate-fadeInUp" style={{
            fontSize: 18,
            color: "var(--text-secondary)",
            maxWidth: 600,
            margin: "0 auto 40px",
            lineHeight: 1.7,
            animationDelay: "160ms",
          }}>
            Upload your video. Our 7 AI agents analyze it, predict your audience,
            recommend the best platform, and generate optimized content — with full
            reasoning for every decision.
          </p>

          <div className="animate-fadeInUp" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", animationDelay: "240ms" }}>
            <Link to={userLoggedIn ? "/app/upload" : "/signup"} className="btn btn-primary btn-lg">
              <SparklesIcon style={{ width: 20, height: 20 }} />
              Analyze Your First Video
            </Link>
            <Link to="/signin" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>

          <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
            Free to start · No credit card required
          </p>
        </div>
      </section>

      {/* ── Demo Scorecard Preview ────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 0 80px" }}>
        <div className="content-container">
          <div className="glass-card animate-scaleIn" style={{ maxWidth: 560, margin: "0 auto", padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f56" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27c93f" }} />
              <span style={{ marginLeft: 8, fontSize: 13, color: "var(--text-muted)" }}>AI Analysis Complete</span>
            </div>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>How to Build a React Dashboard in 2025</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="badge platform-youtube">YouTube #1</span>
                <span className="badge badge-success">95% Confidence</span>
                <span className="badge badge-brand">Educational</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {SCORES.map((s) => (
                <div key={s.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-accent)" }}>{s.value}/100</span>
                  </div>
                  <div className="score-bar-track">
                    <div className="score-bar-fill" style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: "12px 16px", background: "rgba(99,102,241,0.08)", borderRadius: 10, border: "1px solid rgba(99,102,241,0.15)" }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                💡 <strong style={{ color: "var(--text-accent)" }}>Strategy:</strong> Post on YouTube Tuesday 2–4 PM EST, then cross-promote on LinkedIn Wednesday morning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platforms ────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, padding: "60px 0" }}>
        <div className="content-container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
              One Upload. <span className="gradient-text">Three Platforms.</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              Platform-native content that feels like it was written by a specialist for each network.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {PLATFORMS.map((p) => (
              <div key={p.name} className="glass-card" style={{ padding: 28 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, marginBottom: 16,
                  background: `${p.color}18`,
                  border: `1px solid ${p.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>
                  {p.name === "YouTube" ? "▶" : p.name === "LinkedIn" ? "in" : "𝕏"}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: p.color }}>{p.name}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 0" }}>
        <div className="content-container">
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
              Not Just a Caption Generator
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
              A complete AI strategist built on 7 specialized agents.
            </p>
          </div>
          <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card animate-fadeInUp" style={{ padding: 28 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, marginBottom: 16,
                  background: `${f.color}18`, border: `1px solid ${f.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <f.icon style={{ width: 24, height: 24, color: f.color }} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 0 100px" }}>
        <div className="content-container" style={{ textAlign: "center" }}>
          <div style={{
            padding: "64px 40px",
            borderRadius: 24,
            background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)",
            border: "1px solid rgba(99,102,241,0.25)",
          }}>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16 }}>
              Start For <span className="gradient-text">Free Today</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 32, maxWidth: 440, margin: "0 auto 32px" }}>
              Upload your first video and get a complete AI strategy in under 60 seconds.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
              {["No credit card", "3 free analyses", "Full AI strategy"].map(item => (
                <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--text-secondary)" }}>
                  <CheckIcon style={{ width: 16, height: 16, color: "#4ade80" }} />
                  {item}
                </span>
              ))}
            </div>
            <Link to={userLoggedIn ? "/app/upload" : "/signup"} className="btn btn-primary btn-lg">
              <SparklesIcon style={{ width: 20, height: 20 }} />
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "32px 0", zIndex: 1, position: "relative" }}>
        <div className="content-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ReachAI</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>© 2025 ReachAI. Built with Gemini AI.</span>
        </div>
      </footer>
    </div>
  );
}
