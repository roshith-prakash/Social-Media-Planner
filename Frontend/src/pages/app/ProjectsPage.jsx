import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getMyProjects, deleteProject, getProjectById } from "../../api/videoApi";
import { analyzeVideo } from "../../api/analysisApi";
import {
  SparklesIcon,
  VideoCameraIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { PlatformIcon } from "../../components/SocialLogos";

const STATUS_STYLES = {
  completed: { color: "var(--status-success-fg)", bg: "var(--status-success-bg)", border: "rgba(36,116,71,0.2)", label: "Complete" },
  analyzing: { color: "var(--brand-coral)", bg: "var(--brand-coral-light)", border: "rgba(240,90,67,0.2)", label: "Analyzing..." },
  pending:   { color: "var(--text-secondary)", bg: "var(--surface-secondary)", border: "var(--border)", label: "Pending" },
  failed:    { color: "var(--status-error-fg)", bg: "var(--status-error-bg)", border: "rgba(183,53,41,0.2)", label: "Failed" },
};

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatMB(b) { return `${(b / (1024 * 1024)).toFixed(1)} MB`; }
function formatDuration(s) {
  if (!s) return "";
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function ProjectThumbnail({ project }) {
  const [imgError, setImgError] = useState(false);

  // Compute thumbnail URL: use project.thumbnailUrl, or fallback to Cloudinary .jpg snapshot
  const thumbUrl = useMemo(() => {
    if (project.thumbnailUrl && project.thumbnailUrl.trim() !== "") {
      return project.thumbnailUrl;
    }
    const cdn = project.cloudinaryUrl || project.videoUrl;
    if (cdn && typeof cdn === "string") {
      return cdn.replace(/\.[^/.]+$/, ".jpg");
    }
    return null;
  }, [project.thumbnailUrl, project.cloudinaryUrl, project.videoUrl]);

  const videoUrl = project.cloudinaryUrl || project.videoUrl;

  if (thumbUrl && !imgError) {
    return (
      <img
        src={thumbUrl}
        alt={project.title}
        onError={() => setImgError(true)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.25s ease",
        }}
      />
    );
  }

  // Fallback 1: HTML5 video frame snapshot via preload="metadata" #t=0.5
  if (videoUrl) {
    return (
      <video
        src={`${videoUrl}#t=0.5`}
        preload="metadata"
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
        }}
      />
    );
  }

  // Fallback 2: Branded neutral placeholder
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2D2D2E 0%, #1A1A1B 100%)",
      }}
    >
      <VideoCameraIcon style={{ width: 44, height: 44, color: "rgba(255,255,255,0.25)" }} />
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyProjects(page);
      setProjects(res.data.data.projects);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const [analyzingIds, setAnalyzingIds] = useState(new Set());

  const handleStartAnalysis = async (projectId) => {
    setAnalyzingIds((prev) => new Set(prev).add(projectId));
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: "analyzing" } : p))
    );
    toast.success("AI analysis started");

    try {
      await analyzeVideo(projectId);

      // Poll until project is completed or failed
      const interval = setInterval(async () => {
        try {
          const res = await getProjectById(projectId);
          const updated = res.data?.data?.project;
          if (updated?.status === "completed") {
            clearInterval(interval);
            setAnalyzingIds((prev) => {
              const next = new Set(prev);
              next.delete(projectId);
              return next;
            });
            setProjects((prev) =>
              prev.map((p) => (p.id === projectId ? updated : p))
            );
            toast.success(`Analysis ready for "${updated.title}"! 🎉`);
          } else if (updated?.status === "failed") {
            clearInterval(interval);
            setAnalyzingIds((prev) => {
              const next = new Set(prev);
              next.delete(projectId);
              return next;
            });
            setProjects((prev) =>
              prev.map((p) => (p.id === projectId ? updated : p))
            );
            toast.error(updated.errorMessage || "Analysis failed");
          }
        } catch (e) {
          console.warn("Project poll error:", e);
        }
      }, 3000);
    } catch (err) {
      setAnalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: "pending" } : p))
      );
      toast.error(err.message || "Failed to trigger analysis");
    }
  };

  const handleDelete = async (projectId) => {
    if (!confirm("Delete this project and all its data?")) return;
    setDeleting(projectId);
    try {
      await deleteProject(projectId);
      setProjects((p) => p.filter((pr) => pr.id !== projectId));
      toast.success("Project deleted");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  return (
    <div style={{ padding: "36px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)", marginBottom: 6 }}>
            Creative Asset Library
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
            {pagination.total ?? projects.length} video project{pagination.total !== 1 ? "s" : ""} organized and ready for multi-platform distribution.
          </p>
        </div>
        <Link to="/app/upload" className="btn btn-primary">
          <SparklesIcon style={{ width: 16, height: 16 }} />
          Analyze New Video
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 24,
        flexWrap: "wrap",
      }}>
        {/* Search */}
        <div style={{ position: "relative", minWidth: 260, flex: 1, maxWidth: 380 }}>
          <MagnifyingGlassIcon style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            width: 16,
            height: 16,
            color: "var(--text-muted)",
          }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: 38, height: 40 }}
            placeholder="Search projects by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{
          display: "flex",
          gap: 6,
          background: "var(--surface-secondary)",
          padding: 3,
          borderRadius: 10,
          border: "1px solid var(--border)",
          overflowX: "auto",
        }}>
          {[
            { id: "all", label: "All" },
            { id: "completed", label: "Complete" },
            { id: "analyzing", label: "Analyzing" },
            { id: "pending", label: "Pending" },
            { id: "failed", label: "Failed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                border: "none",
                background: statusFilter === tab.id ? "var(--surface)" : "transparent",
                color: statusFilter === tab.id ? "var(--ink)" : "var(--text-secondary)",
                fontWeight: statusFilter === tab.id ? 600 : 500,
                fontSize: 12,
                padding: "6px 12px",
                borderRadius: 8,
                cursor: "pointer",
                boxShadow: statusFilter === tab.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="skeleton" style={{ height: 180, width: "100%", borderRadius: 0 }} />
              <div style={{ padding: 18 }}>
                <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 12, width: "40%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: "55%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "72px 24px", background: "var(--surface)" }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--brand-coral-subtle)",
            border: "1px solid var(--brand-coral-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}>
            <VideoCameraIcon style={{ width: 32, height: 32, color: "var(--brand-coral)" }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
            Your next great post starts with a video
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 14, maxWidth: 420, margin: "0 auto 24px" }}>
            Upload raw video footage. ReachAI analyzes hooks, audience demographics, and generates ready-to-publish assets.
          </p>
          <Link to="/app/upload" className="btn btn-primary">
            <SparklesIcon style={{ width: 16, height: 16 }} />
            Analyze Your First Video
          </Link>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px", background: "var(--surface)" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 12px" }}>
            No projects found matching your search or filter.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 28 }}>
            {filteredProjects.map((project) => {
              const statusStyle = STATUS_STYLES[project.status] || STATUS_STYLES.pending;
              const scorecard = project.analysis?.strategy?.scorecard;
              const topPlatform = project.analysis?.platformRecommendations?.[0];
              const isAnalyzing = project.status === "analyzing" || analyzingIds.has(project.id);

              return (
                <div
                  key={project.id}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  {/* 16:9 Thumbnail Header */}
                  <div style={{
                    position: "relative",
                    width: "100%",
                    paddingTop: "56.25%", // 16:9 Aspect Ratio
                    background: "#18181B",
                    overflow: "hidden",
                  }}>
                    <ProjectThumbnail project={project} />

                    {/* Top status tag */}
                    <div style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 600,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                        backdropFilter: "blur(6px)",
                      }}>
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* Duration badge overlay bottom-right */}
                    {project.duration > 0 && (
                      <div style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "rgba(0,0,0,0.75)",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                      }}>
                        {formatDuration(project.duration)}
                      </div>
                    )}
                  </div>

                  {/* Card Content Body */}
                  <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(project.createdAt)}</span>
                      {topPlatform && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: topPlatform.platform === "instagram" ? "#E1306C" : "#FF0033",
                          background: topPlatform.platform === "instagram" ? "#FFF0F4" : "#FFF0F0",
                          padding: "2px 8px",
                          borderRadius: 6,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}>
                          <PlatformIcon platform={topPlatform.platform} size={12} />
                          Best: {topPlatform.platform.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--ink)",
                      marginBottom: 10,
                      lineHeight: 1.35,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }} title={project.title}>
                      {project.title}
                    </h3>

                    {/* Meta badges */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                      {project.format && <span className="badge badge-muted">{project.format.toUpperCase()}</span>}
                      {project.fileSize > 0 && <span className="badge badge-muted">{formatMB(project.fileSize)}</span>}
                    </div>

                    {/* Overall score bar if available */}
                    {scorecard?.overallReadiness && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, marginTop: "auto" }}>
                        <div className="score-bar-track" style={{ flex: 1 }}>
                          <div className="score-bar-fill" style={{ width: `${scorecard.overallReadiness}%` }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-coral)", minWidth: 36, textAlign: "right" }}>
                          {scorecard.overallReadiness}/100
                        </span>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div style={{ display: "flex", gap: 8, marginTop: scorecard?.overallReadiness ? 0 : "auto", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                      {project.status === "completed" && (
                        <div style={{ display: "flex", gap: 6, flex: 1 }}>
                          {project.analysis?.id && (
                            <Link
                              to={`/app/analysis/${project.analysis.id}`}
                              className="btn btn-secondary btn-sm"
                              style={{ flex: 1, justifyContent: "center" }}
                            >
                              <ArrowTopRightOnSquareIcon style={{ width: 14, height: 14 }} />
                              Results
                            </Link>
                          )}
                          <Link
                            to={`/app/analytics/${project.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, justifyContent: "center" }}
                          >
                            <ChartBarIcon style={{ width: 14, height: 14 }} />
                            Analytics
                          </Link>
                        </div>
                      )}

                      {isAnalyzing && (
                        <Link
                          to={`/app/upload?projectId=${project.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, justifyContent: "center", color: "var(--brand-coral)", borderColor: "var(--brand-coral-light)" }}
                        >
                          <SparklesIcon style={{ width: 14, height: 14, animation: "spin-slow 3s linear infinite" }} />
                          Analyzing...
                        </Link>
                      )}

                      {project.status === "pending" && !isAnalyzing && (
                        <button
                          onClick={() => handleStartAnalysis(project.id)}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, justifyContent: "center" }}
                        >
                          <SparklesIcon style={{ width: 14, height: 14 }} />
                          Start Analysis
                        </button>
                      )}

                      {project.status === "failed" && !isAnalyzing && (
                        <button
                          onClick={() => handleStartAnalysis(project.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, justifyContent: "center", borderColor: "rgba(220,38,38,0.25)", color: "var(--status-error-fg)" }}
                        >
                          Retry Analysis
                        </button>
                      )}

                      <button
                        id={`delete-project-${project.id}`}
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--status-error-fg)", padding: "6px 10px" }}
                        onClick={() => handleDelete(project.id)}
                        disabled={deleting === project.id}
                        title="Delete project"
                      >
                        <TrashIcon style={{ width: 15, height: 15 }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                ← Previous
              </button>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Page {page} of {pagination.pages}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
