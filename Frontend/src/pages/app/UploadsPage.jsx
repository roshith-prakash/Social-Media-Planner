import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getScheduledPosts, publishNow, cancelScheduledPost, verifyPostStatus } from "../../api/scheduleApi";
import { useUser } from "../../context/UserContext";
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  VideoCameraIcon,
  SparklesIcon,
  BoltIcon,
  TrashIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

// ── Platform colours & icons ──────────────────────────────────────────────────
const PLATFORMS = {
  youtube: {
    label: "YouTube",
    color: "#ef4444",
    gradient: "linear-gradient(135deg,#ef4444 0%,#dc2626 100%)",
    glow: "rgba(239,68,68,0.3)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    gradient: "linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
    glow: "rgba(225,48,108,0.3)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      </svg>
    ),
  },
};

// ── Friendly Error Formatter ──────────────────────────────────────────────────
function formatError(raw) {
  if (!raw) return "";
  if (raw.includes("ECONNRESET")) {
    return "Network reset while uploading video (write ECONNRESET). Click 'Retry Upload' below to re-attempt.";
  }
  if (raw.includes("googleapis.com/upload")) {
    return "YouTube upload request timed out. Click 'Retry Upload' below to re-attempt.";
  }
  if (raw.includes("YouTube is not connected")) {
    return "YouTube account is not connected. Connect it in Profile before publishing.";
  }
  if (raw.includes("Instagram account is not connected")) {
    return "Instagram account is not connected. Connect it in Profile before publishing.";
  }
  return raw;
}

