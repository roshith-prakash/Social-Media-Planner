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
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const ACCEPTED_TYPES = ["video/mp4", "video/mov", "video/avi", "video/webm", "video/quicktime", "video/x-msvideo"];
const MAX_SIZE_MB = 500;

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
          const pct = Math.round((e.loaded / e.total) * 95);
          setUploadPct(pct);
        }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
        else {
          console.error("Cloudinary error:", xhr.responseText);
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
            reject(new Error("Analysis is taking longer than expected. You can check its progress on the Projects page."));
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
          setAgentStatuses((prev) => ({
            ...prev,
            [data.agent]: { status: "running" },
          }));
        } else if (eventType === "agent_done") {
          setAgentStatuses((prev) => ({
            ...prev,
            [data.agent]: { status: data.status, elapsed: data.elapsed },
          }));
        } else if (eventType === "video_ready") {
          setVideoPrepStatus("ready");
        } else if (eventType === "cache_hit") {
          toast.success("⚡ Cache hit! Returning instant analysis.");
        }
      },
      () => {
        setStage("done");
      }
    );
  };

  // If redirected with ?projectId=..., auto-resume or trigger analysis
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
          setTimeout(() => {
            navigate(`/app/analysis/${analysisId}`);
          }, 1000);
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
    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  const handleAnalyze = async () => {
    if (!file) return toast.error("Please select a video first");
    setError(null);
    setAgentStatuses({});
    setVideoPrepStatus("ingesting");

    let unsubscribeSSE = null;

    try {
      // Stage 1: Upload
      setStage("uploading");
      setUploadPct(10);
      const sigRes = await getUploadSignature();
      const sigData = sigRes.data.data;
      const cloudResult = await uploadToCloudinary(file, sigData);
      setUploadPct(100);

      // Create project record
      const projectRes = await createVideoProject({
        title: title || file.name.replace(/\.[^/.]+$/, ""),
        cloudinaryPublicId: cloudResult.public_id,
        cloudinaryUrl: cloudResult.secure_url,
        thumbnailUrl: cloudResult.eager?.[0]?.secure_url || "",
        fileSize: cloudResult.bytes,
        duration: cloudResult.duration,
        format: cloudResult.format,
      });
      const projectId = projectRes.data.data.project.id;

      // Stage 2: AI Analysis with SSE real-time streaming
      setStage("analyzing");
      unsubscribeSSE = startSSETracking(projectId);

      await analyzeVideo(projectId);

      const analysisId = await pollForCompletion(projectId);
      unsubscribeSSE?.();

      // Stage 3: Done
      setStage("done");

      setTimeout(() => {
        navigate(`/app/analysis/${analysisId}`);
      }, 1000);
    } catch (err) {
      unsubscribeSSE?.();
      setStage(null);
      setError(err.message || "Something went wrong. Please try again.");
      toast.error(err.message || "Analysis failed");
    }
  };

  return (
    <div style={{ padding: "40px 32px", maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
          Analyze Your Video
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
          Upload a video and get a complete AI-powered strategy across YouTube and Instagram.
        </p>
        {dbUser?.totalAnalyses !== undefined && (
          <div className="badge badge-brand" style={{ marginTop: 10 }}>
            <SparklesIcon style={{ width: 13, height: 13 }} />
            {dbUser.totalAnalyses} analyses completed
          </div>
        )}
      </div>

      {/* Upload Zone */}
      {!stage && (
        <>
          <div
            id="video-dropzone"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !file && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "var(--brand-500)" : file ? "rgba(99,102,241,0.4)" : "var(--border-default)"}`,
              borderRadius: 20,
              padding: file ? "24px" : "60px 32px",
              textAlign: "center",
              cursor: file ? "default" : "pointer",
              background: dragOver ? "rgba(99,102,241,0.06)" : "rgba(13,13,31,0.5)",
              transition: "all 0.2s ease",
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
                  width: 72, height: 72, borderRadius: 20,
                  background: dragOver ? "var(--gradient-brand)" : "rgba(99,102,241,0.1)",
                  border: `1px solid ${dragOver ? "transparent" : "rgba(99,102,241,0.2)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                  transition: "all 0.3s ease",
                  animation: "float 4s ease-in-out infinite",
                }}>
                  <CloudArrowUpIcon style={{ width: 36, height: 36, color: dragOver ? "#fff" : "var(--text-accent)" }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                  {dragOver ? "Drop it!" : "Drop your video here"}
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
                  or click to browse · MP4, MOV, AVI, WebM · up to 500MB
                </p>
                <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  <VideoCameraIcon style={{ width: 16, height: 16 }} />
                  Choose Video
                </button>
              </>
            ) : (
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                {preview && (
                  <video src={preview} style={{ width: 160, height: 100, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} muted />
                )}
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <CheckCircleIcon style={{ width: 18, height: 18, color: "#4ade80" }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#4ade80" }}>Video selected</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {(file.size / (1024 * 1024)).toFixed(1)} MB · {file.type.split("/")[1]?.toUpperCase() || "MP4"}
                  </p>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                  style={{ flexShrink: 0 }}
                >
                  <XMarkIcon style={{ width: 16, height: 16 }} />
                </button>
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

      {/* Stage: Uploading to Cloudinary */}
      {stage === "uploading" && (
        <div className="glass-card animate-scaleIn" style={{ padding: 48, textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: "var(--gradient-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", boxShadow: "var(--glow-brand)",
          }}>
            <CloudArrowUpIcon style={{ width: 36, height: 36, color: "#fff", animation: "bounce 2s infinite" }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Uploading Video to Cloud...
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
            Direct secure upload to Cloudinary CDN ({uploadPct}%)
          </p>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 8, overflow: "hidden", maxWidth: 400, margin: "0 auto" }}>
            <div style={{
              height: "100%", borderRadius: 99, background: "var(--gradient-brand)",
              width: `${uploadPct}%`, transition: "width 0.3s ease",
            }} />
          </div>
        </div>
      )}

      {/* Stage: Analyzing with 7 Real-time Agents */}
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
