import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getAnalysisById } from "../../api/analysisApi";
import { regenerateAgent } from "../../api/analysisApi";
import { createDraft } from "../../api/draftApi";
import {
  SparklesIcon, ClipboardDocumentIcon, CheckIcon,
  ArrowPathIcon, BookmarkIcon, ChevronDownIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const PLATFORM_COLORS = { youtube: "#ff4444", linkedin: "#3b9eff", x: "#e7e9ea" };
const PLATFORM_LABELS = { youtube: "YouTube", linkedin: "LinkedIn", x: "X (Twitter)" };

function ScoreRing({ score, label, color = "var(--brand-500)" }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 6px" }}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>{score}</span>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{label}</p>
    </div>
  );
}

function CopyBtn({ text, platform, contentType, analysisId, projectId }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const save = async () => {
    try {
      await createDraft({ analysisId, projectId, platform, contentType, editedContent: text, originalContent: text });
      toast.success("Saved to drafts!");
    } catch { toast.error("Failed to save"); }
  };
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={copy}>
        {copied ? <CheckIcon style={{ width: 13, height: 13 }} /> : <ClipboardDocumentIcon style={{ width: 13, height: 13 }} />}
        {copied ? "Copied!" : "Copy"}
      </button>
      {analysisId && (
        <button className="copy-btn" onClick={save}>
          <BookmarkIcon style={{ width: 13, height: 13 }} />
          Save
        </button>
      )}
    </div>
  );
}

