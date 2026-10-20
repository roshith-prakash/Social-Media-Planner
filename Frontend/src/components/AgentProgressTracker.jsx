import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  SparklesIcon,
  VideoCameraIcon,
  ArrowPathIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export const AGENT_PIPELINE = [
  { id: "VideoAnalysisAgent", name: "Video Analysis", desc: "Understanding visual scenes, hooks & pacing" },
  { id: "AudienceAgent", name: "Audience Intel", desc: "Demographic targeting & persona profiling" },
  { id: "PlatformAgent", name: "Platform Matcher", desc: "YouTube and Instagram optimization score" },
  { id: "SEOAgent", name: "SEO & Hashtags", desc: "High-CTR titles, keywords & viral hashtags" },
  { id: "ContentAgent", name: "Content Generation", desc: "Writing tailored posts, scripts & threads" },
  { id: "QualityAgent", name: "Quality Review", desc: "Tone check, spam detection & polish" },
  { id: "StrategyAgent", name: "Strategy Synthesis", desc: "Optimal posting times & execution plan" },
];

export default function AgentProgressTracker({ agentStatuses = {}, videoPrepStatus = "ready", isComplete = false }) {
  // Calculate completed count
  const completedCount = AGENT_PIPELINE.filter(
    (agent) => agentStatuses[agent.id]?.status === "done"
  ).length;

  const progressPercent = Math.min(
    100,
    Math.round(((videoPrepStatus === "ready" ? 1 : 0.5) + completedCount) / (AGENT_PIPELINE.length + 1) * 100)
  );

  return (
    <div
      style={{
        background: "rgba(18, 18, 38, 0.85)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(99, 102, 241, 0.25)",
        borderRadius: 20,
        padding: "28px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
            }}
          >
            <SparklesIcon style={{ width: 22, height: 22, color: "#fff" }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
              ReachAI Autonomous Agent Pipeline
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--text-secondary, #94a3b8)" }}>
              {isComplete
                ? "All 7 agents have completed analysis!"
                : `Collaborative multi-agent analysis in progress (${completedCount}/7 Complete)`}
            </p>
          </div>
        </div>

        <div
          style={{
            background: isComplete ? "rgba(34, 197, 94, 0.15)" : "rgba(99, 102, 241, 0.15)",
            border: `1px solid ${isComplete ? "rgba(34, 197, 94, 0.3)" : "rgba(99, 102, 241, 0.3)"}`,
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            color: isComplete ? "#4ade80" : "#818cf8",
          }}
        >
          {progressPercent}%
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: "100%",
          height: 6,
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: 99,
          overflow: "hidden",
          marginBottom: 24,
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            height: "100%",
            background: isComplete
              ? "linear-gradient(90deg, #22c55e, #4ade80)"
              : "linear-gradient(90deg, #6366f1, #a855f7)",
            borderRadius: 99,
          }}
        />
      </div>

      {/* Video prep step */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: 12,
          marginBottom: 12,
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <VideoCameraIcon style={{ width: 18, height: 18, color: "#818cf8" }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>
              Video Ingestion & Gemini Processing
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              Preparing high-resolution video stream for model analysis
            </div>
          </div>
        </div>
        <div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: "3px 10px",
              borderRadius: 12,
              background: "rgba(34, 197, 94, 0.15)",
              color: "#4ade80",
            }}
          >
            ✓ Ingested
          </span>
        </div>
      </div>

      {/* 7 Agent Stepper */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {AGENT_PIPELINE.map((agent, index) => {
          const statusObj = agentStatuses[agent.id] || {};
          const isDone = statusObj.status === "done";
          const isRunning = statusObj.status === "running";
          const isFailed = statusObj.status === "failed";

          return (
            <motion.div
              key={agent.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderRadius: 12,
                background: isRunning
                  ? "rgba(99, 102, 241, 0.12)"
                  : isDone
                  ? "rgba(34, 197, 94, 0.06)"
                  : "rgba(255, 255, 255, 0.02)",
                border: isRunning
                  ? "1px solid rgba(99, 102, 241, 0.4)"
                  : isDone
                  ? "1px solid rgba(34, 197, 94, 0.2)"
                  : "1px solid rgba(255, 255, 255, 0.04)",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isDone
                      ? "rgba(34, 197, 94, 0.2)"
                      : isRunning
                      ? "rgba(99, 102, 241, 0.25)"
                      : "rgba(255, 255, 255, 0.05)",
                    color: isDone ? "#4ade80" : isRunning ? "#818cf8" : "#64748b",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <CheckCircleIcon style={{ width: 18, height: 18, color: "#4ade80" }} />
                    </motion.div>
                  ) : isRunning ? (
                    <ArrowPathIcon style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                  ) : (
                    index + 1
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: isDone ? "#f1f5f9" : isRunning ? "#c7d2fe" : "#94a3b8",
                    }}
                  >
                    {agent.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{agent.desc}</div>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {isDone ? (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 12,
                      background: "rgba(34, 197, 94, 0.15)",
                      color: "#4ade80",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Done {statusObj.elapsed ? `(${Math.round(statusObj.elapsed / 1000)}s)` : ""}
                  </span>
                ) : isRunning ? (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 12,
                      background: "rgba(99, 102, 241, 0.2)",
                      color: "#a5b4fc",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#818cf8",
                        display: "inline-block",
                        animation: "pulse 1.5s infinite",
                      }}
                    />
                    Analyzing...
                  </span>
                ) : isFailed ? (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 12,
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "#f87171",
                    }}
                  >
                    Skipped
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      padding: "4px 8px",
                    }}
                  >
                    Waiting
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
