import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, isSameDay } from "date-fns";
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
  CheckIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { PlatformIcon, YouTubeLogo, InstagramLogo } from "../../components/SocialLogos";

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
  youtube: "#FF0033",
  instagram: "#E1306C",
  project: "#7152BC",
  general: "#F05A43",
};

// ── Compact Event Thumbnail with Fallbacks ──────────────────────────────────────
function EventThumbnail({ event }) {
  const [imgError, setImgError] = useState(false);

  const thumbUrl = useMemo(() => {
    if (event.thumbnailUrl && event.thumbnailUrl.trim() !== "") {
      return event.thumbnailUrl;
    }
    const cdn = event.videoUrl || event.project?.cloudinaryUrl || event.project?.videoUrl;
    if (cdn && typeof cdn === "string") {
      return cdn.replace(/\.[^/.]+$/, ".jpg");
    }
    return null;
  }, [event.thumbnailUrl, event.videoUrl, event.project]);

  const videoUrl = event.videoUrl || event.project?.cloudinaryUrl || event.project?.videoUrl;

  if (thumbUrl && !imgError) {
    return (
      <img
        src={thumbUrl}
        alt={event.title}
        onError={() => setImgError(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: 8,
        }}
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
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: 8,
          background: "#000",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 8,
        background: "var(--surface-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
      }}
    >
      <VideoCameraIcon style={{ width: 24, height: 24 }} />
    </div>
  );
}

// ── Custom Event Pill Component ────────────────────────────────────────────────
function CustomEvent({ event }) {
  const isYouTube = event.platform === "youtube";
  const isInstagram = event.platform === "instagram";
  const isProject = event.type === "project";

  const bg = isYouTube
    ? "rgba(255, 0, 51, 0.12)"
    : isInstagram
    ? "rgba(225, 48, 108, 0.12)"
    : "rgba(113, 82, 188, 0.12)";

  const border = isYouTube
    ? "#FF0033"
    : isInstagram
    ? "#E1306C"
    : "#7152BC";

  const textColor = isYouTube
    ? "#B30024"
    : isInstagram
    ? "#A81E4E"
    : "var(--lilac-dark)";

  const timeStr = event.start ? format(event.start, "h:mmaaa") : "";

  return (
    <div
      className="custom-calendar-event"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "3px 6px",
        borderRadius: 6,
        background: bg,
        border: `1.5px solid ${border}`,
        color: textColor,
        fontSize: 11.5,
        fontWeight: 650,
        boxSizing: "border-box",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      title={`${event.title} (${timeStr}) — Click to view details`}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", overflow: "hidden" }}>
        <PlatformIcon platform={event.platform} size={12} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 10.5, opacity: 0.9, fontWeight: 750, flexShrink: 0 }}>{timeStr}</span>
        <span className="event-month-title" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.title}
        </span>
        {event.status === "published" && (
          <span
            title="Published"
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", flexShrink: 0 }}
          />
        )}
        {event.status === "pending" && (
          <span
            title="Scheduled"
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }}
          />
        )}
      </div>
      <div
        className="event-week-title"
        style={{
          marginTop: 2,
          fontSize: 11.5,
          fontWeight: 750,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
          lineHeight: 1.25,
        }}
      >
        {event.title}
      </div>
    </div>
  );
}