// ── Publish progress overlay ──────────────────────────────────────────────────
function PublishingOverlay({ platform }) {
  const pf = PLATFORMS[platform] || PLATFORMS.youtube;
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      position: "absolute", inset: 0, borderRadius: 14,
      background: "rgba(10,10,20,0.88)", backdropFilter: "blur(6px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      zIndex: 10, gap: 12,
    }}>
      {/* Spinning ring */}
      <div style={{ position: "relative", width: 56, height: 56 }}>
        <svg width="56" height="56" style={{ animation: "spin 1.2s linear infinite" }}>
          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <circle cx="28" cy="28" r="22" fill="none" stroke={pf.color} strokeWidth="4"
            strokeDasharray="138" strokeDashoffset="100" strokeLinecap="round" />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: pf.color,
        }}>
          {pf.icon}
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
          Publishing to {pf.label}{dots}
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>This may take a minute</p>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    pending:              { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",   label: "Scheduled" },
    publishing:           { color: "#6366f1", bg: "rgba(99,102,241,0.12)",   label: "Publishing…" },
    published:            { color: "#4ade80", bg: "rgba(74,222,128,0.12)",   label: "Published" },
    failed:               { color: "#f87171", bg: "rgba(248,113,113,0.12)",  label: "Failed" },
    cancelled:            { color: "#94a3b8", bg: "rgba(148,163,184,0.08)",  label: "Cancelled" },
    deleted_on_platform:  { color: "#ef4444", bg: "rgba(239,68,68,0.15)",    label: "Deleted on Platform" },
  }[status] || { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", label: status };

  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
      background: cfg.bg, color: cfg.color, letterSpacing: "0.04em",
      textTransform: "uppercase",
    }}>
      {cfg.label}
    </span>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post, onPublishNow, onCancel, onVerify, publishing, verifying }) {
  const pf = PLATFORMS[post.platform] || PLATFORMS.youtube;
  const isPublishing = publishing === post.id;
  const isVerifying = verifying === post.id;
  const [showFullError, setShowFullError] = useState(false);
  const date = new Date(post.scheduledAt);
  const isPast = date < new Date();

  // Resolved external ID: direct on post OR from linked project
  const externalId =
    post.externalPostId ||
    (post.platform === "youtube" ? post.project?.youtubeVideoId : post.project?.instagramMediaId);

  return (
    <div style={{
      position: "relative", borderRadius: 14,
      background: "rgba(18,18,38,0.7)",
      border: `1px solid ${
        post.status === "published"
          ? "rgba(74,222,128,0.2)"
          : post.status === "deleted_on_platform"
          ? "rgba(239,68,68,0.3)"
          : "var(--border-subtle)"
      }`,
      padding: "18px 20px",
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* Publishing overlay */}
      {(isPublishing || post.status === "publishing") && <PublishingOverlay platform={post.platform} />}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Thumbnail or platform icon */}
        <div style={{
          width: 64, height: 48, borderRadius: 8, flexShrink: 0,
          overflow: "hidden", background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--border-subtle)",
        }}>
          {post.project?.thumbnailUrl ? (
            <img
              src={post.project.thumbnailUrl}
              alt={post.project.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <VideoCameraIcon style={{ width: 22, height: 22, color: "var(--text-muted)" }} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            {/* Platform pill */}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
              background: `${pf.color}20`, color: pf.color,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <span style={{ color: pf.color }}>{pf.icon}</span>
              {pf.label}
            </span>
            <StatusBadge status={post.status} />
          </div>

          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {post.project?.title || "Untitled"}
          </p>

          {post.content && (
            <p style={{
              fontSize: 12, color: "var(--text-secondary)", marginBottom: 4,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: 280,
            }}>
              {post.content}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ClockIcon style={{ width: 12, height: 12, color: "var(--text-muted)" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {isPast && post.status === "pending" ? "Was scheduled for " : ""}
              {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              {" · "}
              {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Published Video Link + Live Status Verification */}
          {post.status === "published" && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {externalId && (
                post.platform === "youtube" ? (
                  <a
                    href={`https://www.youtube.com/watch?v=${externalId}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "#ef4444", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", fontWeight: 600 }}
                  >
                    <ArrowTopRightOnSquareIcon style={{ width: 12, height: 12 }} />
                    View on YouTube
                  </a>
                ) : (
                  <span style={{ fontSize: 12, color: "#E1306C", fontWeight: 600 }}>
                    Media ID: {externalId}
                  </span>
                )
              )}

              {/* Check if video was deleted or is still live */}
              <button
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 6,
                  color: "var(--text-secondary)", border: "1px solid var(--border-subtle)",
                  display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
                }}
                onClick={() => onVerify(post)}
                disabled={isVerifying}
                title="Verify if the video is still active or has been deleted off the platform"
              >
                <ArrowPathIcon style={{ width: 11, height: 11, animation: isVerifying ? "spin 1s linear infinite" : "none" }} />
                {isVerifying ? "Checking…" : "Verify Live"}
              </button>
            </div>
          )}

          {/* Deleted on platform banner */}
          {post.status === "deleted_on_platform" && (
            <div style={{
              marginTop: 8, padding: "6px 10px", borderRadius: 8,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <InformationCircleIcon style={{ width: 14, height: 14, color: "#f87171", flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "#f87171" }}>
                Confirmed: This video was deleted from {pf.label}.
              </span>
            </div>
          )}

          {/* Error Message with friendly summary + expandable details */}
          {post.status === "failed" && post.errorMsg && (
            <div style={{ marginTop: 6 }}>
              <p style={{ fontSize: 11, color: "#f87171", margin: 0 }}>
                ⚠ {formatError(post.errorMsg)}
              </p>
              {post.errorMsg.length > 70 && (
                <button
                  type="button"
                  onClick={() => setShowFullError(!showFullError)}
                  style={{
                    background: "none", border: "none", padding: 0,
                    color: "var(--text-muted)", fontSize: 10, cursor: "pointer",
                    textDecoration: "underline", marginTop: 3, display: "block",
                  }}
                >
                  {showFullError ? "Hide raw error" : "Show technical details"}
                </button>
              )}
              {showFullError && (
                <pre style={{
                  fontSize: 10, color: "var(--text-muted)", background: "rgba(0,0,0,0.4)",
                  padding: 6, borderRadius: 6, marginTop: 4, whiteSpace: "pre-wrap", wordBreak: "break-all",
                }}>
                  {post.errorMsg}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Actions for Scheduled Posts */}
        {post.status === "pending" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button
              className="btn btn-sm"
              style={{
                background: pf.gradient, color: "#fff", border: "none",
                fontSize: 12, padding: "6px 12px", fontWeight: 600,
                boxShadow: `0 4px 12px ${pf.glow}`,
                display: "flex", alignItems: "center", gap: 5,
              }}
              onClick={() => onPublishNow(post)}
              disabled={isPublishing}
            >
              <BoltIcon style={{ width: 13, height: 13 }} />
              Publish Now
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, color: "#f87171", padding: "6px 12px", display: "flex", alignItems: "center", gap: 5 }}
              onClick={() => onCancel(post.id)}
              disabled={isPublishing}
            >
              <TrashIcon style={{ width: 13, height: 13 }} />
              Cancel
            </button>
          </div>
        )}

        {/* Actions for Failed Posts: Retry Upload or Dismiss */}
        {post.status === "failed" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button
              className="btn btn-sm"
              style={{
                background: pf.gradient, color: "#fff", border: "none",
                fontSize: 12, padding: "6px 12px", fontWeight: 600,
                boxShadow: `0 4px 12px ${pf.glow}`,
                display: "flex", alignItems: "center", gap: 5,
              }}
              onClick={() => onPublishNow(post)}
              disabled={isPublishing}
              title="Retry publishing to this platform"
            >
              <ArrowPathIcon style={{ width: 13, height: 13 }} />
              Retry Upload
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, color: "#f87171", padding: "6px 12px", display: "flex", alignItems: "center", gap: 5 }}
              onClick={() => onCancel(post.id)}
              disabled={isPublishing}
              title="Dismiss this failed entry"
            >
              <TrashIcon style={{ width: 13, height: 13 }} />
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Platform column ───────────────────────────────────────────────────────────
function PlatformColumn({ platform, posts, onPublishNow, onCancel, onVerify, publishing, verifying, connected }) {
  const pf = PLATFORMS[platform];
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const pendingCount   = posts.filter((p) => p.status === "pending").length;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Column header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, paddingBottom: 16,
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: pf.gradient, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 14px ${pf.glow}`, color: "#fff",
          }}>
            {pf.icon}
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{pf.label}</h2>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
              {publishedCount} published · {pendingCount} pending
            </p>
          </div>
        </div>
        <span style={{
          fontSize: 11, padding: "3px 8px", borderRadius: 99, fontWeight: 700,
          background: connected ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.10)",
          color: connected ? "#4ade80" : "#f87171",
        }}>
          {connected ? "✓ Connected" : "✕ Not Connected"}
        </span>
      </div>

      {/* Post cards */}
      {posts.length === 0 ? (
        <div style={{
          padding: "40px 20px", textAlign: "center",
          background: "rgba(255,255,255,0.02)", borderRadius: 12,
          border: "1px dashed var(--border-subtle)",
        }}>
          <CloudArrowUpIcon style={{ width: 36, height: 36, color: "var(--text-muted)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 4 }}>No {pf.label} uploads yet</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Schedule or publish a post from the Calendar or Analysis pages.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPublishNow={onPublishNow}
              onCancel={onCancel}
              onVerify={onVerify}
              publishing={publishing}
              verifying={verifying}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UploadsPage() {
  const { dbUser } = useUser();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const pollingRef = useRef(null);

  const isYouTubeConnected    = Boolean(dbUser?.youtubeChannelId || dbUser?.youtubeChannelName || dbUser?.youtubeAccessToken);
  const isInstagramConnected  = Boolean(dbUser?.instagramBusinessId || dbUser?.instagramId || dbUser?.instagramAccessToken);

  const fetchPosts = async () => {
    try {
      const res = await getScheduledPosts();
      setPosts(res.data?.data?.posts || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    pollingRef.current = setInterval(() => {
      fetchPosts();
    }, 8000);
    return () => clearInterval(pollingRef.current);
  }, []);

  const handlePublishNow = async (post) => {
    if (!window.confirm(`Publish this post immediately to ${PLATFORMS[post.platform]?.label || post.platform}?`)) return;

    setPublishingId(post.id);
    try {
      await publishNow({
        postId: post.id,
        projectId: post.projectId,
        platform: post.platform,
        content: post.content,
      });
      toast.success(`Published to ${PLATFORMS[post.platform]?.label || post.platform}!`);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Publish failed");
    } finally {
      setPublishingId(null);
    }
  };

  const handleVerifyStatus = async (post) => {
    setVerifyingId(post.id);
    try {
      const res = await verifyPostStatus(post.id);
      const data = res.data?.data;
      if (data?.isDeleted) {
        toast.error(`Confirmed: Video has been deleted off ${PLATFORMS[post.platform]?.label || post.platform}`);
      } else if (data?.exists) {
        toast.success(`Video is live and active on ${PLATFORMS[post.platform]?.label || post.platform}!`);
      } else {
        toast(data?.message || "Status checked", { icon: "ℹ️" });
      }
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to verify status");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this post entry?")) return;
    try {
      await cancelScheduledPost(id);
      toast.success("Post removed / cancelled");
      fetchPosts();
    } catch (err) {
      toast.error(err.message || "Failed to cancel");
    }
  };

  const youtubePosts   = posts.filter((p) => p.platform === "youtube");
  const instagramPosts = posts.filter((p) => p.platform === "instagram");

  return (
    <div style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, background: "var(--gradient-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--glow-brand)",
          }}>
            <CloudArrowUpIcon style={{ width: 22, height: 22, color: "#fff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Platform Uploads</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              Track your YouTube and Instagram posts in one place
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={fetchPosts}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <ArrowPathIcon style={{ width: 14, height: 14 }} />
            Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate("/app/calendar")}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <SparklesIcon style={{ width: 14, height: 14 }} />
            Schedule New Post
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && posts.length > 0 && (
        <div style={{
          display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap",
        }}>
          {[
            { label: "Total Posts",  value: posts.length,                                                     color: "#6366f1" },
            { label: "Published",    value: posts.filter(p => p.status === "published").length,               color: "#4ade80" },
            { label: "Pending",      value: posts.filter(p => p.status === "pending").length,                 color: "#f59e0b" },
            { label: "Failed",       value: posts.filter(p => p.status === "failed").length,                  color: "#f87171" },
            { label: "Deleted",      value: posts.filter(p => p.status === "deleted_on_platform").length,     color: "#ef4444" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: "1 1 120px", padding: "14px 18px", borderRadius: 12,
              background: "rgba(18,18,38,0.7)", border: "1px solid var(--border-subtle)",
            }}>
              <p style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 2 }}>{value}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
          <ArrowPathIcon style={{ width: 32, height: 32, margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 14 }}>Loading posts…</p>
        </div>
      ) : (
        /* Two-column layout: YouTube | Instagram */
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <PlatformColumn
            platform="youtube"
            posts={youtubePosts}
            onPublishNow={handlePublishNow}
            onCancel={handleCancel}
            onVerify={handleVerifyStatus}
            publishing={publishingId}
            verifying={verifyingId}
            connected={isYouTubeConnected}
          />
          <div style={{ width: 1, background: "var(--border-subtle)", alignSelf: "stretch", minHeight: 200 }} />
          <PlatformColumn
            platform="instagram"
            posts={instagramPosts}
            onPublishNow={handlePublishNow}
            onCancel={handleCancel}
            onVerify={handleVerifyStatus}
            publishing={publishingId}
            verifying={verifyingId}
            connected={isInstagramConnected}
          />
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
