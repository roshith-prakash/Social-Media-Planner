import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getScheduledPosts,
  publishNow,
  cancelScheduledPost,
  verifyPostStatus,
  verifyAllPosts,
} from "../../api/scheduleApi";
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
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { YouTubeLogo, InstagramLogo, PlatformIcon } from "../../components/SocialLogos";

// ── Platform colours & icons ──────────────────────────────────────────────────
const PLATFORMS = {
  youtube: {
    label: "YouTube",
    color: "#FF0033",
    gradient: "linear-gradient(135deg, #FF0033 0%, #CC0029 100%)",
    glow: "rgba(255, 0, 51, 0.25)",
    icon: <YouTubeLogo size={18} />,
    headerIcon: <YouTubeLogo size={20} variant="monochrome" />,
  },
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    gradient: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    glow: "rgba(225, 48, 108, 0.25)",
    icon: <InstagramLogo size={18} />,
    headerIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    ),
  },
};

// ── Friendly Error Formatter ──────────────────────────────────────────────────
function formatError(raw) {
  if (!raw) return "";
  const errStr = typeof raw === "string" ? raw : String(raw);
  if (errStr.includes("ECONNRESET")) {
    return "Network reset while uploading video. Click 'Retry Upload' below to re-attempt.";
  }
  if (errStr.includes("googleapis.com/upload")) {
    return "YouTube upload request timed out. Click 'Retry Upload' below to re-attempt.";
  }
  if (errStr.includes("YouTube is not connected")) {
    return "YouTube account is not connected. Connect it in Profile before publishing.";
  }
  if (errStr.includes("Instagram account is not connected")) {
    return "Instagram account is not connected. Connect it in Profile before publishing.";
  }
  return errStr;
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
      position: "absolute", inset: 0, borderRadius: "var(--radius-lg)",
      background: "rgba(255, 255, 255, 0.94)", backdropFilter: "blur(4px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      zIndex: 10, gap: 12,
    }}>
      <div style={{ position: "relative", width: 52, height: 52 }}>
        <svg width="52" height="52" style={{ animation: "spin 1.2s linear infinite" }}>
          <circle cx="26" cy="26" r="20" fill="none" stroke="var(--border)" strokeWidth="4" />
          <circle cx="26" cy="26" r="20" fill="none" stroke={pf.color} strokeWidth="4"
            strokeDasharray="125" strokeDashoffset="90" strokeLinecap="round" />
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
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
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
    pending:              { color: "var(--status-warning-fg)", bg: "var(--status-warning-bg)",   label: "⏳ Scheduled" },
    publishing:           { color: "var(--brand-coral)",       bg: "var(--brand-coral-subtle)",   label: "⚡ Publishing…" },
    published:            { color: "var(--status-success-fg)", bg: "var(--status-success-bg)",   label: "✓ Published" },
    failed:               { color: "var(--status-error-fg)",   bg: "var(--status-error-bg)",     label: "✕ Failed" },
    cancelled:            { color: "var(--status-neutral-fg)", bg: "var(--status-neutral-bg)",   label: "Cancelled" },
    deleted_on_platform:  { color: "var(--status-error-fg)",   bg: "var(--status-error-bg)",     label: "🗑 Deleted on Platform" },
  }[status] || { color: "var(--status-neutral-fg)", bg: "var(--status-neutral-bg)", label: status };

  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
      background: cfg.bg, color: cfg.color, letterSpacing: "0.04em",
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {cfg.label}
    </span>
  );
}

