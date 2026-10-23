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
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "28px",
        boxShadow: "var(--shadow-card)",
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
              borderRadius: "var(--radius-md)",
              background: "var(--brand-coral)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(240, 90, 67, 0.25)",
              color: "#FFFFFF",
            }}
          >
            <SparklesIcon style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>
              ReachAI Multi-Agent Pipeline
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
              {isComplete
                ? "All 7 agents have completed analysis!"
                : `Collaborative multi-agent analysis in progress (${completedCount}/7 Complete)`}
            </p>
          </div>
        </div>

        <div
          style={{
            background: isComplete ? "var(--status-success-bg)" : "var(--brand-coral-light)",
            border: `1px solid ${isComplete ? "rgba(36, 116, 71, 0.25)" : "rgba(240, 90, 67, 0.25)"}`,
            padding: "5px 12px",
            borderRadius: "var(--radius-full)",
            fontSize: 13,
            fontWeight: 700,
            color: isComplete ? "var(--status-success-fg)" : "var(--brand-coral)",
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
          background: "var(--surface-secondary)",
          borderRadius: "var(--radius-full)",
          overflow: "hidden",
          marginBottom: 22,
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            height: "100%",
            background: isComplete ? "var(--status-success-fg)" : "var(--brand-coral)",
            borderRadius: "var(--radius-full)",
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
          background: "var(--surface-secondary)",
          borderRadius: "var(--radius-md)",
          marginBottom: 10,
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <VideoCameraIcon style={{ width: 18, height: 18, color: "var(--brand-coral)" }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              Video Ingestion & Gemini Processing
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Prepared high-resolution video stream for model analysis
            </div>
          </div>
        </div>
        <div>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "var(--status-success-bg)",
              color: "var(--status-success-fg)",
              border: "1px solid rgba(36, 116, 71, 0.2)",
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 15px",
                borderRadius: "var(--radius-md)",
                background: isRunning
                  ? "var(--brand-coral-subtle)"
                  : isDone
                  ? "var(--status-success-bg)"
                  : "var(--surface)",
                border: isRunning
                  ? "1px solid rgba(240, 90, 67, 0.3)"
                  : isDone
                  ? "1px solid rgba(36, 116, 71, 0.2)"
                  : "1px solid var(--border)",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isDone
                      ? "rgba(36, 116, 71, 0.2)"
                      : isRunning
                      ? "var(--brand-coral-light)"
                      : "var(--surface-secondary)",
                    color: isDone
                      ? "var(--status-success-fg)"
                      : isRunning
                      ? "var(--brand-coral)"
                      : "var(--text-muted)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {isDone ? (
                    <CheckCircleIcon style={{ width: 17, height: 17, color: "var(--status-success-fg)" }} />
                  ) : isRunning ? (
                    <ArrowPathIcon style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
                  ) : (
                    index + 1
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: isDone ? "var(--status-success-fg)" : isRunning ? "var(--brand-coral)" : "var(--ink-soft)",
                    }}
                  >
                    {agent.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{agent.desc}</div>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {isDone ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "var(--radius-full)",
                      background: "rgba(36, 116, 71, 0.15)",
                      color: "var(--status-success-fg)",
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
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "var(--radius-full)",
                      background: "var(--brand-coral-light)",
                      color: "var(--brand-coral)",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "var(--brand-coral)",
                        display: "inline-block",
                        animation: "pulse 1.2s infinite",
                      }}
                    />
                    Analyzing...
                  </span>
                ) : isFailed ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "var(--radius-full)",
                      background: "var(--status-error-bg)",
                      color: "var(--status-error-fg)",
                    }}
                  >
                    Skipped
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 11.5,
                      color: "var(--text-muted)",
                      padding: "3px 6px",
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
