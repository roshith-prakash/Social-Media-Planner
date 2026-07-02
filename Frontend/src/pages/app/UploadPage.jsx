import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { getUploadSignature, createVideoProject } from "../../api/videoApi";
import { analyzeVideo } from "../../api/analysisApi";
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

const UPLOAD_STAGES = [
  { key: "uploading", label: "Uploading to Cloud", pct: 30 },
  { key: "analyzing", label: "Running AI Agents", pct: 60 },
  { key: "saving", label: "Saving Results", pct: 90 },
  { key: "done", label: "Complete!", pct: 100 },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const { dbUser } = useUser();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState(null); // null | one of UPLOAD_STAGES keys
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState(null);

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

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 25); // 0-25%
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

  const handleAnalyze = async () => {
    if (!file) return toast.error("Please select a video first");
    setError(null);

    try {
      // Stage 1: Upload
      setStage("uploading");
      setUploadPct(5);
      const sigRes = await getUploadSignature();
      const sigData = sigRes.data.data;
      const cloudResult = await uploadToCloudinary(file, sigData);
      setUploadPct(30);

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

      // Stage 2: AI Analysis
      setStage("analyzing");
      setUploadPct(40);
      const analysisRes = await analyzeVideo(projectId);
      const analysisId = analysisRes.data.data.analysis.id;

      // Stage 3: Done
      setStage("done");
      setUploadPct(100);

      setTimeout(() => {
        navigate(`/app/analysis/${analysisId}`);
      }, 800);

    } catch (err) {
      setStage(null);
      setError(err.message || "Something went wrong. Please try again.");
      toast.error(err.message || "Analysis failed");
    }
  };

  const currentStageIdx = UPLOAD_STAGES.findIndex(s => s.key === stage);

  return (
    <div style={{ padding: "40px 32px", maxWidth: 800, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
          Analyze Your Video
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
          Upload a video and get a complete AI-powered strategy in under 60 seconds.
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
                    {(file.size / (1024 * 1024)).toFixed(1)} MB · {file.type.split("/")[1].toUpperCase()}
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
            Run AI Analysis
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
            7 AI agents · ~30–60 seconds · Powered by Gemini 2.5 Flash
          </p>
        </>
      )}

      {/* Progress View */}
      {stage && (
        <div className="glass-card animate-scaleIn" style={{ padding: 48, textAlign: "center" }}>
          {/* Animated Logo */}
          <div style={{
            width: 80, height: 80, borderRadius: 22, background: "var(--gradient-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px", animation: stage === "done" ? "none" : "pulse-glow 2s ease-in-out infinite",
            boxShadow: "var(--glow-brand)",
          }}>
            {stage === "done"
              ? <CheckCircleIcon style={{ width: 44, height: 44, color: "#fff" }} />
              : <SparklesIcon style={{ width: 44, height: 44, color: "#fff", animation: "spin-slow 3s linear infinite" }} />
            }
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>
            {stage === "done" ? "Analysis Complete! 🎉" : "AI Agents Working..."}
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32 }}>
            {stage === "uploading" && "Uploading your video to secure cloud storage..."}
            {stage === "analyzing" && "7 specialized AI agents are analyzing your video in parallel..."}
            {stage === "done" && "Redirecting to your results..."}
          </p>

          {/* Progress Bar */}
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 8, marginBottom: 24, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99, background: "var(--gradient-brand)",
              width: `${uploadPct}%`, transition: "width 0.6s ease",
            }} />
          </div>

          {/* Stage list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
            {UPLOAD_STAGES.map((s, i) => {
              const done = currentStageIdx > i || stage === "done";
              const active = s.key === stage;
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: done ? "var(--gradient-brand)" : active ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)",
                    border: active ? "2px solid var(--brand-500)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.3s ease",
                  }}>
                    {done && <CheckCircleIcon style={{ width: 14, height: 14, color: "#fff" }} />}
                    {active && !done && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand-500)", animation: "pulse-glow 1s ease-in-out infinite" }} />}
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: active ? 600 : 400,
                    color: done ? "var(--text-primary)" : active ? "var(--text-accent)" : "var(--text-muted)",
                    transition: "all 0.3s ease",
                  }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
