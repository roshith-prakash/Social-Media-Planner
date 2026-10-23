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
import { YouTubeLogo, InstagramLogo } from "../components/SocialLogos";

const FEATURES = [
  {
    icon: VideoCameraIcon,
    title: "Deep Video Understanding",
    desc: "AI watches your video, extracts transcript, tone, topic, keywords, and audience — automatically.",
    bg: "var(--accent-sky)",
    color: "var(--accent-blue-dark)",
  },
  {
    icon: ChartBarIcon,
    title: "Platform Intelligence",
    desc: "Ranked platform recommendations with scores, confidence levels, pros & cons, and full reasoning.",
    bg: "var(--accent-lilac)",
    color: "var(--accent-lilac-dark)",
  },
  {
    icon: SparklesIcon,
    title: "7 Specialized AI Agents",
    desc: "Each agent is an expert — video analysis, audience prediction, SEO, content generation, quality review.",
    bg: "var(--brand-coral-light)",
    color: "var(--brand-coral)",
  },
  {
    icon: LightBulbIcon,
    title: "Full Explainability",
    desc: "Every recommendation includes a 'Why?' explanation. No black boxes. Understand every decision.",
    bg: "var(--accent-yellow)",
    color: "var(--accent-yellow-dark)",
  },
  {
    icon: StarIcon,
    title: "Content Generation",
    desc: "Platform-specific titles, descriptions, scripts, hashtags — tailored by tone for YouTube and Instagram.",
    bg: "var(--accent-mint)",
    color: "var(--accent-mint-dark)",
  },
  {
    icon: ArrowRightIcon,
    title: "Publishing Strategy",
    desc: "Best platform, publishing order, optimal posting times, and cross-promotion strategy — all from one upload.",
    bg: "var(--accent-sky)",
    color: "var(--accent-blue-dark)",
  },
];

