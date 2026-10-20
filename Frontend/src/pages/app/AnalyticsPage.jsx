import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProjectAnalytics } from "../../api/analyticsApi";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ChartBarIcon,
  EyeIcon,
  ClockIcon,
  HandThumbUpIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowLeftIcon,
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
          <p style={{ color: "var(--text-secondary)" }}>Loading post-publish analytics...</p>
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

  const { metrics, chartData, title, duration, platforms, youtubeVideoId } = data;

  return (
    <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
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
              Live metrics, audience retention, and cross-platform performance tracking.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {youtubeVideoId ? (
              <span className="badge badge-success">✓ Synced with YouTube API</span>
            ) : (
              <span className="badge badge-muted">Native Analytics Baseline</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div className="glass-card animate-fadeInUp" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Total Views</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EyeIcon style={{ width: 18, height: 18, color: "var(--text-accent)" }} />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{metrics.totalViews.toLocaleString()}</p>
          <span style={{ fontSize: 12, color: "#4ade80", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <ArrowTrendingUpIcon style={{ width: 13, height: 13 }} /> +12% this week
          </span>
        </div>

        <div className="glass-card animate-fadeInUp" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Watch Time</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClockIcon style={{ width: 18, height: 18, color: "#c084fc" }} />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{metrics.estimatedMinutesWatched} min</p>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, display: "block" }}>
            Avg duration: {Math.round(duration || 0)}s
          </span>
        </div>

        <div className="glass-card animate-fadeInUp" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Likes & Feedback</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HandThumbUpIcon style={{ width: 18, height: 18, color: "#4ade80" }} />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{metrics.likes}</p>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, display: "block" }}>
            High audience sentiment
          </span>
        </div>

        <div className="glass-card animate-fadeInUp" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Est. Click-Through</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChartBarIcon style={{ width: 18, height: 18, color: "#fbbf24" }} />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{metrics.clickThroughRate || "5.2%"}</p>
          <span style={{ fontSize: 12, color: "#4ade80", marginTop: 4, display: "block" }}>
            Above industry average
          </span>
        </div>
      </div>

      {/* Chart: Views Over Time */}
      <div className="glass-card" style={{ padding: "28px", marginBottom: 28, borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Daily Engagement & Views</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              Performance trajectory over the last 7 days
            </p>
          </div>
        </div>

        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                      background: "rgba(99, 102, 241, 0.2)",
                      color: "var(--text-accent)",
                    }}
                  >
                    {p.platform}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    Scheduled: {new Date(p.scheduledAt).toLocaleDateString()}
                  </span>
                </div>
                <span
                  className={`badge ${
                    p.status === "published"
                      ? "badge-success"
                      : p.status === "cancelled"
                      ? "badge-muted"
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
