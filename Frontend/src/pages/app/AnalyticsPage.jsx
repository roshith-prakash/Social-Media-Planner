import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProjectAnalytics } from "../../api/analyticsApi";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  EyeIcon,
  ClockIcon,
  HandThumbUpIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ChatBubbleBottomCenterTextIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function AnalyticsPage() {
  const { projectId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProjectAnalytics(projectId);
        setData(res.data?.data?.analytics);
      } catch (err) {
        toast.error("Failed to load analytics: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh" }}>
        <div style={{ textAlign: "center" }}>
          <SparklesIcon style={{ width: 44, height: 44, color: "var(--text-accent)", animation: "spin-slow 3s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-secondary)" }}>Loading post analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>Analytics data unavailable.</p>
        <Link to="/app/projects" className="btn btn-secondary btn-sm">Back to Projects</Link>
      </div>
    );
  }

  const {
    metrics,
    chartData,
    title,
    duration,
    platforms,
    youtubeVideoId,
    instagramMediaId,
    isPublished,
    platformBreakdown,
  } = data;

  return (
    <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Link to="/app/projects" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            <ArrowLeftIcon style={{ width: 14, height: 14 }} /> Back to Projects
          </Link>
          <span style={{ color: "var(--border-default)" }}>/</span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Performance Analytics</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
              {title || "Project Analytics"}
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
              Live real-time metrics, audience engagement, and platform performance.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {youtubeVideoId && instagramMediaId ? (
              <span className="badge badge-success">✓ Synced: YouTube & Instagram</span>
            ) : youtubeVideoId ? (
              <span className="badge badge-success">✓ Synced: YouTube API</span>
            ) : instagramMediaId ? (
              <span className="badge badge-success" style={{ background: "rgba(225, 48, 108, 0.15)", color: "#E1306C", borderColor: "rgba(225, 48, 108, 0.3)" }}>
                ✓ Synced: Instagram Graph API
              </span>
            ) : (
              <span className="badge badge-muted">Not Published Yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Unpublished Notice Banner */}
      {!isPublished && (
        <div
          className="glass-card animate-fadeInUp"
          style={{
            padding: "16px 20px",
            marginBottom: 24,
            borderLeft: "4px solid var(--brand-500)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <InformationCircleIcon style={{ width: 24, height: 24, color: "var(--text-accent)", flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>This video project has not been published yet.</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
                Publish or schedule this post to start receiving live real-time views, likes, and engagement metrics.
              </p>
            </div>
          </div>
          <Link to={`/app/analysis/${projectId}`} className="btn btn-primary btn-sm">
            Publish or Schedule Post
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* Total Views */}
        <div className="glass-card animate-fadeInUp" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Total Views</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EyeIcon style={{ width: 18, height: 18, color: "var(--text-accent)" }} />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
            {metrics?.totalViews != null ? metrics.totalViews.toLocaleString() : 0}
          </p>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, display: "block" }}>
            {isPublished
              ? metrics?.reach > 0
                ? `${metrics.reach.toLocaleString()} total audience reach`
                : "Real-time cross-platform count"
              : "Awaiting publication"}
          </span>
        </div>

        {/* Watch Time / Duration */}
        <div className="glass-card animate-fadeInUp" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Watch Time</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClockIcon style={{ width: 18, height: 18, color: "#c084fc" }} />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
            {metrics?.estimatedMinutesWatched != null ? `${metrics.estimatedMinutesWatched} min` : "0 min"}
          </p>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, display: "block" }}>
            {metrics?.averageViewDuration > 0
              ? `Avg watch duration: ${metrics.averageViewDuration}s`
              : `Clip length: ${Math.round(duration || 0)}s`}
          </span>
        </div>

        {/* Total Likes */}
        <div className="glass-card animate-fadeInUp" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Likes & Upvotes</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HandThumbUpIcon style={{ width: 18, height: 18, color: "#4ade80" }} />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
            {metrics?.likes != null ? metrics.likes.toLocaleString() : 0}
          </p>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, display: "block" }}>
            {metrics?.likes > 0 ? "Direct audience reactions" : "No likes recorded yet"}
          </span>
        </div>

        {/* Total Comments */}
        <div className="glass-card animate-fadeInUp" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Comments & Feedback</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChatBubbleBottomCenterTextIcon style={{ width: 18, height: 18, color: "#fbbf24" }} />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
            {metrics?.comments != null ? metrics.comments.toLocaleString() : 0}
          </p>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, display: "block" }}>
            {metrics?.comments > 0 ? "Viewer discussion threads" : "No comments recorded yet"}
          </span>
        </div>
      </div>

      {/* Platform Breakdown (if published) */}
      {isPublished && (platformBreakdown?.youtube || platformBreakdown?.instagram) && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: 28, borderRadius: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px" }}>Platform Performance Breakdown</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {platformBreakdown.youtube && (
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 12,
                  background: "rgba(239, 68, 68, 0.05)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#ef4444" }}>YouTube Video</span>
                  <a
                    href={`https://www.youtube.com/watch?v=${platformBreakdown.youtube.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: "var(--text-accent)", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}
                  >
                    Watch on YouTube <ArrowTopRightOnSquareIcon style={{ width: 12, height: 12 }} />
                  </a>
                </div>
                <div style={{ display: "flex", gap: 20 }}>
                  <div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Views</span>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: "2px 0 0" }}>{platformBreakdown.youtube.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Likes</span>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: "2px 0 0" }}>{platformBreakdown.youtube.likes.toLocaleString()}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Comments</span>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: "2px 0 0" }}>{platformBreakdown.youtube.comments.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {platformBreakdown.instagram && (
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 12,
                  background: "rgba(225, 48, 108, 0.05)",
                  border: "1px solid rgba(225, 48, 108, 0.2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#E1306C" }}>Instagram Reel</span>
                  {platformBreakdown.instagram.permalink ? (
                    <a
                      href={platformBreakdown.instagram.permalink}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 12, color: "var(--text-accent)", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}
                    >
                      View on Instagram <ArrowTopRightOnSquareIcon style={{ width: 12, height: 12 }} />
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Connected</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 20 }}>
                  <div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Views/Plays</span>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: "2px 0 0" }}>{platformBreakdown.instagram.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Likes</span>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: "2px 0 0" }}>{platformBreakdown.instagram.likes.toLocaleString()}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Comments</span>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: "2px 0 0" }}>{platformBreakdown.instagram.comments.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart: Views Over Time */}
      <div className="glass-card" style={{ padding: "28px", marginBottom: 28, borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Daily Engagement & Views</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              {isPublished ? "Performance trajectory over the last 7 to 30 days" : "Baseline timeline preview"}
            </p>
          </div>
        </div>

        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 15, 30, 0.95)",
                  borderColor: "rgba(99, 102, 241, 0.3)",
                  borderRadius: "10px",
                  fontSize: "13px",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#viewsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cross-platform Publication Status */}
      <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
          Publishing & Distribution Network
        </h3>
        {platforms && platforms.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {platforms.map((p, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: p.platform === "instagram" ? "rgba(225, 48, 108, 0.2)" : "rgba(99, 102, 241, 0.2)",
                      color: p.platform === "instagram" ? "#E1306C" : "var(--text-accent)",
                    }}
                  >
                    {p.platform}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    Scheduled / Published: {new Date(p.scheduledAt).toLocaleDateString()}
                  </span>
                </div>
                <span
                  className={`badge ${
                    p.status === "published"
                      ? "badge-success"
                      : p.status === "cancelled"
                      ? "badge-muted"
                      : p.status === "failed"
                      ? "badge-danger"
                      : "badge-brand"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            No scheduled or automated publications attached to this video yet. Use the Analysis page or Content Calendar to schedule posts.
          </p>
        )}
      </div>
    </div>
  );
}
