import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyProjects, deleteProject, getProjectById } from "../../api/videoApi";
import { analyzeVideo } from "../../api/analysisApi";
import {
  SparklesIcon,
  VideoCameraIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

import toast from "react-hot-toast";

const STATUS_STYLES = {
  completed: { color: "#4ade80", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)", label: "Complete" },
  analyzing: { color: "#f59e0b", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)", label: "Analyzing..." },
  pending:   { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.15)", label: "Pending" },
  failed:    { color: "#f87171", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", label: "Failed" },
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

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


  return (
    <div style={{ padding: "40px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>My Projects</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {pagination.total ?? 0} total project{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link to="/app/upload" className="btn btn-primary btn-sm">
          <SparklesIcon style={{ width: 16, height: 16 }} />
          New Analysis
        </Link>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: 20, height: 180 }}>
              <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 12, width: "40%", marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: "55%" }} />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 20px",
          }}>
            <VideoCameraIcon style={{ width: 36, height: 36, color: "var(--text-accent)" }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No projects yet</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 14 }}>
            Upload your first video to get an AI-powered strategy.
          </p>
          <Link to="/app/upload" className="btn btn-primary">
            <SparklesIcon style={{ width: 18, height: 18 }} />
            Analyze Your First Video
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 24 }}>
            {projects.map((project) => {
              const statusStyle = STATUS_STYLES[project.status] || STATUS_STYLES.pending;
              const scorecard = project.analysis?.strategy?.scorecard;
              const topPlatform = project.analysis?.platformRecommendations?.[0];
              return (
                <div key={project.id} className="glass-card animate-fadeInUp" style={{ padding: 22, display: "flex", flexDirection: "column" }}>
                  {/* Status + Date */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`,
                    }}>{statusStyle.label}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(project.createdAt)}</span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4, flex: 1 }}>
                    {project.title}
                  </h3>

                  {/* Meta */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                    {project.format && <span className="badge badge-muted">{project.format.toUpperCase()}</span>}
                    {project.duration > 0 && <span className="badge badge-muted">{formatDuration(project.duration)}</span>}
                    {project.fileSize > 0 && <span className="badge badge-muted">{formatMB(project.fileSize)}</span>}
                    {topPlatform && <span className="badge badge-brand">Best: {topPlatform.platform}</span>}
                  </div>

                  {/* Overall score */}
                  {scorecard?.overallReadiness && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <div className="score-bar-track" style={{ flex: 1 }}>
                        <div className="score-bar-fill" style={{ width: `${scorecard.overallReadiness}%` }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-accent)", minWidth: 36 }}>
                        {scorecard.overallReadiness}/100
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8 }}>
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

                    {(project.status === "analyzing" || analyzingIds.has(project.id)) && (
                      <Link
                        to={`/app/upload?projectId=${project.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, justifyContent: "center", color: "var(--text-accent)" }}
                      >
                        <SparklesIcon style={{ width: 14, height: 14, animation: "spin-slow 3s linear infinite" }} />
                        Analyzing...
                      </Link>
                    )}
                    {project.status === "pending" && !analyzingIds.has(project.id) && (
                      <button
                        onClick={() => handleStartAnalysis(project.id)}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: "center" }}
                      >
                        <SparklesIcon style={{ width: 14, height: 14 }} />
                        Analyze
                      </button>
                    )}
                    {project.status === "failed" && !analyzingIds.has(project.id) && (
                      <button
                        onClick={() => handleStartAnalysis(project.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, justifyContent: "center", borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }}
                      >
                        Retry Analysis
                      </button>
                    )}

                    <button
                      id={`delete-project-${project.id}`}
                      className="btn btn-ghost btn-sm"
                      style={{ color: "#f87171", padding: "8px 10px" }}
                      onClick={() => handleDelete(project.id)}
                      disabled={deleting === project.id}
                    >
                      <TrashIcon style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
              <span style={{ padding: "8px 12px", fontSize: 13, color: "var(--text-secondary)" }}>Page {page} of {pagination.pages}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