// ── Custom ReachAI Toolbar Component ───────────────────────────────────────────
function CustomToolbar(props) {
  const { onNavigate, onView, view, currentDate } = props;

  const goToBack = () => onNavigate("PREV");
  const goToNext = () => onNavigate("NEXT");
  const goToCurrent = () => onNavigate("TODAY");

  const viewNames = [
    { key: "month", label: "Month" },
    { key: "week", label: "Week" },
    { key: "day", label: "Day" },
    { key: "agenda", label: "Agenda" },
  ];

  const activeView = view || "month";

  const weekStart = currentDate ? startOfWeek(currentDate, { weekStartsOn: 0 }) : new Date();
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

  let displayTitle = "";
  if (activeView === "week") {
    const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
    displayTitle = sameMonth
      ? `${format(weekStart, "MMMM d")} – ${format(weekEnd, "d, yyyy")}`
      : `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
  } else if (activeView === "day") {
    displayTitle = currentDate ? format(currentDate, "EEEE, MMMM d, yyyy") : "";
  } else {
    displayTitle = currentDate ? format(currentDate, "MMMM yyyy") : "";
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        flexWrap: "wrap",
        gap: 14,
        background: "var(--surface)",
      }}
    >
      {/* Navigation Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={goToCurrent}
          style={{ fontWeight: 650, fontSize: 13, padding: "6px 14px", cursor: "pointer" }}
        >
          Today
        </button>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={goToBack}
            style={{ width: 34, height: 34, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            aria-label="Previous"
            title="Previous"
          >
            <ChevronLeftIcon style={{ width: 16, height: 16 }} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={goToNext}
            style={{ width: 34, height: 34, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            aria-label="Next"
            title="Next"
          >
            <ChevronRightIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "var(--ink)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {displayTitle}
        </h2>
      </div>

      {/* View Switcher Pills */}
      <div className="tabs-list" style={{ padding: 3, margin: 0 }}>
        {viewNames.map((v) => (
          <button
            key={v.key}
            type="button"
            className={`tab-trigger ${activeView === v.key ? "active" : ""}`}
            onClick={() => onView(v.key)}
            style={{ fontSize: 12, padding: "5px 12px", cursor: "pointer" }}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Dedicated 7-Day Social Media Planner Board ─────────────────────────────────
function WeeklyPlannerBoard({ currentDate, events, onSelectEvent, onSelectDate, onAddPost }) {
  const weekStart = startOfWeek(currentDate || new Date(), { weekStartsOn: 0 }); // Sunday
  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const today = new Date();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(140px, 1fr))",
        background: "var(--surface)",
        minHeight: 640,
        overflowX: "auto",
      }}
    >
      {days.map((dayDate, idx) => {
        const isCurrentDay = isSameDay(dayDate, today);
        const dayEvents = events
          .filter((e) => isSameDay(new Date(e.start), dayDate))
          .sort((a, b) => new Date(a.start) - new Date(b.start));

        return (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: "column",
              borderRight: idx < 6 ? "1px solid var(--border)" : "none",
              background: isCurrentDay ? "rgba(240, 90, 67, 0.025)" : "transparent",
              minHeight: 640,
            }}
          >
            {/* Column Day Header */}
            <div
              onClick={() => onSelectDate({ start: dayDate })}
              style={{
                padding: "12px 8px",
                borderBottom: "1px solid var(--border)",
                background: isCurrentDay ? "rgba(240, 90, 67, 0.08)" : "var(--surface-secondary)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
              }}
              title="Click to view all events on this day"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 750,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: isCurrentDay ? "var(--brand-coral)" : "var(--text-secondary)",
                  }}
                >
                  {format(dayDate, "EEE")}
                </span>
                {isCurrentDay && (
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 750,
                      padding: "1px 5px",
                      borderRadius: 99,
                      background: "var(--brand-coral)",
                      color: "#fff",
                    }}
                  >
                    Today
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: isCurrentDay ? "var(--brand-coral)" : "var(--ink)",
                  lineHeight: 1,
                }}
              >
                {format(dayDate, "d")}
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                }}
              >
                {dayEvents.length === 1 ? "1 post" : `${dayEvents.length} posts`}
              </span>
            </div>

            {/* Posts List for the Day */}
            <div
              style={{
                flex: 1,
                padding: "10px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {dayEvents.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px 6px",
                    borderRadius: 8,
                    border: "1.5px dashed var(--border)",
                    color: "var(--text-muted)",
                    textAlign: "center",
                    gap: 6,
                    minHeight: 150,
                  }}
                >
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>No posts</p>
                  <button
                    type="button"
                    onClick={() => onAddPost(dayDate)}
                    style={{
                      border: "none",
                      background: "none",
                      color: "var(--brand-coral)",
                      fontSize: 11.5,
                      fontWeight: 650,
                      cursor: "pointer",
                      padding: "2px 4px",
                    }}
                  >
                    + Schedule
                  </button>
                </div>
              ) : (
                dayEvents.map((evt) => {
                  const isYt = evt.platform === "youtube";
                  const isIg = evt.platform === "instagram";
                  const pfColor = isYt ? "#FF0033" : isIg ? "#E1306C" : "#7152BC";
                  const pfLabel = isYt ? "YouTube" : isIg ? "Instagram" : "Project";

                  return (
                    <div
                      key={evt.id}
                      onClick={() => onSelectEvent(evt)}
                      style={{
                        padding: "10px 10px",
                        borderRadius: 9,
                        background: "var(--surface)",
                        border: `1.5px solid ${pfColor}40`,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = `0 4px 12px ${pfColor}25`;
                        e.currentTarget.style.borderColor = pfColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)";
                        e.currentTarget.style.borderColor = `${pfColor}40`;
                      }}
                    >
                      {/* Top Row: Platform Pill + Time */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 750,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: `${pfColor}15`,
                            color: pfColor,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <PlatformIcon platform={evt.platform} size={13} style={{ flexShrink: 0 }} />
                          <span>{pfLabel}</span>
                        </span>

                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>
                          {format(new Date(evt.start), "h:mm a")}
                        </span>
                      </div>

                      {/* Middle Row: Title */}
                      <p
                        style={{
                          fontSize: 12.5,
                          fontWeight: 750,
                          color: "var(--ink)",
                          margin: 0,
                          lineHeight: 1.3,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {evt.title}
                      </p>

                      {/* Bottom Row: Status Indicator */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                        {evt.status === "published" && (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--status-success-fg)", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-success-fg)" }} />
                            Published
                          </span>
                        )}
                        {evt.status === "pending" && (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--status-warning-fg)", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-warning-fg)" }} />
                            Scheduled
                          </span>
                        )}
                        {evt.status === "failed" && (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--status-error-fg)", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-error-fg)" }} />
                            Failed
                          </span>
                        )}
                        {evt.status === "deleted_on_platform" && (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--status-error-fg)", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-error-fg)" }} />
                            Deleted
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Add Post Button at bottom */}
              <button
                type="button"
                onClick={() => onAddPost(dayDate)}
                style={{
                  marginTop: "auto",
                  padding: "6px 8px",
                  border: "1px dashed var(--border)",
                  borderRadius: 6,
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: 11,
                  fontWeight: 650,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--brand-coral)";
                  e.currentTarget.style.color = "var(--brand-coral)";
                  e.currentTarget.style.background = "var(--brand-coral-subtle)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <PlusIcon style={{ width: 12, height: 12 }} />
                <span>Add Post</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main CalendarPage Component ────────────────────────────────────────────────
export default function CalendarPage() {
  const navigate = useNavigate();
  const { dbUser } = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Controlled Calendar Navigation & View State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");

  const handleNavigate = (newDate, view, action) => {
    if (newDate instanceof Date && !isNaN(newDate.getTime())) {
      setCurrentDate(newDate);
    } else if (action === "TODAY") {
      setCurrentDate(new Date());
    } else if (action === "PREV") {
      if (currentView === "month") {
        setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
      } else if (currentView === "week") {
        setCurrentDate((d) => new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000));
      } else if (currentView === "day") {
        setCurrentDate((d) => new Date(d.getTime() - 24 * 60 * 60 * 1000));
      } else {
        setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
      }
    } else if (action === "NEXT") {
      if (currentView === "month") {
        setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
      } else if (currentView === "week") {
        setCurrentDate((d) => new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000));
      } else if (currentView === "day") {
        setCurrentDate((d) => new Date(d.getTime() + 24 * 60 * 60 * 1000));
      } else {
        setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
      }
    }
  };

  const handleViewChange = (newView) => {
    setCurrentView(newView);
  };

  // Date Modal State: clicking on any date cell or event triggers this!
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [modalMode, setModalMode] = useState("schedule"); // "now" | "schedule"
  const [projects, setProjects] = useState([]);

  // Filter: "all" | "youtube" | "instagram" | "project"
  const [platformFilter, setPlatformFilter] = useState("all");

  // Publishing lock state
  const [publishingId, setPublishingId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

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

      // 1. Scheduled posts
      scheduled.forEach((item) => {
        const start = new Date(item.scheduledAt);
        const end = new Date(start.getTime() + 50 * 60 * 1000); // 50 mins for clear visibility in time grids
        calendarEvents.push({
          id: `sched-${item.id}`,
          rawId: item.id,
          type: "scheduled",
          title: item.project?.title || "Scheduled Post",
          start,
          end,
          platform: item.platform,
          status: item.status,
          content: item.content || item.draft?.editedContent || "",
          thumbnailUrl: item.project?.thumbnailUrl || null,
          videoUrl: item.project?.cloudinaryUrl || null,
          projectId: item.projectId,
          analysisId: item.project?.analysis?.id,
          youtubeVideoId: item.project?.youtubeVideoId,
          instagramMediaId: item.project?.instagramMediaId,
          project: item.project,
        });
      });

      // 2. Video projects
      userProjects.forEach((prj) => {
        if (prj.createdAt) {
          const date = new Date(prj.createdAt);
          calendarEvents.push({
            id: `proj-${prj.id}`,
            rawId: prj.id,
            type: "project",
            title: prj.title || "Video Ingest",
            start: date,
            end: new Date(date.getTime() + 50 * 60 * 1000),
            platform: "project",
            status: prj.status,
            thumbnailUrl: prj.thumbnailUrl || null,
            videoUrl: prj.cloudinaryUrl || prj.videoUrl || null,
            projectId: prj.id,
            analysisId: prj.analysis?.id,
            project: prj,
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

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (platformFilter === "all") return events;
    if (platformFilter === "youtube") return events.filter((e) => e.platform === "youtube");
    if (platformFilter === "instagram") return events.filter((e) => e.platform === "instagram");
    if (platformFilter === "project") return events.filter((e) => e.type === "project");
    return events;
  }, [events, platformFilter]);

  // Events on currently selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events
      .filter((e) => isSameDay(new Date(e.start), selectedDate))
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [events, selectedDate]);

  // Click date slot on calendar
  const handleSelectSlot = (slotInfo) => {
    if (slotInfo.start) {
      setSelectedDate(slotInfo.start);
      setShowDateModal(true);
    }
  };

  // Click event pill
  const handleSelectEvent = (event) => {
    if (event.start) {
      setSelectedDate(event.start);
      setShowDateModal(true);
    }
  };

  // Click "+X more"
  const handleShowMore = (evts, date) => {
    setSelectedDate(date);
    setShowDateModal(true);
  };

  // Open schedule modal with pre-selected date
  const openScheduleForDate = (date, prefillProjectId = "") => {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const timeStr = `${year}-${month}-${day}T10:00`;

    setFormState({
      projectId: prefillProjectId || (projects[0]?.id || ""),
      platform: isYouTubeConnected ? "youtube" : isInstagramConnected ? "instagram" : "youtube",
      scheduledAt: timeStr,
      content: "",
    });
    setModalMode("schedule");
    setShowDateModal(false);
    setShowScheduleModal(true);
  };

  const handleCopyCaption = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Caption copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancelPost = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled post?")) return;
    try {
      await cancelScheduledPost(id);
      toast.success("Scheduled post cancelled");
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

  // Stats
  const scheduledCount = events.filter((e) => e.type === "scheduled" && e.status === "pending").length;
  const publishedCount = events.filter((e) => e.status === "published").length;
  const projectCount = projects.length;

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1240, margin: "0 auto" }}>
      {/* ── Page Header & Top Stats ────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-md)",
              background: "var(--brand-coral)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(240, 90, 67, 0.25)",
              color: "#fff",
            }}
          >
            <CalendarDaysIcon style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: 0, letterSpacing: "-0.02em" }}>
              Content Calendar
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>
              Click any date to view scheduled posts, analyze details, or schedule content.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={() => openScheduleForDate(new Date())}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: "var(--radius-md)" }}
          >
            <PlusIcon style={{ width: 16, height: 16, strokeWidth: 2.5 }} />
            Schedule New Post
          </button>
        </div>
      </div>

      {/* ── Metric Summary & Filter Tabs ──────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        {/* Metric Badges */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div
            style={{
              padding: "7px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--ink-soft)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
            <span>Scheduled: <strong>{scheduledCount}</strong></span>
          </div>

          <div
            style={{
              padding: "7px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--ink-soft)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            <span>Published: <strong>{publishedCount}</strong></span>
          </div>

          <div
            style={{
              padding: "7px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--ink-soft)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--lilac-dark)" }} />
            <span>Video Ingests: <strong>{projectCount}</strong></span>
          </div>
        </div>

        {/* Platform Filters */}
        <div className="tabs-list" style={{ padding: 3, margin: 0 }}>
          {[
            { id: "all", label: "All Content" },
            { id: "youtube", label: "YouTube", icon: <YouTubeLogo size={14} /> },
            { id: "instagram", label: "Instagram", icon: <InstagramLogo size={14} /> },
            { id: "project", label: "Projects", icon: <PlatformIcon platform="project" size={14} /> },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`tab-trigger ${platformFilter === f.id ? "active" : ""}`}
              onClick={() => setPlatformFilter(f.id)}
              style={{ fontSize: 12, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {f.icon}
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Calendar Card Container ────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
        }}
      >
        {/* Unified Toolbar for All Calendar Views */}
        <CustomToolbar
          currentDate={currentDate}
          view={currentView}
          onNavigate={(action) => handleNavigate(null, currentView, action)}
          onView={handleViewChange}
        />

        {/* Dynamic View: Weekly Social Media Board or Full Calendar (Month / Day / Agenda) */}
        {currentView === "week" ? (
          <WeeklyPlannerBoard
            currentDate={currentDate}
            events={filteredEvents}
            onSelectEvent={handleSelectEvent}
            onSelectDate={handleSelectSlot}
            onAddPost={openScheduleForDate}
          />
        ) : (
          <Calendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 720 }}
            selectable={true}
            toolbar={false}
            scrollToTime={new Date(1970, 1, 1, 8, 0, 0)}
            date={currentDate}
            onNavigate={handleNavigate}
            view={currentView}
            onView={handleViewChange}
            views={["month", "day", "agenda"]}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onShowMore={handleShowMore}
            components={{
              event: CustomEvent,
            }}
          />
        )}
      </div>

      {/* ── DATE DETAILS MODAL (Opens when clicking any date or event!) ───── */}
      {showDateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--overlay)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setShowDateModal(false)}
        >
          <div
            className="card animate-scaleIn"
            style={{
              maxWidth: 620,
              width: "100%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-modal)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                background: "var(--surface-secondary)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-md)",
                    background: "var(--brand-coral-subtle)",
                    border: "1px solid var(--brand-coral-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--brand-coral)",
                  }}
                >
                  <CalendarDaysIcon style={{ width: 22, height: 22 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </h3>
                  <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                    {selectedDateEvents.length === 0
                      ? "No content scheduled for this date"
                      : `${selectedDateEvents.length} item${selectedDateEvents.length > 1 ? "s" : ""} recorded on this day`}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => openScheduleForDate(selectedDate)}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                >
                  <PlusIcon style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
                  Schedule Post
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: 6, borderRadius: "50%" }}
                  onClick={() => setShowDateModal(false)}
                >
                  <XMarkIcon style={{ width: 20, height: 20, color: "var(--text-secondary)" }} />
                </button>
              </div>
            </div>

            {/* Modal Body: Events List */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              {selectedDateEvents.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: "var(--surface-secondary)",
                      border: "1.5px dashed var(--border-strong)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    <ClockIcon style={{ width: 28, height: 28 }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                      No content on this day
                    </h4>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0", maxWidth: 360 }}>
                      Maintain consistent audience reach by scheduling your next YouTube video or Instagram reel for this date.
                    </p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => openScheduleForDate(selectedDate)}
                    style={{ marginTop: 8 }}
                  >
                    <PlusIcon style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
                    Schedule a Post for {format(selectedDate, "MMM d")}
                  </button>
                </div>
              ) : (
                selectedDateEvents.map((item) => {
                  const isYouTube = item.platform === "youtube";
                  const isInstagram = item.platform === "instagram";
                  const isProject = item.type === "project";

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: 16,
                        borderRadius: "var(--radius-lg)",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        boxShadow: "var(--shadow-subtle)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {/* Event Card Header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {/* Platform Pill */}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: isYouTube
                                ? "rgba(255, 0, 51, 0.1)"
                                : isInstagram
                                ? "rgba(225, 48, 108, 0.1)"
                                : "rgba(113, 82, 188, 0.1)",
                              color: isYouTube
                                ? "#FF0033"
                                : isInstagram
                                ? "#E1306C"
                                : "var(--lilac-dark)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <PlatformIcon platform={item.platform} size={14} />
                            <span>{isYouTube ? "YouTube" : isInstagram ? "Instagram" : "Video Project"}</span>
                          </span>

                          {/* Time */}
                          <span style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                            <ClockIcon style={{ width: 13, height: 13 }} />
                            {item.start ? format(item.start, "p") : "All Day"}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: 99,
                            background:
                              item.status === "published"
                                ? "var(--status-success-bg)"
                                : item.status === "pending"
                                ? "var(--status-warning-bg)"
                                : item.status === "failed"
                                ? "var(--status-error-bg)"
                                : "var(--status-neutral-bg)",
                            color:
                              item.status === "published"
                                ? "var(--status-success-fg)"
                                : item.status === "pending"
                                ? "var(--status-warning-fg)"
                                : item.status === "failed"
                                ? "var(--status-error-fg)"
                                : "var(--status-neutral-fg)",
                            textTransform: "capitalize",
                          }}
                        >
                          {item.status === "pending" ? "⏳ Scheduled" : item.status === "published" ? "✓ Published" : item.status}
                        </span>
                      </div>

                      {/* Event Media & Title */}
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div
                          style={{
                            width: 120,
                            height: 68,
                            borderRadius: 8,
                            flexShrink: 0,
                            overflow: "hidden",
                            background: "var(--surface-secondary)",
                            border: "1px solid var(--border)",
                            position: "relative",
                          }}
                        >
                          <EventThumbnail event={item} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: "var(--ink)",
                              margin: "0 0 4px",
                              lineHeight: 1.3,
                            }}
                          >
                            {item.title}
                          </h4>
                          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                            {isProject
                              ? "Uploaded & analyzed in ReachAI studio"
                              : `Target: ${item.platform?.toUpperCase()} Publishing`}
                          </p>

                          {/* Live Post link if published */}
                          {item.youtubeVideoId && (
                            <a
                              href={`https://www.youtube.com/watch?v=${item.youtubeVideoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#FF0033",
                                textDecoration: "none",
                                marginTop: 6,
                              }}
                            >
                              <span>Watch on YouTube</span>
                              <ArrowTopRightOnSquareIcon style={{ width: 13, height: 13 }} />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Content / Caption Block */}
                      {item.content && (
                        <div
                          style={{
                            background: "var(--surface-secondary)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            padding: "10px 12px",
                            position: "relative",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
                              Caption / Post Content
                            </span>
                            <button
                              type="button"
                              className={`copy-btn ${copiedId === item.id ? "copied" : ""}`}
                              onClick={() => handleCopyCaption(item.id, item.content)}
                              style={{ padding: "3px 8px", fontSize: 11 }}
                            >
                              {copiedId === item.id ? (
                                <>
                                  <CheckIcon style={{ width: 12, height: 12 }} />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <DocumentDuplicateIcon style={{ width: 12, height: 12 }} />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                          <p
                            style={{
                              fontSize: 12.5,
                              color: "var(--ink-soft)",
                              margin: 0,
                              lineHeight: 1.5,
                              maxHeight: 120,
                              overflowY: "auto",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {item.content}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 10,
                          paddingTop: 8,
                          borderTop: "1px solid var(--border)",
                          flexWrap: "wrap",
                        }}
                      >
                        {item.analysisId && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/app/analysis/${item.analysisId}`)}
                            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                          >
                            <SparklesIcon style={{ width: 14, height: 14, color: "var(--brand-coral)" }} />
                            View AI Strategy
                          </button>
                        )}

                        {isProject && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => openScheduleForDate(selectedDate, item.projectId)}
                            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                          >
                            <ClockIcon style={{ width: 14, height: 14 }} />
                            Schedule This Video
                          </button>
                        )}

                        {item.type === "scheduled" && item.status === "pending" && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{
                                background: "var(--brand-coral)",
                                color: "#fff",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                              onClick={() => handlePublishNow(item)}
                              disabled={publishingId === item.rawId || !isPlatformConnected(item.platform)}
                              title={!isPlatformConnected(item.platform) ? `Connect ${item.platform.toUpperCase()} in Profile to publish` : ""}
                            >
                              <BoltIcon style={{ width: 14, height: 14 }} />
                              {publishingId === item.rawId ? "Publishing..." : "Publish Now"}
                            </button>

                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: "var(--status-error-fg)", border: "1px solid rgba(183, 53, 41, 0.2)", fontSize: 12 }}
                              onClick={() => handleCancelPost(item.rawId)}
                              disabled={publishingId === item.rawId}
                            >
                              <TrashIcon style={{ width: 13, height: 13 }} />
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEDULE / PUBLISH MODAL ────────────────────────────────────── */}
      {showScheduleModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--overlay)",
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
            className="card animate-scaleIn"
            style={{
              maxWidth: 540,
              width: "100%",
              padding: 28,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-modal)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {modalMode === "now" ? (
                  <BoltIcon style={{ width: 22, height: 22, color: "var(--brand-coral)" }} />
                ) : (
                  <ClockIcon style={{ width: 22, height: 22, color: "var(--brand-coral)" }} />
                )}
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                  {modalMode === "now" ? "Publish Social Post Now" : "Schedule a Social Post"}
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowScheduleModal(false)}>
                <XMarkIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Mode Switcher Toggle */}
            <div
              style={{
                display: "flex",
                background: "var(--surface-secondary)",
                padding: 4,
                borderRadius: "var(--radius-md)",
                marginBottom: 18,
                border: "1px solid var(--border)",
              }}
            >
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
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s ease",
                  background: modalMode === "schedule" ? "var(--brand-coral)" : "transparent",
                  color: modalMode === "schedule" ? "#fff" : "var(--text-secondary)",
                  boxShadow: modalMode === "schedule" ? "0 1px 3px rgba(240, 90, 67, 0.25)" : "none",
                }}
              >
                <ClockIcon style={{ width: 14, height: 14 }} />
                Schedule for Later
              </button>
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
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s ease",
                  background: modalMode === "now" ? "var(--brand-coral)" : "transparent",
                  color: modalMode === "now" ? "#fff" : "var(--text-secondary)",
                  boxShadow: modalMode === "now" ? "0 1px 3px rgba(240, 90, 67, 0.25)" : "none",
                }}
              >
                <BoltIcon style={{ width: 14, height: 14 }} />
                Publish Immediately
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
                          background: isSelected ? `${PLATFORM_COLORS[p]}15` : "var(--surface-secondary)",
                          border: `1.5px solid ${isSelected ? PLATFORM_COLORS[p] : "var(--border)"}`,
                          color: isSelected ? PLATFORM_COLORS[p] : "var(--ink-soft)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <PlatformIcon platform={p} size={16} />
                          <span>{p === "youtube" ? "YouTube" : "Instagram"}</span>
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: connected ? "var(--status-success-bg)" : "var(--status-error-bg)",
                            color: connected ? "var(--status-success-fg)" : "var(--status-error-fg)",
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
                    background: "var(--status-error-bg)",
                    border: "1px solid rgba(183, 53, 41, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <InformationCircleIcon style={{ width: 18, height: 18, color: "var(--status-error-fg)", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--status-error-fg)" }}>
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
                  className="btn btn-primary btn-sm"
                  disabled={formSubmitting || !isPlatformConnected(formState.platform)}
                  title={!isPlatformConnected(formState.platform) ? `Connect ${formState.platform.toUpperCase()} account first` : ""}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {formSubmitting ? (
                    <>
                      <ArrowPathIcon style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                      {modalMode === "now" ? `Publishing to ${formState.platform.toUpperCase()}...` : "Scheduling..."}
                    </>
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
