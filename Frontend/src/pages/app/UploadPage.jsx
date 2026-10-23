import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { getUploadSignature, createVideoProject, getProjectById } from "../../api/videoApi";
import { analyzeVideo } from "../../api/analysisApi";
import { subscribeToAnalysis } from "../../api/sseApi";
import AgentProgressTracker from "../../components/AgentProgressTracker";
import {
  CloudArrowUpIcon,
  SparklesIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const ACCEPTED_TYPES = ["video/mp4", "video/mov", "video/avi", "video/webm", "video/quicktime", "video/x-msvideo"];
const MAX_SIZE_MB = 20;

// ── Upload Progress Bar Component ────────────────────────────────────────────
function UploadProgressUI({ pct }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="card animate-scaleIn" style={{ padding: "48px 32px", textAlign: "center" }}>
      {/* Circular progress ring */}
      <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 28px" }}>
        <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="70" cy="70" r={radius} fill="none"
            stroke="var(--brand-coral)" strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />
        </svg>
        {/* Centre text */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <CloudArrowUpIcon style={{ width: 24, height: 24, color: "var(--brand-coral)", marginBottom: 4 }} />
          <span style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>{pct}%</span>
        </div>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>Uploading to Studio…</h2>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
        Securely uploading your video asset
      </p>

      {/* Linear bar */}
      <div style={{
        background: "var(--surface-secondary)", borderRadius: "var(--radius-full)", height: 6, overflow: "hidden", maxWidth: 360, margin: "0 auto",
      }}>
        <div style={{
          height: "100%", borderRadius: "var(--radius-full)",
          background: "var(--brand-coral)",
          width: `${pct}%`, transition: "width 0.3s ease",
        }} />
      </div>

      {/* Steps indicator */}
      <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 28 }}>
        {[
          { label: "Compressing", done: pct >= 20 },
          { label: "Uploading", done: pct >= 70 },
          { label: "Processing", done: pct >= 100 },
        ].map(({ label, done }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: done ? "var(--status-success-bg)" : "var(--surface-secondary)",
              border: `1px solid ${done ? "rgba(36, 116, 71, 0.25)" : "var(--border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.25s ease",
            }}>
              {done
                ? <CheckCircleIcon style={{ width: 14, height: 14, color: "var(--status-success-fg)" }} />
                : <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)" }} />
              }
            </div>
            <span style={{ fontSize: 11, color: done ? "var(--status-success-fg)" : "var(--text-muted)", fontWeight: 600 }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Video Player Component ────────────────────────────────────────────────────
function VideoPlayer({ src, title }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnded = () => setPlaying(false);
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, []);

  return (
    <div style={{
      background: "#000000", borderRadius: "var(--radius-lg)", overflow: "hidden",
      border: "1px solid var(--border)", marginBottom: 20, position: "relative",
    }}>
      <video
        ref={videoRef}
        src={src}
        style={{ width: "100%", maxHeight: 340, display: "block", objectFit: "contain", background: "#000" }}
        preload="metadata"
        onClick={togglePlay}
      />
      {/* Overlay play/pause */}
      <button
        onClick={togglePlay}
        style={{
          position: "absolute", bottom: 12, left: 12,
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(32,32,31,0.8)", border: "1px solid rgba(255,255,255,0.25)",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "transform 0.15s ease",
        }}
      >
        {playing ? <PauseIcon style={{ width: 16, height: 16 }} /> : <PlayIcon style={{ width: 16, height: 16, marginLeft: 2 }} />}
      </button>
      {title && (
        <div style={{
          position: "absolute", bottom: 12, right: 12,
          background: "rgba(0,0,0,0.7)", borderRadius: 6,
          padding: "2px 8px", fontSize: 11, color: "rgba(255,255,255,0.7)",
        }}>
          {title}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UploadPage() {
  const navigate = useNavigate();
  const { dbUser } = useUser();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState(null); // null | "uploading" | "analyzing" | "done"
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState(null);
  const [agentStatuses, setAgentStatuses] = useState({});
  const [videoPrepStatus, setVideoPrepStatus] = useState("ingesting");
  // Uploaded cloud URL — used for in-app video playback after upload
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);

  // Revoke object URL on cleanup (memory leak fix)
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const validateFile = (f) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return "Please upload a valid video file (MP4, MOV, AVI, WebM)";
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File is too large. Maximum size is ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const handleFile = (f) => {
    const err = validateFile(f);
    if (err) { toast.error(err); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const uploadToCloudinary = async (file, sigData) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sigData.apiKey);
    formData.append("signature", sigData.signature);
    formData.append("timestamp", sigData.timestamp);
    formData.append("folder", sigData.folder);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dvwdsxirc";
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          // Map 0–100% of actual upload to 20–95% of displayed progress
          const pct = Math.round(20 + (e.loaded / e.total) * 75);
          setUploadPct(pct);
        }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          setUploadPct(100);
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error("Cloudinary upload failed: " + xhr.responseText));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
      xhr.open("POST", url);
      xhr.send(formData);
    });
  };

  const pollForCompletion = async (projectId) => {
    let attempts = 0;
    const maxAttempts = 150; // ~5 minutes at 2s intervals

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = await getProjectById(projectId);
          const prj = res.data?.data?.project;

          if (prj?.status === "completed" && prj?.analysis?.id) {
            clearInterval(interval);
            setStage("done");
            return resolve(prj.analysis.id);
          }

          if (prj?.status === "failed") {
            clearInterval(interval);
            return reject(new Error(prj.errorMessage || "Analysis pipeline failed"));
          }

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(new Error("Analysis is taking longer than expected. Check progress on the Projects page."));
          }
        } catch (pollErr) {
          console.warn("Polling error:", pollErr);
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(pollErr);
          }
        }
      }, 2000);
    });
  };

  const startSSETracking = (projectId) => {
    return subscribeToAnalysis(
      projectId,
      (eventType, data) => {
        if (eventType === "agent_start") {
          setAgentStatuses((prev) => ({ ...prev, [data.agent]: { status: "running" } }));
        } else if (eventType === "agent_done") {
          setAgentStatuses((prev) => ({ ...prev, [data.agent]: { status: data.status, elapsed: data.elapsed } }));
        } else if (eventType === "video_ready") {
          setVideoPrepStatus("ready");
        } else if (eventType === "cache_hit") {
          toast.success("⚡ Cache hit! Returning instant analysis.");
        }
      },
      () => { setStage("done"); }
    );
  };

  // If redirected with ?projectId=..., auto-resume analysis
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const existingProjectId = params.get("projectId");
    if (!existingProjectId) return;

    let isMounted = true;
    setStage("analyzing");
    const unsubscribe = startSSETracking(existingProjectId);

    const runExisting = async () => {
      try {
        await analyzeVideo(existingProjectId).catch(() => {});
        const analysisId = await pollForCompletion(existingProjectId);
        if (isMounted) {
          unsubscribe?.();
          setStage("done");
          setTimeout(() => navigate(`/app/analysis/${analysisId}`), 1000);
        }
      } catch (err) {
        if (isMounted) {
          unsubscribe?.();
          setStage(null);
          setError(err.message || "Analysis failed");
          toast.error(err.message || "Analysis failed");
        }
      }
    };

    runExisting();
    return () => { isMounted = false; unsubscribe?.(); };
  }, []);

  const handleAnalyze = async () => {
    if (!file) return toast.error("Please select a video first");
    setError(null);
    setAgentStatuses({});
    setVideoPrepStatus("ingesting");
    setUploadedVideoUrl(null);

    let unsubscribeSSE = null;

    try {
      // Stage 1: Upload
      setStage("uploading");
      setUploadPct(10);
      const sigRes = await getUploadSignature();
      const sigData = sigRes.data.data;
      const cloudResult = await uploadToCloudinary(file, sigData);

      // Save cloud URL so the user can watch the uploaded video
      setUploadedVideoUrl(cloudResult.secure_url);

      const autoThumb = cloudResult.secure_url ? cloudResult.secure_url.replace(/\.[^/.]+$/, ".jpg") : "";
      const projectRes = await createVideoProject({
        title: title || file.name.replace(/\.[^/.]+$/, ""),
        cloudinaryPublicId: cloudResult.public_id,
        cloudinaryUrl: cloudResult.secure_url,
        thumbnailUrl: cloudResult.eager?.[0]?.secure_url || autoThumb,
        fileSize: cloudResult.bytes,
        duration: cloudResult.duration,
        format: cloudResult.format,
      });
      const projectId = projectRes.data.data.project.id;

      // Stage 2: AI Analysis
      setStage("analyzing");
      unsubscribeSSE = startSSETracking(projectId);
      await analyzeVideo(projectId);
      const analysisId = await pollForCompletion(projectId);
      unsubscribeSSE?.();

      // Stage 3: Done
      setStage("done");
      setTimeout(() => navigate(`/app/analysis/${analysisId}`), 1200);
    } catch (err) {
      unsubscribeSSE?.();
      setStage(null);
      setError(err.message || "Something went wrong. Please try again.");
      toast.error(err.message || "Analysis failed");
    }
  };

  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : 0;

  return (
    <div style={{ padding: "40px 32px", maxWidth: 860, margin: "0 auto" }}>
      {/* Header (Section 9 & 10) */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.025em", marginBottom: 6 }}>
          Make something worth watching.
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Upload a video (up to {MAX_SIZE_MB}MB) and transform it into a complete social strategy across YouTube and Instagram.
        </p>
        {dbUser?.totalAnalyses !== undefined && (
          <div className="badge badge-brand" style={{ marginTop: 12 }}>
            <SparklesIcon style={{ width: 13, height: 13 }} />
            {dbUser.totalAnalyses} videos analyzed
          </div>
        )}
      </div>

      {/* ── Idle state: drop zone + video preview ── */}
      {!stage && (
        <>
          {/* Drop zone */}
          <div
            id="video-dropzone"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !file && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "var(--brand-coral)" : file ? "var(--border-strong)" : "var(--border)"}`,
              borderRadius: "var(--radius-xl)",
              padding: file ? "20px" : "54px 32px",
              textAlign: "center",
              cursor: file ? "default" : "pointer",
              background: dragOver ? "var(--brand-coral-subtle)" : "var(--surface)",
              boxShadow: "var(--shadow-card)",
              transition: "all 0.15s ease",
              marginBottom: 20,
              position: "relative",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {!file ? (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: "var(--radius-lg)",
                  background: dragOver ? "var(--brand-coral)" : "var(--brand-coral-subtle)",
                  border: `1px solid ${dragOver ? "transparent" : "var(--brand-coral-light)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 18px", transition: "all 0.2s ease",
                }}>
                  <CloudArrowUpIcon style={{ width: 32, height: 32, color: dragOver ? "#fff" : "var(--brand-coral)" }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
                  {dragOver ? "Drop your video file here" : "Upload your video asset"}
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 18 }}>
                  Drag & drop or click to browse · MP4, MOV, AVI, WebM · up to {MAX_SIZE_MB}MB
                </p>
                <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  <VideoCameraIcon style={{ width: 15, height: 15, color: "var(--brand-coral)" }} />
                  Choose File
                </button>
              </>
            ) : (
              /* File selected — show preview + metadata */
              <div>
                {/* In-app video player */}
                <VideoPlayer src={preview} title={file.name} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, padding: "8px 4px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircleIcon style={{ width: 18, height: 18, color: "var(--status-success-fg)", flexShrink: 0 }} />
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{file.name}</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: "var(--radius-full)",
                          background: fileSizeMB > MAX_SIZE_MB * 0.8 ? "var(--status-error-bg)" : "var(--status-success-bg)",
                          color: fileSizeMB > MAX_SIZE_MB * 0.8 ? "var(--status-error-fg)" : "var(--status-success-fg)",
                          fontWeight: 700,
                        }}>
                          {fileSizeMB} MB / {MAX_SIZE_MB}MB
                        </span>
                        <span style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: "var(--radius-full)",
                          background: "var(--surface-secondary)", color: "var(--text-secondary)", fontWeight: 600, border: "1px solid var(--border)",
                        }}>
                          {file.type.split("/")[1]?.toUpperCase() || "VIDEO"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => { e.stopPropagation(); URL.revokeObjectURL(preview); setFile(null); setPreview(null); }}
                    style={{ flexShrink: 0, color: "var(--status-error-fg)" }}
                  >
                    <XMarkIcon style={{ width: 16, height: 16 }} />
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Title input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8, color: "var(--text-secondary)" }}>
              Project title <span style={{ color: "var(--text-muted)" }}>(optional)</span>
            </label>
            <input
              id="project-title-input"
              type="text"
              className="input"
              placeholder="e.g. How I built a SaaS in 30 days"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 20,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171", fontSize: 14,
            }}>
              {error}
            </div>
          )}

          <button
            id="analyze-btn"
            className="btn btn-primary btn-lg"
            style={{ width: "100%" }}
            onClick={handleAnalyze}
            disabled={!file}
          >
            <SparklesIcon style={{ width: 20, height: 20 }} />
            Run AI Multi-Agent Analysis
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
            7 Specialized Agents · Real-time Streaming · Gemini 2.5 Flash
          </p>
        </>
      )}

      {/* ── Stage: Uploading to Cloudinary ── */}
      {stage === "uploading" && <UploadProgressUI pct={uploadPct} />}

      {/* ── Uploaded video viewer (shows while analyzing) ── */}
      {(stage === "analyzing" || stage === "done") && uploadedVideoUrl && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <CheckCircleIcon style={{ width: 16, height: 16, color: "#4ade80" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#4ade80" }}>Video uploaded successfully</span>
          </div>
          <VideoPlayer src={uploadedVideoUrl} title={title || file?.name} />
        </div>
      )}

      {/* ── Stage: Analyzing with 7 Real-time Agents ── */}
      {(stage === "analyzing" || stage === "done") && (
        <AgentProgressTracker
          agentStatuses={agentStatuses}
          videoPrepStatus={videoPrepStatus}
          isComplete={stage === "done"}
        />
      )}
    </div>
  );
}
