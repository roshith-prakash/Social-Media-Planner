import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getScheduledPosts, cancelScheduledPost, schedulePost, publishNow } from "../../api/scheduleApi";
import { getMyProjects } from "../../api/videoApi";
import { useUser } from "../../context/UserContext";
import {
  CalendarDaysIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  VideoCameraIcon,
  ClockIcon,
  XMarkIcon,
  BoltIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const PLATFORM_COLORS = {
  youtube: "#ef4444",
  instagram: "#E1306C",
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const { dbUser } = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [modalMode, setModalMode] = useState("now"); // "now" | "schedule"
  const [projects, setProjects] = useState([]);

  // Connected accounts check
  const isYouTubeConnected = Boolean(dbUser?.youtubeAccessToken || dbUser?.youtubeChannelName || dbUser?.youtubeChannelId);
  const isInstagramConnected = Boolean(dbUser?.instagramAccessToken || dbUser?.instagramUsername || dbUser?.instagramBusinessId);

  const isPlatformConnected = (plat) => {
    if (plat === "youtube") return isYouTubeConnected;
    if (plat === "instagram") return isInstagramConnected;
    return false;
  };

  const [formState, setFormState] = useState({
    projectId: "",
    platform: isYouTubeConnected ? "youtube" : isInstagramConnected ? "instagram" : "youtube",
    scheduledAt: "",
    content: "",
  });
  // publishingId = the specific post.rawId currently being published (null = none)
  const [publishingId, setPublishingId] = useState(null);
  // formSubmitting = the new-post modal form is in-flight
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scheduleRes, projectsRes] = await Promise.all([
        getScheduledPosts().catch(() => ({ data: { data: { posts: [] } } })),
        getMyProjects(1, 50).catch(() => ({ data: { data: { projects: [] } } })),
      ]);

      const scheduled = scheduleRes.data?.data?.posts || [];
      const userProjects = projectsRes.data?.data?.projects || [];
      setProjects(userProjects);

      const calendarEvents = [];

      // Add scheduled posts
      scheduled.forEach((item) => {
        const start = new Date(item.scheduledAt);
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        calendarEvents.push({
          id: `sched-${item.id}`,
          rawId: item.id,
          type: "scheduled",
          title: `[${item.platform.toUpperCase()}] ${item.project?.title || "Post"}`,
          start,
          end,
          platform: item.platform,
          status: item.status,
          content: item.content || item.draft?.editedContent || "",
          projectId: item.projectId,
          analysisId: item.project?.analysis?.id,
        });
      });

      // Add completed video projects
      userProjects.forEach((prj) => {
        if (prj.createdAt) {
          const date = new Date(prj.createdAt);
          calendarEvents.push({
            id: `proj-${prj.id}`,
            rawId: prj.id,
            type: "project",
            title: `🎬 ${prj.title}`,
            start: date,
            end: new Date(date.getTime() + 30 * 60 * 1000),
            platform: "general",
            status: prj.status,
            projectId: prj.id,
            analysisId: prj.analysis?.id,
          });
        }
      });

      setEvents(calendarEvents);
    } catch (err) {
      toast.error("Failed to load calendar events: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleCancelPost = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled post?")) return;
    try {
      await cancelScheduledPost(id);
      toast.success("Scheduled post cancelled");
      setSelectedEvent(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to cancel");
    }
  };


  const handlePublishNow = async (event) => {
    if (!event.projectId) return toast.error("Missing project ID");
    if (!isPlatformConnected(event.platform)) {
      return toast.error(`Please connect your ${event.platform.toUpperCase()} account in Profile before publishing.`);
    }
    if (!window.confirm(`Publish this post immediately to ${event.platform.toUpperCase()}?`)) return;

    // Only lock this specific post — not others
    setPublishingId(event.rawId);
    try {
      const res = await publishNow({
        projectId: event.projectId,
        platform: event.platform,
        content: event.content,
      });
      if (event.rawId) {
        await cancelScheduledPost(event.rawId).catch(() => {});
      }
      toast.success(res.data?.message || `Published now to ${event.platform.toUpperCase()}!`);
      setSelectedEvent(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || "Publishing failed");
    } finally {
      setPublishingId(null);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!isPlatformConnected(formState.platform)) {
      return toast.error(`Please connect your ${formState.platform.toUpperCase()} account in Profile before publishing.`);
    }
    if (!formState.projectId) {
      return toast.error("Please select a video project");
    }
    if (modalMode === "schedule" && !formState.scheduledAt) {
      return toast.error("Please select a scheduled date and time");
    }

    setFormSubmitting(true);
    try {
      if (modalMode === "now") {
        const res = await publishNow({
          projectId: formState.projectId,
          platform: formState.platform,
          content: formState.content,
        });
        toast.success(res.data?.message || `Post published successfully to ${formState.platform.toUpperCase()}!`);
      } else {
        await schedulePost({
          projectId: formState.projectId,
          platform: formState.platform,
          scheduledAt: formState.scheduledAt,
          content: formState.content,
        });
        toast.success("Post successfully scheduled!");
      }
      setShowScheduleModal(false);
      setFormState({ projectId: "", platform: "youtube", scheduledAt: "", content: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || "Action failed");
    } finally {
      setFormSubmitting(false);
    }
  };

  const eventStyleGetter = (event) => {
    const color = PLATFORM_COLORS[event.platform] || "#6366f1";
    return {
      style: {
        backgroundColor: `${color}25`,
        border: `1px solid ${color}80`,
        color: "#fff",
        borderRadius: "6px",
        fontSize: "12px",
        padding: "2px 6px",
      },
    };
  };

  return (
    <div style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: "var(--gradient-brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CalendarDaysIcon style={{ width: 22, height: 22, color: "#fff" }} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                Content Calendar
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                Visual planning, future scheduling, and multi-platform publishing timeline.
              </p>
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowScheduleModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <PlusIcon style={{ width: 16, height: 16 }} />
          Schedule New Post
        </button>
      </div>

      {/* Calendar container with custom dark styling */}
      <div
        className="glass-card"
        style={{
          padding: "24px",
          minHeight: 650,
          background: "rgba(18, 18, 38, 0.75)",
          backdropFilter: "blur(20px)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 16,
        }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 620 }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          views={["month", "week", "day"]}
          defaultView="month"
        />
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="glass-card animate-scaleIn"
            style={{
              maxWidth: 520,
              width: "100%",
              padding: 28,
              background: "rgba(22, 22, 45, 0.95)",
              border: "1px solid var(--border-default)",
              borderRadius: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: `${PLATFORM_COLORS[selectedEvent.platform] || "#6366f1"}25`,
                    color: PLATFORM_COLORS[selectedEvent.platform] || "#818cf8",
                  }}
                >
                  {selectedEvent.type === "scheduled" ? `${selectedEvent.platform} Post` : "Project Ingest"}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 8, marginBottom: 4 }}>
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedEvent(null)}
              >
                <XMarkIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
              <strong>Date:</strong> {format(selectedEvent.start, "PPP 'at' p")}
            </div>

            {selectedEvent.content && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 13,
                  lineHeight: 1.6,
                  maxHeight: 180,
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  marginBottom: 16,
                }}
              >
                {selectedEvent.content}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 20 }}>
              {selectedEvent.analysisId && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/app/analysis/${selectedEvent.analysisId}`)}
                >
                  <SparklesIcon style={{ width: 14, height: 14 }} />
                  View Analysis
                </button>
              )}

              {selectedEvent.type === "scheduled" && selectedEvent.status === "pending" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-sm"
                    style={
                      !isPlatformConnected(selectedEvent.platform)
                        ? {
                            background: "rgba(255, 255, 255, 0.08)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border-subtle)",
                            cursor: "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontWeight: 600,
                          }
                        : {
                            background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
                            color: "#fff",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontWeight: 600,
                          }
                    }
                    onClick={() => handlePublishNow(selectedEvent)}
                    disabled={publishingId === selectedEvent.rawId || !isPlatformConnected(selectedEvent.platform)}
                    title={!isPlatformConnected(selectedEvent.platform) ? `Connect ${selectedEvent.platform.toUpperCase()} in Profile to publish` : ""}
                  >
                    <BoltIcon style={{ width: 14, height: 14 }} />
                    {publishingId === selectedEvent.rawId
                      ? "Publishing..."
                      : !isPlatformConnected(selectedEvent.platform)
                      ? `Connect ${selectedEvent.platform.toUpperCase()} to Publish`
                      : "Publish Now"}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: "#f87171", border: "1px solid rgba(248, 113, 113, 0.3)" }}
                    onClick={() => handleCancelPost(selectedEvent.rawId)}
                    disabled={publishingId === selectedEvent.rawId}
                  >
                    <TrashIcon style={{ width: 14, height: 14 }} />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule / Publish Modal */}
      {showScheduleModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            className="glass-card animate-scaleIn"
            style={{
              maxWidth: 540,
              width: "100%",
              padding: 28,
              background: "rgba(22, 22, 45, 0.95)",
              border: "1px solid var(--border-default)",
              borderRadius: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {modalMode === "now" ? (
                  <BoltIcon style={{ width: 22, height: 22, color: "#ec4899" }} />
                ) : (
                  <ClockIcon style={{ width: 22, height: 22, color: "var(--text-accent)" }} />
                )}
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  {modalMode === "now" ? "Publish Social Post Now" : "Schedule a Social Post"}
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowScheduleModal(false)}>
                <XMarkIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Mode Switcher Toggle */}
            <div style={{
              display: "flex",
              background: "rgba(255, 255, 255, 0.05)",
              padding: 4,
              borderRadius: 10,
              marginBottom: 18,
              border: "1px solid var(--border-subtle)",
            }}>
              <button
                type="button"
                onClick={() => setModalMode("now")}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.2s ease",
                  background: modalMode === "now" ? "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)" : "transparent",
                  color: modalMode === "now" ? "#fff" : "var(--text-secondary)",
                  boxShadow: modalMode === "now" ? "0 4px 12px rgba(236, 72, 153, 0.3)" : "none",
                }}
              >
                <BoltIcon style={{ width: 14, height: 14 }} />
                Post Now
              </button>
              <button
                type="button"
                onClick={() => setModalMode("schedule")}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.2s ease",
                  background: modalMode === "schedule" ? "var(--brand-500)" : "transparent",
                  color: modalMode === "schedule" ? "#fff" : "var(--text-secondary)",
                }}
              >
                <ClockIcon style={{ width: 14, height: 14 }} />
                Schedule for Later
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Select Project */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--text-secondary)" }}>
                  Select Video Project
                </label>
                <select
                  className="input"
                  value={formState.projectId}
                  onChange={(e) => setFormState({ ...formState, projectId: e.target.value })}
                  required
                >
                  <option value="">-- Choose a project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Platform Selector */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--text-secondary)" }}>
                  Target Platform
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {["youtube", "instagram"].map((p) => {
                    const connected = isPlatformConnected(p);
                    const isSelected = formState.platform === p;
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setFormState({ ...formState, platform: p })}
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          borderRadius: 8,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                          background: isSelected ? `${PLATFORM_COLORS[p]}25` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isSelected ? PLATFORM_COLORS[p] : "rgba(255,255,255,0.08)"}`,
                          color: isSelected ? PLATFORM_COLORS[p] : "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: connected ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            color: connected ? "#4ade80" : "#f87171",
                            fontWeight: 700,
                          }}
                        >
                          {connected ? "✓ Connected" : "✕ Not Connected"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Connection Warning if disconnected */}
              {!isPlatformConnected(formState.platform) && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <InformationCircleIcon style={{ width: 18, height: 18, color: "#f87171", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#f87171" }}>
                      Your <strong>{formState.platform.toUpperCase()}</strong> account is not connected.
                    </span>
                  </div>
                  <Link
                    to="/app/profile"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: "4px 10px", flexShrink: 0, textDecoration: "none" }}
                  >
                    Connect in Profile
                  </Link>
                </div>
              )}

              {/* Informational Callout if Post Now */}
              {modalMode === "now" && isPlatformConnected(formState.platform) && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(236, 72, 153, 0.08)",
                  border: "1px solid rgba(236, 72, 153, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <BoltIcon style={{ width: 18, height: 18, color: "#ec4899", flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>
                    Instant publication: Video will be published immediately to your connected <strong>{formState.platform.toUpperCase()}</strong> account.
                  </p>
                </div>
              )}

              {/* Scheduled Time if Schedule Mode */}
              {modalMode === "schedule" && (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--text-secondary)" }}>
                    Publish Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={formState.scheduledAt}
                    onChange={(e) => setFormState({ ...formState, scheduledAt: e.target.value })}
                    required={modalMode === "schedule"}
                  />
                </div>
              )}

              {/* Content */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--text-secondary)" }}>
                  Post Text / Caption <span style={{ color: "var(--text-muted)" }}>(optional)</span>
                </label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Enter caption or post text..."
                  value={formState.content}
                  onChange={(e) => setFormState({ ...formState, content: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm"
                  disabled={formSubmitting || !isPlatformConnected(formState.platform)}
                  title={!isPlatformConnected(formState.platform) ? `Connect ${formState.platform.toUpperCase()} account first` : ""}
                  style={
                    !isPlatformConnected(formState.platform)
                      ? {
                          background: "rgba(255, 255, 255, 0.08)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border-subtle)",
                          cursor: "not-allowed",
                        }
                      : modalMode === "now"
                      ? {
                          background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
                          color: "#fff",
                          border: "none",
                          fontWeight: 600,
                          boxShadow: "0 4px 14px rgba(236, 72, 153, 0.35)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }
                      : {
                          background: "var(--brand-500)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }
                  }
                >
                  {formSubmitting ? (
                    <>
                      <ArrowPathIcon style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                      {modalMode === "now" ? `Publishing to ${formState.platform.toUpperCase()}...` : "Scheduling..."}
                    </>
                  ) : !isPlatformConnected(formState.platform) ? (
                    `Connect ${formState.platform.toUpperCase()} to Publish`
                  ) : modalMode === "now" ? (
                    <>
                      <BoltIcon style={{ width: 14, height: 14 }} />
                      Post Now to {formState.platform.toUpperCase()}
                    </>
                  ) : (
                    <>
                      <ClockIcon style={{ width: 14, height: 14 }} />
                      Confirm Schedule
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