function ContentBlock({ label, content, platform, contentType, analysisId, projectId }) {
  const [expanded, setExpanded] = useState(true);
  if (!content) return null;
  const text = Array.isArray(content) ? content.join("\n\n") : String(content);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }} onClick={() => setExpanded(e => !e)}>
          <ChevronDownIcon style={{ width: 14, height: 14, transform: expanded ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          {label}
        </button>
        <CopyBtn text={text} platform={platform} contentType={contentType} analysisId={analysisId} projectId={projectId} />
      </div>
      {expanded && (
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10,
          padding: "14px 16px", fontSize: 14, color: "var(--text-primary)", lineHeight: 1.7,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {text}
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "video", label: "Video Insights" },
  { id: "audience", label: "Audience" },
  { id: "platforms", label: "Platforms" },
  { id: "seo", label: "SEO" },
  { id: "content", label: "Content" },
  { id: "strategy", label: "Strategy" },
];

export default function AnalysisPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [activePlatform, setActivePlatform] = useState("youtube");
  const [regenerating, setRegenerating] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAnalysisById(id);
        setAnalysis(res.data.data.analysis);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleRegenerate = async (agent) => {
    setRegenerating(agent);
    try {
      const res = await regenerateAgent(id, agent);
      setAnalysis(prev => ({ ...prev, [res.data.data.field]: res.data.data.data }));
      toast.success(`${agent} regenerated!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRegenerating(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <SparklesIcon style={{ width: 48, height: 48, color: "var(--text-accent)", animation: "spin-slow 3s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-secondary)" }}>Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>Analysis not found.</p>
        <Link to="/app/upload" className="btn btn-primary btn-sm">Analyze a new video</Link>
      </div>
    );
  }

  const va = analysis.videoAnalysis || {};
  const aa = analysis.audienceAnalysis || {};
  const pr = analysis.platformRecommendations || [];
  const seo = analysis.seoData || {};
  const gc = analysis.generatedContent || {};
  const qr = analysis.qualityReview || {};
  const st = analysis.strategy || {};
  const scorecard = st.scorecard || {};

  const topPlatform = pr[0];
  const projectId = analysis.projectId;

  return (
    <div style={{ padding: "32px" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Link to="/app/projects" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>← Projects</Link>
            <span style={{ color: "var(--border-default)" }}>/</span>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Analysis Results</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
            {va.topic || "Video Analysis"}
          </h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {va.contentType && <span className="badge badge-muted">{va.contentType}</span>}
            {va.category && <span className="badge badge-muted">{va.category}</span>}
            {va.language && <span className="badge badge-muted">{va.language}</span>}
            {topPlatform && <span className={`badge platform-${topPlatform.platform}`}>Best: {PLATFORM_LABELS[topPlatform.platform]} ({topPlatform.score}/100)</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleRegenerate("content")} disabled={regenerating === "content"}>
            <ArrowPathIcon style={{ width: 14, height: 14, ...(regenerating === "content" ? { animation: "spin-slow 1s linear infinite" } : {}) }} />
            {regenerating === "content" ? "Regenerating..." : "Regenerate Content"}
          </button>
        </div>
      </div>

      {/* ── Scorecard Strip ─────────────────────────────────────────────── */}
      {scorecard && Object.keys(scorecard).length > 0 && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 28, overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 24, justifyContent: "space-around", minWidth: 480 }}>
            {[
              { key: "overallReadiness", label: "Overall", color: "var(--brand-500)" },
              { key: "platformFit", label: "Platform Fit", color: "#a855f7" },
              { key: "seoScore", label: "SEO", color: "#10b981" },
              { key: "engagementPotential", label: "Engagement", color: "#f59e0b" },
              { key: "viralityPotential", label: "Virality", color: "#ec4899" },
              { key: "professionalism", label: "Professional", color: "#06b6d4" },
              { key: "readability", label: "Readability", color: "#818cf8" },
            ].map(({ key, label, color }) => scorecard[key] != null && (
              <ScoreRing key={key} score={scorecard[key]} label={label} color={color} />
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="tabs-list" style={{ marginBottom: 28, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} id={`tab-${t.id}`} className={`tab-trigger ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: OVERVIEW ══════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="animate-fadeInUp stagger" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="glass-card animate-fadeInUp" style={{ padding: 24, gridColumn: "1 / -1" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Summary</h3>
            <p style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.7 }}>{va.summary}</p>
          </div>
          {topPlatform && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Best Platform</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 28 }}>{topPlatform.platform === "youtube" ? "▶" : topPlatform.platform === "linkedin" ? "in" : "𝕏"}</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 17 }}>{PLATFORM_LABELS[topPlatform.platform]}</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span className="badge badge-success">Score: {topPlatform.score}/100</span>
                    <span className="badge badge-brand">Confidence: {topPlatform.confidence}%</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{topPlatform.justification}</p>
            </div>
          )}
          {qr && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quality Review</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: "var(--text-accent)" }}>{qr.overallScore}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{qr.verdict}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Quality Score</p>
                </div>
              </div>
              {qr.suggestions?.slice(0, 3).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "var(--brand-500)", flexShrink: 0, marginTop: 2 }}>→</span>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s}</p>
                </div>
              ))}
            </div>
          )}
          {st.keyTakeaways && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 24, gridColumn: "1 / -1" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Key Takeaways</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {st.keyTakeaways.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ background: "var(--gradient-brand)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{i + 1}</span>
                    <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6 }}>{t}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: VIDEO INSIGHTS ══════════════════════════════════════════ */}
      {activeTab === "video" && (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Hook Analysis</h3>
            {va.hookAnalysis ? (
              <>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <span className={`badge ${va.hookAnalysis.hookQuality === "strong" ? "badge-success" : va.hookAnalysis.hookQuality === "moderate" ? "badge-warning" : "badge-danger"}`}>
                    {va.hookAnalysis.hookQuality?.toUpperCase()} hook
                  </span>
                </div>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 10, fontStyle: "italic" }}>"{va.hookAnalysis.hookText}"</p>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12 }}>{va.hookAnalysis.retentionPrediction}</p>
                {va.hookAnalysis.improvements?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Improvements:</p>
                    {va.hookAnalysis.improvements.map((imp, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <span style={{ color: "#f59e0b" }}>→</span>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{imp}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No hook analysis available</p>}
          </div>

          {va.videoQualityIssues?.length > 0 && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quality Issues</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {va.videoQualityIssues.map((issue, i) => (
                  <div key={i} style={{
                    padding: "14px 16px", borderRadius: 10,
                    background: issue.severity === "critical" ? "rgba(239,68,68,0.08)" : issue.severity === "moderate" ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${issue.severity === "critical" ? "rgba(239,68,68,0.2)" : issue.severity === "moderate" ? "rgba(251,191,36,0.2)" : "var(--border-subtle)"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span className={`badge ${issue.severity === "critical" ? "badge-danger" : issue.severity === "moderate" ? "badge-warning" : "badge-muted"}`}>
                        {issue.severity}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{issue.issue}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{issue.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Transcript / Summary</h3>
              <CopyBtn text={va.transcript || va.summary || ""} platform="general" contentType="transcript" />
            </div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8, maxHeight: 300, overflowY: "auto" }}>
              {va.transcript || va.summary || "No transcript available"}
            </p>
          </div>

          {va.keywords?.length > 0 && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Extracted Keywords</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {va.keywords.map((kw, i) => (
                  <span key={i} className="badge badge-brand">{kw}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: AUDIENCE ═══════════════════════════════════════════════ */}
      {activeTab === "audience" && (
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="glass-card animate-fadeInUp" style={{ padding: 24, gridColumn: "1 / -1" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Primary Audience</h3>
            <p style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{aa.primaryAudience}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {aa.ageRange && <span className="badge badge-muted">Age: {aa.ageRange}</span>}
              {aa.skillLevel && <span className="badge badge-muted">Level: {aa.skillLevel}</span>}
              {aa.intent && <span className="badge badge-brand">Intent: {aa.intent}</span>}
              {aa.audienceType?.map(t => <span key={t} className="badge badge-muted">{t}</span>)}
            </div>
          </div>
          {aa.psychographics && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Psychographics</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{aa.psychographics}</p>
            </div>
          )}
          {aa.painPoints?.length > 0 && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Pain Points Addressed</h3>
              {aa.painPoints.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: "var(--brand-500)" }}>✦</span>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{p}</p>
                </div>
              ))}
            </div>
          )}
          {aa.interests?.length > 0 && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Interests</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {aa.interests.map((i, idx) => <span key={idx} className="badge badge-muted">{i}</span>)}
              </div>
            </div>
          )}
          {aa.platforms && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 24, gridColumn: "1 / -1" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Platform Behavior</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(aa.platforms).map(([platform, desc]) => (
                  <div key={platform} style={{ display: "flex", gap: 12 }}>
                    <span className={`badge platform-${platform}`} style={{ flexShrink: 0 }}>{PLATFORM_LABELS[platform]}</span>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: PLATFORMS ══════════════════════════════════════════════ */}
      {activeTab === "platforms" && (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {pr.sort((a, b) => (a.rank || 99) - (b.rank || 99)).map((p) => (
            <div key={p.platform} className="glass-card animate-fadeInUp" style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${PLATFORM_COLORS[p.platform]}15`, border: `1px solid ${PLATFORM_COLORS[p.platform]}30`, fontSize: 22,
                  }}>
                    {p.platform === "youtube" ? "▶" : p.platform === "linkedin" ? "in" : "𝕏"}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{PLATFORM_LABELS[p.platform]}</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span className="badge badge-muted">#{p.rank} Recommended</span>
                      <span className="badge badge-brand">{p.confidence}% Confidence</span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 32, fontWeight: 900, color: PLATFORM_COLORS[p.platform] }}>{p.score}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>/ 100</p>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div className="score-bar-track">
                  <div className="score-bar-fill" style={{ width: `${p.score}%`, background: PLATFORM_COLORS[p.platform] }} />
                </div>
              </div>

              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>{p.justification}</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#4ade80", marginBottom: 8 }}>✓ Pros</p>
                  {p.pros?.map((pro, i) => <p key={i} style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>• {pro}</p>)}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#f87171", marginBottom: 8 }}>✗ Cons</p>
                  {p.cons?.map((con, i) => <p key={i} style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>• {con}</p>)}
                </div>
              </div>
              {p.bestPostingTime && (
                <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    🕐 <strong style={{ color: "var(--text-accent)" }}>Best time to post:</strong> {p.bestPostingTime}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══ TAB: SEO ════════════════════════════════════════════════════ */}
      {activeTab === "seo" && (
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="glass-card animate-fadeInUp" style={{ padding: 24, gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 44, fontWeight: 900, color: "var(--text-accent)", lineHeight: 1 }}>{seo.seoScore}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>SEO Score</p>
              </div>
              <div style={{ flex: 1 }}>
                {seo.seoScoreBreakdown && Object.entries(seo.seoScoreBreakdown).map(([key, val]) => (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-accent)" }}>{val}</span>
                    </div>
                    <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${val}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Primary Keywords</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {seo.primaryKeywords?.map((k, i) => <span key={i} className="badge badge-brand">{k}</span>)}
            </div>
          </div>

          <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Secondary Keywords</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {seo.secondaryKeywords?.map((k, i) => <span key={i} className="badge badge-muted">{k}</span>)}
            </div>
          </div>

          {seo.opportunities?.length > 0 && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 24, gridColumn: "1 / -1" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>SEO Opportunities</h3>
              {seo.opportunities.map((o, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: "#10b981", flexShrink: 0 }}>✦</span>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{o}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: CONTENT ════════════════════════════════════════════════ */}
      {activeTab === "content" && (
        <div>
          {/* Platform selector */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            {["youtube", "linkedin", "x"].map(p => (
              <button
                key={p}
                id={`platform-tab-${p}`}
                onClick={() => setActivePlatform(p)}
                style={{
                  padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14,
                  background: activePlatform === p ? `${PLATFORM_COLORS[p]}20` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${activePlatform === p ? PLATFORM_COLORS[p] + "50" : "var(--border-subtle)"}`,
                  color: activePlatform === p ? PLATFORM_COLORS[p] : "var(--text-muted)",
                  transition: "all 0.2s ease",
                }}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => handleRegenerate("content")} disabled={regenerating === "content"}>
              <ArrowPathIcon style={{ width: 14, height: 14, ...(regenerating === "content" ? { animation: "spin-slow 1s linear infinite" } : {}) }} />
              Regenerate
            </button>
          </div>

          {/* YouTube Content */}
          {activePlatform === "youtube" && gc.youtube && (
            <div className="stagger">
              <div className="glass-card animate-fadeInUp" style={{ padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Title Variations</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {gc.youtube.titles?.map((t, i) => (
                    <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>{t.text}</p>
                        <CopyBtn text={t.text} platform="youtube" contentType="title" analysisId={id} projectId={projectId} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="badge badge-muted" style={{ fontSize: 11 }}>{t.tone}</span>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.reasoning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card animate-fadeInUp" style={{ padding: 24, marginBottom: 16 }}>
                <ContentBlock label="Description" content={gc.youtube.description} platform="youtube" contentType="description" analysisId={id} projectId={projectId} />
                {gc.youtube.chapters?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Chapters</p>
                    {gc.youtube.chapters.map((c, i) => (
                      <p key={i} style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>
                        <span style={{ color: "var(--text-accent)", fontWeight: 600 }}>{c.time}</span> — {c.title}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card animate-fadeInUp" style={{ padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Hashtags by Category</h3>
                {gc.youtube.hashtags && Object.entries(gc.youtube.hashtags).map(([cat, tags]) => tags?.length > 0 && (
                  <div key={cat} style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "capitalize" }}>{cat}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {tags.map((tag, i) => <span key={i} className="badge badge-brand">{tag}</span>)}
                    </div>
                  </div>
                ))}
              </div>

              {gc.youtube.thumbnailSuggestions && (
                <div className="glass-card animate-fadeInUp" style={{ padding: 24, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Thumbnail Suggestions</h3>
                  {Object.entries(gc.youtube.thumbnailSuggestions).map(([key, val]) => val && (
                    <div key={key} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-accent)", minWidth: 100, textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                      <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{val}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LinkedIn Content */}
          {activePlatform === "linkedin" && gc.linkedin && (
            <div className="stagger">
              <div className="glass-card animate-fadeInUp" style={{ padding: 24, marginBottom: 16 }}>
                <ContentBlock label="Hook" content={gc.linkedin.hook} platform="linkedin" contentType="hook" analysisId={id} projectId={projectId} />
                <ContentBlock label="Full Post" content={gc.linkedin.post} platform="linkedin" contentType="post" analysisId={id} projectId={projectId} />
                <ContentBlock label="CTA" content={gc.linkedin.cta} platform="linkedin" contentType="cta" analysisId={id} projectId={projectId} />
              </div>
              {gc.linkedin.variations?.length > 0 && (
                <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Post Variations</h3>
                  {gc.linkedin.variations.map((v, i) => (
                    <div key={i} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span className="badge badge-muted" style={{ textTransform: "capitalize" }}>{v.tone}</span>
                        <CopyBtn text={v.content} platform="linkedin" contentType="post" analysisId={id} projectId={projectId} />
                      </div>
                      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{v.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* X Content */}
          {activePlatform === "x" && gc.x && (
            <div className="stagger">
              <div className="glass-card animate-fadeInUp" style={{ padding: 24, marginBottom: 16 }}>
                <ContentBlock label="Tweet" content={gc.x.tweet} platform="x" contentType="tweet" analysisId={id} projectId={projectId} />
                {gc.x.thread?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>Thread ({gc.x.thread.length} tweets)</p>
                      <CopyBtn text={gc.x.thread.join("\n\n")} platform="x" contentType="thread" analysisId={id} projectId={projectId} />
                    </div>
                    {gc.x.thread.map((tweet, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, paddingLeft: 4, borderLeft: "2px solid var(--border-default)" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", minWidth: 20 }}>{i + 1}/</span>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{tweet}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: STRATEGY ═══════════════════════════════════════════════ */}
      {activeTab === "strategy" && (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="glass-card animate-fadeInUp" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Publishing Strategy</h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>{st.publishingOrderReasoning}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {st.publishingOrder?.map((p, i) => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {i > 0 && <span style={{ color: "var(--text-muted)" }}>→</span>}
                  <span className={`badge platform-${p}`}>#{i + 1} {PLATFORM_LABELS[p]}</span>
                </div>
              ))}
            </div>
          </div>

          {st.postingSchedule?.length > 0 && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Posting Schedule</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {st.postingSchedule.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
                    <span className={`badge platform-${s.platform}`} style={{ flexShrink: 0, marginTop: 2 }}>{PLATFORM_LABELS[s.platform]}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.suggestedDay} · {s.suggestedTime}</p>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {st.contentImprovements?.length > 0 && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Before You Publish</h3>
              {st.contentImprovements.map((imp, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: "#f59e0b", flexShrink: 0 }}>!</span>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{imp}</p>
                </div>
              ))}
            </div>
          )}

          {st.estimatedReach && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Estimated Reach</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                {Object.entries(st.estimatedReach).map(([p, reach]) => (
                  <div key={p} style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
                    <span className={`badge platform-${p}`}>{PLATFORM_LABELS[p]}</span>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>{reach}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
