import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { SparklesIcon, CheckIcon } from "@heroicons/react/24/outline";
import { checkUsername } from "../api/userApi";
import toast from "react-hot-toast";

const NICHES = [
  "Technology", "AI & Machine Learning", "Web Development", "Business & Finance",
  "Marketing & Growth", "Education & Learning", "Health & Wellness", "Design & UX",
  "Entrepreneurship", "Science", "Gaming", "Lifestyle", "Sports & Fitness", "Music & Art",
];

const VOICES = [
  { value: "professional", label: "Professional", desc: "Formal, authoritative, corporate" },
  { value: "educational", label: "Educational", desc: "Informative, clear, step-by-step" },
  { value: "casual", label: "Casual", desc: "Friendly, conversational, relatable" },
  { value: "entertaining", label: "Entertaining", desc: "Fun, energetic, engaging" },
  { value: "inspirational", label: "Inspirational", desc: "Motivating, uplifting, story-driven" },
];

const PLATFORMS = [
  { value: "youtube", label: "YouTube", icon: "▶", color: "#ff4444" },
  { value: "linkedin", label: "LinkedIn", icon: "in", color: "#3b9eff" },
  { value: "x", label: "X (Twitter)", icon: "𝕏", color: "#e7e9ea" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useUser();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState(null); // null | "checking" | "available" | "taken"
  const [selectedNiche, setSelectedNiche] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("professional");
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [saving, setSaving] = useState(false);

  const checkUser = async (val) => {
    if (!val || val.length < 3) { setUsernameStatus(null); return; }
    setUsernameStatus("checking");
    try {
      const res = await checkUsername(val);
      setUsernameStatus(res.data.data.available ? "available" : "taken");
    } catch { setUsernameStatus(null); }
  };

  const togglePlatform = (p) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleFinish = async () => {
    if (!username || usernameStatus !== "available") return toast.error("Choose a valid username");
    if (!selectedNiche) return toast.error("Select your niche");
    setSaving(true);
    try {
      await completeOnboarding({
        username,
        niche: selectedNiche,
        brandVoice: selectedVoice,
        preferredPlatforms: selectedPlatforms,
      });
      toast.success("Welcome to ReachAI! 🎉");
      navigate("/app/upload");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const TOTAL_STEPS = 3;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", background: "var(--bg-base)", padding: 24,
      backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.2) 0%, transparent 60%)",
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: "var(--gradient-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", boxShadow: "var(--glow-subtle)",
          }}>
            <SparklesIcon style={{ width: 28, height: 28, color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
            Set Up Your Profile
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            Help us personalize your AI strategy
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            {["Your Handle", "Your Niche", "Brand Voice"].map((label, i) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: step > i + 1 ? "var(--gradient-brand)" : step === i + 1 ? "var(--gradient-brand)" : "var(--bg-elevated)",
                  border: step === i + 1 ? "none" : "1px solid var(--border-subtle)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: step >= i + 1 ? "#fff" : "var(--text-muted)",
                  boxShadow: step === i + 1 ? "var(--glow-subtle)" : "none",
                }}>
                  {step > i + 1 ? <CheckIcon style={{ width: 12, height: 12 }} /> : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: step === i + 1 ? "var(--text-accent)" : "var(--text-muted)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div style={{ height: 3, background: "var(--border-subtle)", borderRadius: 99 }}>
            <div style={{
              height: "100%", borderRadius: 99, background: "var(--gradient-brand)",
              width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%`,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        <div className="glass-card animate-scaleIn" style={{ padding: 36 }}>

          {/* Step 1: Username */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Choose your handle</h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
                This will be your unique identifier in ReachAI.
              </p>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  color: "var(--text-muted)", fontSize: 14,
                }}>@</span>
                <input
                  id="username-input"
                  type="text"
                  className="input"
                  style={{ paddingLeft: 32 }}
                  placeholder="yourhandle"
                  value={username}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                    setUsername(val);
                    checkUser(val);
                  }}
                />
              </div>
              {usernameStatus === "checking" && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Checking...</p>}
              {usernameStatus === "available" && <p style={{ fontSize: 12, color: "#4ade80", marginTop: 6 }}>✓ Available!</p>}
              {usernameStatus === "taken" && <p style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>✗ Already taken</p>}
            </div>
          )}

          {/* Step 2: Niche */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>What's your niche?</h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
                The AI uses this to tailor all recommendations.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {NICHES.map((niche) => (
                  <button
                    key={niche}
                    className="btn"
                    style={{
                      padding: "8px 14px", fontSize: 13, borderRadius: 99,
                      background: selectedNiche === niche ? "var(--gradient-brand)" : "rgba(255,255,255,0.05)",
                      color: selectedNiche === niche ? "#fff" : "var(--text-secondary)",
                      border: `1px solid ${selectedNiche === niche ? "transparent" : "var(--border-subtle)"}`,
                      boxShadow: selectedNiche === niche ? "var(--glow-subtle)" : "none",
                    }}
                    onClick={() => setSelectedNiche(niche)}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Brand Voice + Platforms */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Your brand voice</h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
                How should the AI write content for you?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {VOICES.map((v) => (
                  <button
                    key={v.value}
                    className="btn"
                    style={{
                      justifyContent: "flex-start", padding: "14px 16px", borderRadius: 12, gap: 12,
                      background: selectedVoice === v.value ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selectedVoice === v.value ? "var(--border-strong)" : "var(--border-subtle)"}`,
                    }}
                    onClick={() => setSelectedVoice(v.value)}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: selectedVoice === v.value ? "var(--gradient-brand)" : "var(--bg-elevated)",
                      border: selectedVoice === v.value ? "none" : "1px solid var(--border-default)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {selectedVoice === v.value && <CheckIcon style={{ width: 12, height: 12, color: "#fff" }} />}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: selectedVoice === v.value ? "var(--text-primary)" : "var(--text-secondary)" }}>{v.label}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{v.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Preferred platforms (optional)</h3>
              <div style={{ display: "flex", gap: 10 }}>
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => togglePlatform(p.value)}
                    style={{
                      flex: 1, padding: "12px 8px", borderRadius: 10, cursor: "pointer",
                      background: selectedPlatforms.includes(p.value) ? `${p.color}18` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selectedPlatforms.includes(p.value) ? p.color + "50" : "var(--border-subtle)"}`,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: selectedPlatforms.includes(p.value) ? p.color : "var(--text-muted)" }}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            <button
              className="btn btn-ghost"
              onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/app/upload")}
            >
              {step > 1 ? "← Back" : "Skip for now"}
            </button>
            {step < TOTAL_STEPS ? (
              <button
                id="next-step-btn"
                className="btn btn-primary"
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && usernameStatus !== "available"}
              >
                Continue →
              </button>
            ) : (
              <button
                id="finish-onboarding-btn"
                className="btn btn-primary"
                onClick={handleFinish}
                disabled={saving}
              >
                {saving ? "Saving..." : "Finish Setup 🚀"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