// ── Video Thumbnail Component with Fallbacks ──────────────────────────────────
function PostThumbnail({ project }) {
  const [imgError, setImgError] = useState(false);

  const thumbUrl = useMemo(() => {
    if (project?.thumbnailUrl && project.thumbnailUrl.trim() !== "") {
      return project.thumbnailUrl;
    }
    const cdn = project?.cloudinaryUrl || project?.videoUrl;
    if (cdn && typeof cdn === "string") {
      return cdn.replace(/\.[^/.]+$/, ".jpg");
    }
    return null;
  }, [project]);

  const videoUrl = project?.cloudinaryUrl || project?.videoUrl;

  if (thumbUrl && !imgError) {
    return (
      <img
        src={thumbUrl}
        alt={project?.title || "Video"}
        onError={() => setImgError(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  if (videoUrl) {
    return (
      <video
        src={`${videoUrl}#t=0.5`}
        preload="metadata"
        muted
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000" }}
      />
    );
  }

  return <VideoCameraIcon style={{ width: 22, height: 22, color: "var(--text-muted)" }} />;
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post, onPublishNow, onCancel, onVerify, publishing, verifying, instagramUsername }) {
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
      position: "relative", borderRadius: "var(--radius-lg)",
      background: "var(--surface)",
      border: `1px solid ${
        post.status === "published"
          ? "rgba(36,116,71,0.25)"
          : post.status === "deleted_on_platform"
          ? "rgba(183,53,41,0.25)"
          : "var(--border)"
      }`,
      boxShadow: "var(--shadow-card)",
      padding: "18px 20px",
      overflow: "hidden",
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    }}>
      {/* Publishing overlay */}
      {(isPublishing || post.status === "publishing") && <PublishingOverlay platform={post.platform} />}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Thumbnail or platform icon */}
        <div style={{
          width: 72, height: 50, borderRadius: "var(--radius-sm)", flexShrink: 0,
          overflow: "hidden", background: "var(--surface-secondary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--border)",
        }}>
          <PostThumbnail project={post.project} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
            {/* Platform pill */}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)",
              background: `${pf.color}15`, color: pf.color,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <PlatformIcon platform={post.platform} size={14} />
              {pf.label}
            </span>
            <StatusBadge status={post.status} />
          </div>

          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {post.project?.title || "Untitled Project"}
          </p>

          {post.content && (
            <p style={{
              fontSize: 12, color: "var(--text-secondary)", marginBottom: 6,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: 320,
            }}>
              {post.content}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ClockIcon style={{ width: 13, height: 13, color: "var(--text-muted)" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {isPast && post.status === "pending" ? "Was scheduled for " : ""}
              {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              {" · "}
              {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Published Video Link + Live Status Verification */}
          {post.status === "published" && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {externalId && (
                post.platform === "youtube" ? (
                  <a
                    href={`https://www.youtube.com/watch?v=${externalId}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "#FF0033", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", fontWeight: 650 }}
                  >
                    <span>Watch on YouTube</span>
                    <ArrowTopRightOnSquareIcon style={{ width: 13, height: 13 }} />
                  </a>
                ) : (
                  <a
                    href={instagramUsername ? `https://www.instagram.com/${instagramUsername}` : "https://www.instagram.com"}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "#E1306C", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", fontWeight: 650 }}
                  >
                    <span>View on Instagram</span>
                    <ArrowTopRightOnSquareIcon style={{ width: 13, height: 13 }} />
                  </a>
                )
              )}

              {/* Check if video was deleted or is still live */}
              <button
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: 11, padding: "3px 9px", borderRadius: 6,
                  color: "var(--text-secondary)", border: "1px solid var(--border)",
                  display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer",
                }}
                onClick={() => onVerify(post)}
                disabled={isVerifying}
                title="Verify if the video is still active or has been deleted off the platform"
              >
                <ArrowPathIcon style={{ width: 12, height: 12, animation: isVerifying ? "spin 1s linear infinite" : "none" }} />
                {isVerifying ? "Checking…" : "Verify Live"}
              </button>
            </div>
          )}

          {/* Deleted on platform banner */}
          {post.status === "deleted_on_platform" && (
            <div style={{
              marginTop: 10, padding: "10px 14px", borderRadius: 8,
              background: "var(--status-error-bg)", border: "1px solid rgba(183,53,41,0.3)",
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <InformationCircleIcon style={{ width: 18, height: 18, color: "var(--status-error-fg)", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 12, color: "var(--status-error-fg)", fontWeight: 700, margin: "0 0 2px" }}>
                  Video Deleted via {pf.label}
                </p>
                <p style={{ fontSize: 11.5, color: "var(--status-error-fg)", opacity: 0.9, margin: 0, lineHeight: 1.4 }}>
                  {post.errorMsg || `This video was removed or deleted directly from ${pf.label}. Click 'Re-publish' to upload again or 'Dismiss' to clear.`}
                </p>
              </div>
            </div>
          )}

          {/* Error Message with friendly summary + expandable details */}
          {post.status === "failed" && post.errorMsg && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 11.5, color: "var(--status-error-fg)", margin: 0, fontWeight: 500 }}>
                ⚠ {formatError(post.errorMsg)}
              </p>
              {post.errorMsg.length > 70 && (
                <button
                  type="button"
                  onClick={() => setShowFullError(!showFullError)}
                  style={{
                    background: "none", border: "none", padding: 0,
                    color: "var(--text-muted)", fontSize: 10.5, cursor: "pointer",
                    textDecoration: "underline", marginTop: 4, display: "block",
                  }}
                >
                  {showFullError ? "Hide raw error" : "Show technical details"}
                </button>
              )}
              {showFullError && (
                <pre style={{
                  fontSize: 10, color: "var(--text-secondary)", background: "var(--surface-secondary)",
                  border: "1px solid var(--border)",
                  padding: 8, borderRadius: 6, marginTop: 6, whiteSpace: "pre-wrap", wordBreak: "break-all",
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
                fontSize: 12, padding: "7px 14px", fontWeight: 650,
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
              style={{ fontSize: 12, color: "var(--status-error-fg)", padding: "6px 12px", display: "flex", alignItems: "center", gap: 5 }}
              onClick={() => onCancel(post.id)}
              disabled={isPublishing}
            >
              <TrashIcon style={{ width: 13, height: 13 }} />
              Cancel
            </button>
          </div>
        )}

        {/* Actions for Posts Deleted on Platform: Re-publish, Re-check, or Dismiss */}
        {post.status === "deleted_on_platform" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button
              className="btn btn-sm"
              style={{
                background: pf.gradient, color: "#fff", border: "none",
                fontSize: 12, padding: "7px 14px", fontWeight: 650,
                boxShadow: `0 4px 12px ${pf.glow}`,
                display: "flex", alignItems: "center", gap: 5,
              }}
              onClick={() => onPublishNow(post)}
              disabled={isPublishing}
              title="Re-upload and publish this video again to the platform"
            >
              <ArrowPathIcon style={{ width: 13, height: 13 }} />
              Re-publish
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: 11, padding: "5px 10px", borderRadius: 6,
                color: "var(--text-secondary)", border: "1px solid var(--border)",
                display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
              }}
              onClick={() => onVerify(post)}
              disabled={isVerifying}
              title="Re-verify if video was restored"
            >
              <ArrowPathIcon style={{ width: 11, height: 11, animation: isVerifying ? "spin 1s linear infinite" : "none" }} />
              {isVerifying ? "Checking…" : "Re-check"}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, color: "var(--status-error-fg)", padding: "6px 12px", display: "flex", alignItems: "center", gap: 5 }}
              onClick={() => onCancel(post.id)}
              disabled={isPublishing}
              title="Dismiss this deleted entry"
            >
              <TrashIcon style={{ width: 13, height: 13 }} />
              Dismiss
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
                fontSize: 12, padding: "7px 14px", fontWeight: 650,
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
              style={{ fontSize: 12, color: "var(--status-error-fg)", padding: "6px 12px", display: "flex", alignItems: "center", gap: 5 }}
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
function PlatformColumn({ platform, posts, onPublishNow, onCancel, onVerify, publishing, verifying, connected, instagramUsername, navigate }) {
  const pf = PLATFORMS[platform];
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const pendingCount   = posts.filter((p) => p.status === "pending").length;
  const deletedCount   = posts.filter((p) => p.status === "deleted_on_platform").length;

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      {/* Column header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, paddingBottom: 14,
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: pf.gradient, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 14px ${pf.glow}`, color: "#fff",
          }}>
            {pf.headerIcon || pf.icon}
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>{pf.label}</h2>
            <p style={{ fontSize: 11.5, color: "var(--text-secondary)", margin: "2px 0 0" }}>
              {publishedCount} published · {pendingCount} pending{deletedCount > 0 ? ` · ${deletedCount} deleted` : ""}
            </p>
          </div>
        </div>
        <span style={{
          fontSize: 11, padding: "3px 9px", borderRadius: 99, fontWeight: 700,
          background: connected ? "var(--status-success-bg)" : "var(--status-error-bg)",
          color: connected ? "var(--status-success-fg)" : "var(--status-error-fg)",
        }}>
          {connected ? "✓ Connected" : "✕ Not Connected"}
        </span>
      </div>

      {/* Post cards */}
      {posts.length === 0 ? (
        <div style={{
          padding: "44px 24px", textAlign: "center",
          background: "var(--surface)", borderRadius: "var(--radius-lg)",
          border: "1.5px dashed var(--border-strong)",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <CloudArrowUpIcon style={{ width: 40, height: 40, color: "var(--text-muted)", marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>No {pf.label} uploads yet</p>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 16, maxWidth: 300 }}>
            Schedule or publish a post from the Calendar or Video Analysis pages.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/app/calendar")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
          >
            <CalendarDaysIcon style={{ width: 14, height: 14 }} />
            Open Content Calendar
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPublishNow={onPublishNow}
              onCancel={onCancel}
              onVerify={onVerify}
              publishing={publishing}
              verifying={verifying}
              instagramUsername={instagramUsername}
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
  const [syncingAll, setSyncingAll] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" = newest first, "asc" = oldest first
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

  const syncLiveStatus = async (showToast = false) => {
    try {
      setSyncingAll(true);
      const res = await verifyAllPosts();
      const results = res.data?.data?.results || [];
      const deletedFound = results.filter((r) => r.isDeleted).length;
      if (showToast) {
        if (deletedFound > 0) {
          toast.error(`Sync complete: ${deletedFound} video(s) detected as deleted on platform.`, { duration: 4500 });
        } else {
          toast.success("Live status synced: all published videos are active!");
        }
      }
      await fetchPosts();
    } catch (err) {
      if (showToast) {
        toast.error(err.response?.data?.message || err.message || "Failed to sync live status");
      }
    } finally {
      setSyncingAll(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Auto-verify live status across platforms in background on load
    const timer = setTimeout(() => {
      syncLiveStatus(false);
    }, 1200);

    pollingRef.current = setInterval(() => {
      fetchPosts();
    }, 15000);

    return () => {
      clearTimeout(timer);
      clearInterval(pollingRef.current);
    };
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

  // Sort posts from newest to oldest by default (or oldest to newest when toggled)
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const timeA = new Date(a.scheduledAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.scheduledAt || b.createdAt || 0).getTime();
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });
  }, [posts, sortOrder]);

  const youtubePosts   = useMemo(() => sortedPosts.filter((p) => p.platform === "youtube"), [sortedPosts]);
  const instagramPosts = useMemo(() => sortedPosts.filter((p) => p.platform === "instagram"), [sortedPosts]);

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1240, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--brand-coral)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(240, 90, 67, 0.25)", color: "#fff",
          }}>
            <CloudArrowUpIcon style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: 0, letterSpacing: "-0.02em" }}>Platform Uploads</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>
              Track and manage your YouTube and Instagram publications in real time
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Sort order toggle (Newest First / Oldest First) */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "2px",
            gap: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <button
              type="button"
              onClick={() => setSortOrder("desc")}
              style={{
                border: "none",
                background: sortOrder === "desc" ? "var(--brand-coral)" : "transparent",
                color: sortOrder === "desc" ? "#fff" : "var(--text-secondary)",
                fontSize: 11.5,
                fontWeight: 650,
                padding: "5px 11px",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Sort from newest to oldest"
            >
              ↓ Newest
            </button>
            <button
              type="button"
              onClick={() => setSortOrder("asc")}
              style={{
                border: "none",
                background: sortOrder === "asc" ? "var(--brand-coral)" : "transparent",
                color: sortOrder === "asc" ? "#fff" : "var(--text-secondary)",
                fontSize: 11.5,
                fontWeight: 650,
                padding: "5px 11px",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Sort from oldest to newest"
            >
              ↑ Oldest
            </button>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => syncLiveStatus(true)}
            disabled={syncingAll}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
            title="Query YouTube and Instagram APIs to verify if any published videos have been deleted"
          >
            <ArrowPathIcon style={{ width: 14, height: 14, animation: syncingAll ? "spin 1s linear infinite" : "none" }} />
            {syncingAll ? "Syncing Live…" : "Sync Live Status"}
          </button>
          <button
            className="btn btn-secondary btn-sm"
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
          display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap",
        }}>
          {[
            { label: "Total Posts",  value: posts.length,                                                     color: "var(--ink)" },
            { label: "Published",    value: posts.filter(p => p.status === "published").length,               color: "var(--status-success-fg)" },
            { label: "Pending",      value: posts.filter(p => p.status === "pending").length,                 color: "var(--status-warning-fg)" },
            { label: "Failed",       value: posts.filter(p => p.status === "failed").length,                  color: "var(--status-error-fg)" },
            { label: "Deleted",      value: posts.filter(p => p.status === "deleted_on_platform").length,     color: "#FF0033" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: "1 1 140px", padding: "14px 18px", borderRadius: "var(--radius-md)",
              background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)",
            }}>
              <p style={{ fontSize: 24, fontWeight: 800, color, margin: "0 0 2px" }}>{value}</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, fontWeight: 500 }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
          <ArrowPathIcon style={{ width: 32, height: 32, margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 14 }}>Loading platform uploads…</p>
        </div>
      ) : (
        /* Responsive two-column grid: YouTube | Instagram */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: 28,
          alignItems: "start",
        }}>
          <PlatformColumn
            platform="youtube"
            posts={youtubePosts}
            onPublishNow={handlePublishNow}
            onCancel={handleCancel}
            onVerify={handleVerifyStatus}
            publishing={publishingId}
            verifying={verifyingId}
            connected={isYouTubeConnected}
            instagramUsername={dbUser?.instagramUsername}
            navigate={navigate}
          />
          <PlatformColumn
            platform="instagram"
            posts={instagramPosts}
            onPublishNow={handlePublishNow}
            onCancel={handleCancel}
            onVerify={handleVerifyStatus}
            publishing={publishingId}
            verifying={verifyingId}
            connected={isInstagramConnected}
            instagramUsername={dbUser?.instagramUsername}
            navigate={navigate}
          />
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
