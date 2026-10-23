import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getAnalysisById } from "../../api/analysisApi";
import { regenerateAgent } from "../../api/analysisApi";
import { createDraft } from "../../api/draftApi";
import { schedulePost, publishNow } from "../../api/scheduleApi";
import { useUser } from "../../context/UserContext";
import {
  SparklesIcon, ClipboardDocumentIcon, CheckIcon,
  ArrowPathIcon, BookmarkIcon, ChevronDownIcon,
  ClockIcon, ChartBarIcon, XMarkIcon, CalendarDaysIcon,
  BoltIcon, PaperAirplaneIcon, InformationCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { PlatformIcon } from "../../components/SocialLogos";


const PLATFORM_COLORS = { youtube: "#ff4444", instagram: "#E1306C" };
const PLATFORM_LABELS = { youtube: "YouTube", instagram: "Instagram" };

function ScoreRing({ score, label, color = "var(--brand-coral)" }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 6px" }}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>{score}</span>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>{label}</p>
    </div>
  );
}

function CopyBtn({ text, platform, contentType, analysisId, projectId, onSchedule, onPublishNow }) {
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
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
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
      {onPublishNow && (
        <button
          className="copy-btn"
          onClick={() => onPublishNow(text, platform)}
          style={{
            color: "var(--brand-coral)",
            borderColor: "var(--brand-coral-light)",
            background: "var(--brand-coral-subtle)",
            fontWeight: 600,
          }}
          title="Publish immediately to this platform"
        >
          <BoltIcon style={{ width: 13, height: 13 }} />
          Post Now
        </button>
      )}
      {onSchedule && (
        <button className="copy-btn" onClick={() => onSchedule(text, platform)}>
          <ClockIcon style={{ width: 13, height: 13 }} />
          Schedule
        </button>
      )}
    </div>
  );
}

