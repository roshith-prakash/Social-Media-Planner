import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { SparklesIcon, CheckIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { YouTubeLogo, InstagramLogo } from "../components/SocialLogos";

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
  { value: "youtube", label: "YouTube", icon: <YouTubeLogo size={24} />, color: "#ff4444" },
  { value: "instagram", label: "Instagram", icon: <InstagramLogo size={24} />, color: "#E1306C" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useUser();
  const [step, setStep] = useState(1);
  const [selectedNiche, setSelectedNiche] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("professional");
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [saving, setSaving] = useState(false);

  const togglePlatform = (p) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleFinish = async () => {
    if (!selectedNiche) return toast.error("Select your niche");
    setSaving(true);
    try {
      await completeOnboarding({
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

  const TOTAL_STEPS = 2;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", background: "var(--canvas)", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <img
            src="/logo.png"
            alt="ReachAI Logo"
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              objectFit: "contain",
              margin: "0 auto 16px",
              display: "block",
              boxShadow: "0 4px 14px rgba(240, 90, 67, 0.25)",
            }}
          />
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6, color: "var(--ink)" }}>
            Set Up Your Studio Profile
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            Help us personalize your content strategy
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            {["Your Niche", "Brand Voice & Platforms"].map((label, i) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: step >= i + 1 ? "var(--brand-coral)" : "var(--surface-secondary)",
                  border: step >= i + 1 ? "none" : "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: step >= i + 1 ? "#fff" : "var(--text-muted)",
                }}>
                  {step > i + 1 ? <CheckIcon style={{ width: 12, height: 12 }} /> : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: step === i + 1 ? "var(--brand-coral)" : "var(--text-muted)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div style={{ height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99, background: "var(--brand-coral)",
              width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%`,
              transition: "width 0.35s ease",
            }} />
          </div>
        </div>

        <div className="card" style={{ padding: 36, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>

          {/* Step 1: Niche */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: "var(--ink)" }}>What's your niche?</h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
                The AI uses this to tailor industry-specific keywords and recommendations.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {NICHES.map((niche) => {
                  const isSelected = selectedNiche === niche;
                  return (
                    <button
                      key={niche}
                      type="button"
                      style={{
                        padding: "8px 16px", fontSize: 13, borderRadius: 99, cursor: "pointer",
                        background: isSelected ? "var(--brand-coral)" : "var(--surface-secondary)",
                        color: isSelected ? "#fff" : "var(--ink-soft)",
                        border: `1px solid ${isSelected ? "transparent" : "var(--border)"}`,
                        fontWeight: isSelected ? 600 : 500,
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => setSelectedNiche(niche)}
                    >
                      {niche}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Brand Voice + Platforms */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Your brand voice</h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
                How should ReachAI craft your captions and hooks?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {VOICES.map((v) => {
                  const isSelected = selectedVoice === v.value;
                  return (
                    <button
                      key={v.value}
                      className="btn"
                      style={{
                        justifyContent: "flex-start",
                        padding: "14px 16px",
                        borderRadius: 12,
                        gap: 12,
                        background: isSelected ? "var(--brand-coral-subtle)" : "var(--surface)",
                        border: isSelected ? "1.5px solid var(--brand-coral)" : "1px solid var(--border)",
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => setSelectedVoice(v.value)}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: isSelected ? "var(--brand-coral)" : "var(--surface-secondary)",
                          border: isSelected ? "none" : "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <CheckIcon style={{ width: 12, height: 12, color: "#fff" }} />}
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? "var(--ink)" : "var(--ink-soft)" }}>
                          {v.label}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{v.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <h3 style={{ fontSize: 14, fontWeight: 650, color: "var(--ink)", marginBottom: 12 }}>
                Preferred platforms (optional)
              </h3>
              <div style={{ display: "flex", gap: 10 }}>
                {PLATFORMS.map((p) => {
                  const isSelected = selectedPlatforms.includes(p.value);
                  return (
                    <button
                      key={p.value}
                      onClick={() => togglePlatform(p.value)}
                      style={{
                        flex: 1,
                        padding: "14px 10px",
                        borderRadius: 12,
                        cursor: "pointer",
                        background: isSelected ? "var(--brand-coral-subtle)" : "var(--surface)",
                        border: isSelected ? "1.5px solid var(--brand-coral)" : "1px solid var(--border)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 26 }}>
                        {p.icon}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: isSelected ? "var(--brand-coral)" : "var(--ink-soft)",
                        }}
                      >
                        {p.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <button
              className="btn btn-secondary"
              style={{ padding: "10px 18px", borderRadius: 10, fontSize: 14 }}
              onClick={() => (step > 1 ? setStep((s) => s - 1) : navigate("/app/upload"))}
            >
              {step > 1 ? "← Back" : "Skip for now"}
            </button>
            {step < TOTAL_STEPS ? (
              <button
                id="next-step-btn"
                className="btn btn-primary"
                style={{ padding: "10px 22px", borderRadius: 10, fontSize: 14 }}
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && !selectedNiche}
              >
                Continue →
              </button>
            ) : (
              <button
                id="finish-onboarding-btn"
                className="btn btn-primary"
                style={{ padding: "10px 24px", borderRadius: 10, fontSize: 14 }}
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