const PLATFORMS = [
  { name: "YouTube", color: "#FF0033", bg: "#FFF0F0", border: "rgba(255,0,51,0.2)", icon: <YouTubeLogo size={28} />, desc: "SEO titles, descriptions, chapters, tags & thumbnail advice for long-form & Shorts" },
  { name: "Instagram", color: "#E1306C", bg: "#FFF0F4", border: "rgba(225,48,108,0.2)", icon: <InstagramLogo size={28} />, desc: "Reels scripts, 3-second hooks, engaging captions, audio vibes & hashtag clouds" },
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
    <div style={{ position: "relative", minHeight: "100vh", background: "var(--canvas)", color: "var(--ink)" }}>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid var(--border)",
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(12px)",
      }}>
        <div className="content-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/logo.png"
              alt="ReachAI Logo"
              style={{ width: 36, height: 36, borderRadius: 9, objectFit: "contain", flexShrink: 0 }}
            />
            <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em", color: "var(--ink)" }}>
              ReachAI
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {userLoggedIn ? (
              <Link to="/app/upload" className="btn btn-primary btn-sm">Open Studio</Link>
            ) : (
              <>
                <Link to="/signin" className="btn btn-ghost btn-sm" style={{ color: "var(--ink-soft)" }}>Sign In</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "88px 0 72px" }}>
        <div className="content-container" style={{ textAlign: "center" }}>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 99,
            background: "var(--brand-coral-subtle)",
            border: "1px solid var(--brand-coral-light)",
            color: "var(--brand-coral)",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
          }}>
            <SparklesIcon style={{ width: 15, height: 15 }} />
            Powered by Gemini 2.5 Flash · 7 Specialized AI Agents
          </div>

          <h1 style={{
            fontSize: "clamp(38px, 5.5vw, 68px)",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            marginBottom: 24,
            maxWidth: 820,
            margin: "0 auto 24px",
          }}>
            Your Video Deserves a <span style={{ color: "var(--brand-coral)" }}>Smarter Strategy</span>
          </h1>

          <p style={{
            fontSize: 18,
            color: "var(--text-secondary)",
            maxWidth: 620,
            margin: "0 auto 36px",
            lineHeight: 1.65,
          }}>
            Upload your video. Our 7 AI agents analyze hooks, predict audience demographics,
            recommend the best platform, and craft native content with full explainability.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to={userLoggedIn ? "/app/upload" : "/signup"} className="btn btn-primary btn-lg">
              <SparklesIcon style={{ width: 18, height: 18 }} />
              Analyze Your First Video
            </Link>
            {!userLoggedIn && (
              <Link to="/signin" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            )}
          </div>

          <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
            Free to start · Instant multi-platform content generation
          </p>
        </div>
      </section>

      {/* ── Demo Scorecard Preview ────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "0 0 80px" }}>
        <div className="content-container">
          <div className="card" style={{ maxWidth: 580, margin: "0 auto", padding: 32, background: "var(--surface)", boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F56" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27C93F" }} />
              <span style={{ marginLeft: 6, fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>AI Strategic Assessment Complete</span>
            </div>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>How to Build a Modern Creator Studio in 2026</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="badge" style={{ background: "#FFF0F0", color: "#FF0033", fontWeight: 700 }}>YouTube #1</span>
                <span className="badge badge-success">95% Confidence</span>
                <span className="badge badge-brand">Educational</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {SCORES.map((s) => (
                <div key={s.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-coral)" }}>{s.value}/100</span>
                  </div>
                  <div className="score-bar-track">
                    <div className="score-bar-fill" style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 22, padding: "14px 18px", background: "var(--brand-coral-subtle)", borderRadius: 10, border: "1px solid var(--brand-coral-light)" }}>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0, lineHeight: 1.5 }}>
                💡 <strong style={{ color: "var(--brand-coral)" }}>Strategic Action:</strong> Publish long-form master on YouTube Tuesday afternoon, then release high-retention hook clip on Instagram Reels Wednesday morning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platforms ────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "60px 0" }}>
        <div className="content-container">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)", marginBottom: 10 }}>
              One Video. <span style={{ color: "var(--brand-coral)" }}>Two Powerhouse Platforms.</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 500, margin: "0 auto" }}>
              Native content engineered specifically for YouTube search algorithms and Instagram Reels discovery.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {PLATFORMS.map((p) => (
              <div key={p.name} className="card" style={{ padding: 28, background: "var(--surface)" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, marginBottom: 16,
                  background: p.bg,
                  border: `1px solid ${p.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                  color: p.color,
                }}>
                  {p.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: "var(--ink)" }}>{p.name}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "80px 0" }}>
        <div className="content-container">
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)", marginBottom: 10 }}>
              Not Just Another Caption Generator
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 440, margin: "0 auto" }}>
              A full creative studio workflow orchestrated by 7 specialized AI agents.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="card" style={{ padding: 26, background: "var(--surface)" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, marginBottom: 16,
                  background: f.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <f.icon style={{ width: 22, height: 22, color: f.color }} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "60px 0 100px" }}>
        <div className="content-container" style={{ textAlign: "center" }}>
          <div className="card" style={{
            padding: "60px 36px",
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: 20,
          }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--ink)", marginBottom: 14 }}>
              Make Something Worth Watching
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 460, margin: "0 auto 30px" }}>
              Upload your raw video and turn it into a high-impact multi-channel strategy.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
              {["No credit card required", "Instant multi-platform assets", "Direct YouTube & Instagram publishing"].map(item => (
                <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-soft)", fontWeight: 500 }}>
                  <CheckIcon style={{ width: 16, height: 16, color: "var(--accent-mint-dark)" }} />
                  {item}
                </span>
              ))}
            </div>
            <Link to={userLoggedIn ? "/app/upload" : "/signup"} className="btn btn-primary btn-lg">
              <SparklesIcon style={{ width: 18, height: 18 }} />
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 0", background: "var(--surface)" }}>
        <div className="content-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src="/logo.png"
              alt="ReachAI"
              style={{ width: 22, height: 22, borderRadius: 6, objectFit: "contain", flexShrink: 0 }}
            />
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>ReachAI</span>
          </div>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>© ReachAI Creator Studio. Powered by Gemini AI.</span>
        </div>
      </footer>
    </div>
  );
}