function ContentBlock({ label, content, platform, contentType, analysisId, projectId, onSchedule, onPublishNow }) {
  const [expanded, setExpanded] = useState(true);
  if (!content) return null;
  const text = Array.isArray(content) ? content.join("\n\n") : String(content);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--ink-soft)", fontSize: 13, fontWeight: 600 }} onClick={() => setExpanded(e => !e)}>
          <ChevronDownIcon style={{ width: 14, height: 14, transform: expanded ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          {label}
        </button>
        <CopyBtn
          text={text}
          platform={platform}
          contentType={contentType}
          analysisId={analysisId}
          projectId={projectId}
          onSchedule={onSchedule}
          onPublishNow={onPublishNow}
        />
      </div>
      {expanded && (
        <div style={{
          background: "var(--surface-secondary)", border: "1px solid var(--border)", borderRadius: 10,
          padding: "16px 18px", fontSize: 14, color: "var(--ink)", lineHeight: 1.7,
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
  const navigate = useNavigate();
  const { dbUser } = useUser();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [activePlatform, setActivePlatform] = useState("youtube");
  const [regenerating, setRegenerating] = useState(null);

  // Connected accounts check
  const isYouTubeConnected = Boolean(dbUser?.youtubeAccessToken || dbUser?.youtubeChannelName || dbUser?.youtubeChannelId);
  const isInstagramConnected = Boolean(dbUser?.instagramAccessToken || dbUser?.instagramUsername || dbUser?.instagramBusinessId);

  const isPlatformConnected = (plat) => {
    if (plat === "youtube") return isYouTubeConnected;
    if (plat === "instagram") return isInstagramConnected;
    return false;
  };

  // Publish / Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleMode, setScheduleMode] = useState("now"); // "now" | "schedule"
  const [scheduleForm, setScheduleForm] = useState({
    platform: "youtube",
    scheduledAt: "",
    content: "",
  });
  const [submittingAction, setSubmittingAction] = useState(false);

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
      toast.success(`${agent.toUpperCase()} agent regenerated!`);
    } catch (err) {
      toast.error(err.message || "Regeneration failed");
    } finally {
      setRegenerating(null);
    }
  };

  const resolvePreferredPlatform = (preferred) => {
    if (isPlatformConnected(preferred)) return preferred;
    if (isYouTubeConnected) return "youtube";
    if (isInstagramConnected) return "instagram";
    return preferred || "youtube";
  };

  const handleOpenPublishNow = (text = "", platform = "youtube") => {
    setScheduleMode("now");
    setScheduleForm({
      platform: resolvePreferredPlatform(platform),
      scheduledAt: "",
      content: typeof text === "string" ? text : Array.isArray(text) ? text.join("\n\n") : "",
    });
    setShowScheduleModal(true);
  };

  const handleOpenSchedule = (text = "", platform = "youtube") => {
    setScheduleMode("schedule");
    setScheduleForm({
      platform: resolvePreferredPlatform(platform),
      scheduledAt: "",
      content: typeof text === "string" ? text : Array.isArray(text) ? text.join("\n\n") : "",
    });
    setShowScheduleModal(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!isPlatformConnected(scheduleForm.platform)) {
      return toast.error(`Please connect your ${PLATFORM_LABELS[scheduleForm.platform]} account in Profile before publishing.`);
    }
    if (scheduleMode === "schedule" && !scheduleForm.scheduledAt) {
      return toast.error("Please pick a scheduled date and time");
    }

    setSubmittingAction(true);
    try {
      if (scheduleMode === "now") {
        const res = await publishNow({
          projectId: analysis.projectId,
          platform: scheduleForm.platform,
          content: scheduleForm.content,
        });
        toast.success(res.data?.message || `Successfully published to ${scheduleForm.platform.toUpperCase()}!`);
      } else {
        await schedulePost({
          projectId: analysis.projectId,
          platform: scheduleForm.platform,
          scheduledAt: scheduleForm.scheduledAt,
          content: scheduleForm.content,
        });
        toast.success("Post scheduled successfully! View it in Content Calendar.");
      }
      setShowScheduleModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || "Publishing failed");
    } finally {
      setSubmittingAction(false);
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenPublishNow(gc.instagram?.caption || gc.youtube?.description || "", topPlatform?.platform || "youtube")}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <BoltIcon style={{ width: 14, height: 14 }} />
            Post Now
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleOpenSchedule(gc.instagram?.caption || gc.youtube?.description || "", topPlatform?.platform || "youtube")}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <ClockIcon style={{ width: 14, height: 14 }} />
            Schedule Post
          </button>
          <Link
            to={`/app/analytics/${analysis.projectId}`}
            className="btn btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          >
            <ChartBarIcon style={{ width: 14, height: 14 }} />
            Analytics
          </Link>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleRegenerate("content")}
            disabled={regenerating === "content"}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <ArrowPathIcon style={{ width: 14, height: 14, ...(regenerating === "content" ? { animation: "spin 1s linear infinite" } : {}) }} />
            {regenerating === "content" ? "Regenerating..." : "Regenerate Content"}
          </button>
        </div>
      </div>


      {/* ── Scorecard Strip ─────────────────────────────────────────────── */}
      {scorecard && Object.keys(scorecard).length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 28, overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 24, justifyContent: "space-around", minWidth: 480 }}>
            {[
              { key: "overallReadiness", label: "Overall", color: "var(--brand-coral)" },
              { key: "platformFit", label: "Platform Fit", color: "var(--lilac-dark)" },
              { key: "seoScore", label: "SEO", color: "var(--mint-dark)" },
              { key: "engagementPotential", label: "Engagement", color: "var(--yellow-dark)" },
              { key: "viralityPotential", label: "Virality", color: "var(--brand-coral)" },
              { key: "professionalism", label: "Professional", color: "var(--blue-dark)" },
              { key: "readability", label: "Readability", color: "var(--lilac-dark)" },
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
          <div className="card animate-fadeInUp" style={{ padding: 24, gridColumn: "1 / -1", display: "grid", gridTemplateColumns: analysis.project?.cloudinaryUrl ? "minmax(280px, 340px) 1fr" : "1fr", gap: 24, alignItems: "start" }}>
            {analysis.project?.cloudinaryUrl && (
              <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden", background: "#000", border: "1px solid var(--border)" }}>
                <video
                  src={analysis.project.cloudinaryUrl}
                  poster={analysis.project.thumbnailUrl || analysis.project.cloudinaryUrl.replace(/\.[^/.]+$/, ".jpg")}
                  controls
                  preload="metadata"
                  style={{ width: "100%", maxHeight: 220, display: "block", objectFit: "contain", background: "#000" }}
                />
              </div>
            )}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Summary</h3>
              <p style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.7 }}>{va.summary}</p>
            </div>
          </div>
          {topPlatform && (
            <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Best Platform</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <PlatformIcon platform={topPlatform.platform} size={32} />
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
                    background: issue.severity === "critical" ? "var(--status-error-bg)" : issue.severity === "moderate" ? "var(--status-warning-bg)" : "var(--surface-secondary)",
                    border: `1px solid ${issue.severity === "critical" ? "rgba(183,53,41,0.2)" : issue.severity === "moderate" ? "rgba(130,91,18,0.2)" : "var(--border)"}`,
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
                    background: `${PLATFORM_COLORS[p.platform]}15`, border: `1px solid ${PLATFORM_COLORS[p.platform]}30`,
                  }}>
                    <PlatformIcon platform={p.platform} size={28} />
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
          <div style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "center" }}>
            {["youtube", "instagram"].map(p => {
              const isSelected = activePlatform === p;
              return (
                <button
                  key={p}
                  id={`platform-tab-${p}`}
                  onClick={() => setActivePlatform(p)}
                  style={{
                    padding: "9px 20px",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    background: isSelected ? (p === "youtube" ? "#FFF0F0" : "#FFF0F4") : "var(--surface)",
                    border: `1.5px solid ${isSelected ? (p === "youtube" ? "#FF0033" : "#E1306C") : "var(--border)"}`,
                    color: isSelected ? (p === "youtube" ? "#FF0033" : "#E1306C") : "var(--text-secondary)",
                    transition: "all 0.15s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <PlatformIcon platform={p} size={18} />
                  {PLATFORM_LABELS[p]}
                </button>
              );
            })}
            <button className="btn btn-secondary btn-sm" style={{ marginLeft: "auto" }} onClick={() => handleRegenerate("content")} disabled={regenerating === "content"}>
              <ArrowPathIcon style={{ width: 14, height: 14, ...(regenerating === "content" ? { animation: "spin-slow 1s linear infinite" } : {}) }} />
              Regenerate
            </button>
          </div>

          {/* YouTube Content */}
          {activePlatform === "youtube" && gc.youtube && (
            <div className="stagger">
              <div className="card animate-fadeInUp" style={{ padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Title Variations</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {gc.youtube.titles?.map((t, i) => (
                    <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
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
                <ContentBlock
                  label="Description"
                  content={gc.youtube.description}
                  platform="youtube"
                  contentType="description"
                  analysisId={id}
                  projectId={projectId}
                  onSchedule={handleOpenSchedule}
                  onPublishNow={handleOpenPublishNow}
                />
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

          {/* Instagram Content */}
          {activePlatform === "instagram" && gc.instagram && (
            <div className="stagger">
              {/* Hooks Section */}
              {gc.instagram.hook && (
                <div className="glass-card animate-fadeInUp" style={{ padding: 24, marginBottom: 16, borderLeft: "4px solid #E1306C" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>⚡ First 3-Second Hooks</span>
                    <span className="badge badge-brand" style={{ background: "rgba(225,48,108,0.15)", color: "#E1306C", border: "1px solid rgba(225,48,108,0.3)" }}>Reels Retention</span>
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-coral)", marginBottom: 6 }}>👀 Visual / On-Screen Text</p>
                      <p style={{ fontSize: 14, color: "var(--ink)" }}>{gc.instagram.hook.visualHook}</p>
                    </div>
                    <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#E1306C", marginBottom: 6 }}>🎙️ Spoken Verbal Hook</p>
                      <p style={{ fontSize: 14, color: "var(--ink)" }}>"{gc.instagram.hook.verbalHook}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Caption */}
              <div className="glass-card animate-fadeInUp" style={{ padding: 24, marginBottom: 16 }}>
                <ContentBlock
                  label="Primary Reels / Post Caption"
                  content={gc.instagram.caption}
                  platform="instagram"
                  contentType="caption"
                  analysisId={id}
                  projectId={projectId}
                  onSchedule={handleOpenSchedule}
                  onPublishNow={handleOpenPublishNow}
                />
                {gc.instagram.cta && (
                  <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(225,48,108,0.08)", border: "1px solid rgba(225,48,108,0.2)" }}>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      💬 <strong style={{ color: "#E1306C" }}>Suggested Call-to-Action:</strong> {gc.instagram.cta}
                    </p>
                  </div>
                )}
              </div>

              {/* Reels Script Breakdown */}
              {gc.instagram.reelsScript?.length > 0 && (
                <div className="glass-card animate-fadeInUp" style={{ padding: 24, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>Vertical Reel Script (Timed Breakdown)</h3>
                    <CopyBtn
                      text={gc.instagram.reelsScript.map(s => `[${s.timestamp}] ${s.section}\nScript: ${s.script}\nOn-Screen: ${s.onScreenText}`).join("\n\n")}
                      platform="instagram"
                      contentType="reels_script"
                      analysisId={id}
                      projectId={projectId}
                      onSchedule={handleOpenSchedule}
                      onPublishNow={handleOpenPublishNow}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {gc.instagram.reelsScript.map((step, idx) => (
                      <div key={idx} style={{ padding: "14px 16px", borderRadius: 10, background: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span className="badge badge-brand" style={{ fontSize: 12 }}>{step.timestamp}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{step.section}</span>
                        </div>
                        <p style={{ fontSize: 14, color: "var(--text-primary)", marginBottom: 8, lineHeight: 1.6 }}>{step.script}</p>
                        {step.onScreenText && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>TEXT OVERLAY:</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#E1306C" }}>{step.onScreenText}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtags & Audio Recommendation */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                {/* Hashtags */}
                <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>Instagram Hashtags</h3>
                    {gc.instagram.hashtags && (
                      <CopyBtn
                        text={Object.values(gc.instagram.hashtags).flat().join(" ")}
                        platform="instagram"
                        contentType="hashtags"
                        analysisId={id}
                        projectId={projectId}
                        onSchedule={handleOpenSchedule}
                        onPublishNow={handleOpenPublishNow}
                      />
                    )}
                  </div>
                  {gc.instagram.hashtags && Object.entries(gc.instagram.hashtags).map(([cat, tags]) => tags?.length > 0 && (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "capitalize" }}>{cat} ({tags.length})</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {tags.map((t, i) => <span key={i} className="badge" style={{ background: "rgba(225,48,108,0.12)", color: "#E1306C", border: "1px solid rgba(225,48,108,0.25)" }}>{t}</span>)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Audio Recommendation & Carousel Concept */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {gc.instagram.audioRecommendation && (
                    <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🎵 Audio & Beat Direction</h3>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
                        <strong>Style:</strong> {gc.instagram.audioRecommendation.soundType}
                      </p>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
                        <strong>Pacing:</strong> {gc.instagram.audioRecommendation.pacing}
                      </p>
                    </div>
                  )}

                  {gc.instagram.carouselConcept && (
                    <div className="glass-card animate-fadeInUp" style={{ padding: 24, flex: 1 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>📑 Carousel Post Idea</h3>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-accent)", marginBottom: 8 }}>{gc.instagram.carouselConcept.title}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {gc.instagram.carouselConcept.slides?.map((s, idx) => (
                          <p key={idx} style={{ fontSize: 12, color: "var(--text-secondary)" }}>• {s}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Caption Variations */}
              {gc.instagram.variations?.length > 0 && (
                <div className="glass-card animate-fadeInUp" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Alternative Caption Tones</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {gc.instagram.variations.map((v, i) => (
                      <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                          <span className="badge badge-muted" style={{ textTransform: "capitalize" }}>{v.tone.replace("_", " ")}</span>
                          <CopyBtn
                            text={v.caption}
                            platform="instagram"
                            contentType="caption"
                            analysisId={id}
                            projectId={projectId}
                            onSchedule={handleOpenSchedule}
                            onPublishNow={handleOpenPublishNow}
                          />
                        </div>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{v.caption}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "14px 16px", borderRadius: 10, background: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
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
                  <div key={p} style={{ padding: "14px 16px", borderRadius: 10, background: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                    <span className={`badge platform-${p}`}>{PLATFORM_LABELS[p]}</span>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>{reach}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Schedule Modal ──────────────────────────────────────────────── */}
      {showScheduleModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            className="card animate-scaleIn"
            style={{
              maxWidth: 540,
              width: "100%",
              padding: 28,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              boxShadow: "0 20px 48px rgba(0, 0, 0, 0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {scheduleMode === "now" ? (
                  <BoltIcon style={{ width: 22, height: 22, color: "var(--brand-coral)" }} />
                ) : (
                  <ClockIcon style={{ width: 22, height: 22, color: "var(--brand-coral)" }} />
                )}
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--ink)" }}>
                  {scheduleMode === "now" ? "Publish Post Now" : "Schedule Publication"}
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowScheduleModal(false)}>
                <XMarkIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Mode Switcher Toggle */}
            <div style={{
              display: "flex",
              background: "var(--surface-secondary)",
              padding: 4,
              borderRadius: 10,
              marginBottom: 18,
              border: "1px solid var(--border)",
            }}>
              <button
                type="button"
                onClick={() => setScheduleMode("now")}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s ease",
                  background: scheduleMode === "now" ? "var(--brand-coral)" : "transparent",
                  color: scheduleMode === "now" ? "#fff" : "var(--text-secondary)",
                  boxShadow: scheduleMode === "now" ? "0 2px 6px rgba(240, 90, 67, 0.25)" : "none",
                }}
              >
                <BoltIcon style={{ width: 14, height: 14 }} />
                Post Now
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode("schedule")}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s ease",
                  background: scheduleMode === "schedule" ? "var(--brand-coral)" : "transparent",
                  color: scheduleMode === "schedule" ? "#fff" : "var(--text-secondary)",
                  boxShadow: scheduleMode === "schedule" ? "0 2px 6px rgba(240, 90, 67, 0.25)" : "none",
                }}
              >
                <ClockIcon style={{ width: 14, height: 14 }} />
                Schedule for Later
              </button>
            </div>

            <form onSubmit={handleActionSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Target Platform Selector */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8, color: "var(--ink-soft)" }}>
                  Target Platform
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {["youtube", "instagram"].map((p) => {
                    const connected = isPlatformConnected(p);
                    const isSelected = scheduleForm.platform === p;
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setScheduleForm({ ...scheduleForm, platform: p })}
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          borderRadius: 8,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                          background: isSelected ? "var(--brand-coral-subtle)" : "var(--surface)",
                          border: `1.5px solid ${isSelected ? "var(--brand-coral)" : "var(--border)"}`,
                          color: isSelected ? "var(--brand-coral)" : "var(--ink-soft)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          flexWrap: "wrap",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span>{PLATFORM_LABELS[p]}</span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: connected ? "var(--status-success-bg)" : "var(--status-error-bg)",
                            color: connected ? "var(--status-success-fg)" : "var(--status-error-fg)",
                            fontWeight: 700,
                          }}
                        >
                          {connected ? "✓ Connected" : "✕ Not Connected"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Connection Warning if disconnected */}
              {!isPlatformConnected(scheduleForm.platform) && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: "var(--status-error-bg)",
                    border: "1px solid rgba(183, 53, 41, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <InformationCircleIcon style={{ width: 18, height: 18, color: "var(--status-error-fg)", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--status-error-fg)" }}>
                      Your <strong>{PLATFORM_LABELS[scheduleForm.platform]}</strong> account is not connected.
                    </span>
                  </div>
                  <Link
                    to="/app/profile"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: "4px 10px", flexShrink: 0, textDecoration: "none" }}
                  >
                    Connect in Profile
                  </Link>
                </div>
              )}

              {/* Informational callout if Post Now */}
              {scheduleMode === "now" && isPlatformConnected(scheduleForm.platform) && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "var(--brand-coral-subtle)",
                  border: "1px solid var(--brand-coral-light)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <BoltIcon style={{ width: 18, height: 18, color: "var(--brand-coral)", flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0, lineHeight: 1.5 }}>
                    Instant publication: Your video and caption will be published directly to your connected <strong>{PLATFORM_LABELS[scheduleForm.platform]}</strong> account right now.
                  </p>
                </div>
              )}

              {/* Scheduled Date & Time if Schedule Mode */}
              {scheduleMode === "schedule" && (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8, color: "var(--ink-soft)" }}>
                    Scheduled Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={scheduleForm.scheduledAt}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
                    required={scheduleMode === "schedule"}
                  />
                </div>
              )}

              {/* Content textarea */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8, color: "var(--ink-soft)" }}>
                  Post Content / Caption
                </label>
                <textarea
                  className="input"
                  rows={5}
                  placeholder="Draft content to publish..."
                  value={scheduleForm.content}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, content: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingAction || !isPlatformConnected(scheduleForm.platform)}
                  title={!isPlatformConnected(scheduleForm.platform) ? `Connect ${PLATFORM_LABELS[scheduleForm.platform]} account first` : ""}
                  style={
                    !isPlatformConnected(scheduleForm.platform)
                      ? {
                          background: "var(--surface-secondary)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                          cursor: "not-allowed",
                        }
                      : {}
                  }
                >
                  {submittingAction ? (
                    <>
                      <ArrowPathIcon style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                      {scheduleMode === "now" ? `Publishing to ${PLATFORM_LABELS[scheduleForm.platform]}...` : "Scheduling..."}
                    </>
                  ) : !isPlatformConnected(scheduleForm.platform) ? (
                    `Connect ${PLATFORM_LABELS[scheduleForm.platform]} to Publish`
                  ) : scheduleMode === "now" ? (
                    <>
                      <BoltIcon style={{ width: 14, height: 14 }} />
                      Post Now to {PLATFORM_LABELS[scheduleForm.platform]}
                    </>
                  ) : (
                    <>
                      <ClockIcon style={{ width: 14, height: 14 }} />
                      Confirm Schedule
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

