import { useNavigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { auth, signOut } from "../../firebase/firebase";
import {
  SparklesIcon,
  VideoCameraIcon,
  FolderOpenIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  CalendarDaysIcon,
  CloudArrowUpIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const NAV_GROUPS = [
  {
    title: "WORKSPACE",
    items: [
      { path: "/app/upload", label: "Analyze Video", icon: VideoCameraIcon },
      { path: "/app/projects", label: "My Projects", icon: FolderOpenIcon },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { path: "/app/uploads", label: "Platform Uploads", icon: CloudArrowUpIcon },
      { path: "/app/calendar", label: "Content Calendar", icon: CalendarDaysIcon },
    ],
  },
  {
    title: "PREFERENCES",
    items: [
      { path: "/app/profile", label: "Profile & Accounts", icon: UserCircleIcon },
    ],
  },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { dbUser, userLoading, backendOffline } = useUser();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out");
      navigate("/");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Determine current page title
  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes("/app/upload")) return "Analyze Video";
    if (p.includes("/app/projects")) return "My Projects";
    if (p.includes("/app/uploads")) return "Platform Uploads";
    if (p.includes("/app/calendar")) return "Content Calendar";
    if (p.includes("/app/analysis")) return "Video Analysis & Content";
    if (p.includes("/app/analytics")) return "Performance Analytics";
    if (p.includes("/app/profile")) return "Profile & Connected Accounts";
    return "Creator Studio";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--canvas)" }}>
      {/* ── Sidebar (Section 8) ───────────────────────────────────────── */}
      <aside style={{
        width: 256,
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        zIndex: 20,
      }}>
        {/* Brand Header */}
        <div style={{
          padding: "20px 20px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <img
            src="/logo.png"
            alt="ReachAI Logo"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              objectFit: "contain",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(240, 90, 67, 0.25)",
            }}
          />
          <div>
            <span style={{ fontWeight: 800, fontSize: 17, color: "var(--ink)", letterSpacing: "-0.02em", display: "block", lineHeight: 1.2 }}>
              ReachAI
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.02em" }}>
              Bold Creator Studio
            </span>
          </div>
        </div>

        {/* Navigation Groupings */}
        <nav style={{ flex: 1, padding: "18px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                padding: "0 10px 8px",
                textTransform: "uppercase",
              }}>
                {group.title}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {group.items.map(({ path, label, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    id={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      borderRadius: "var(--radius-md)",
                      textDecoration: "none",
                      fontSize: 13.5,
                      fontWeight: isActive ? 600 : 500,
                      transition: "all 0.15s ease",
                      background: isActive ? "var(--brand-coral-light)" : "transparent",
                      color: isActive ? "var(--brand-coral)" : "var(--text-secondary)",
                    })}
                  >
                    <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Account & Logout */}
        <div style={{ padding: "14px 12px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: "var(--radius-md)",
            marginBottom: 6,
            background: "var(--surface-secondary)",
          }}>
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--brand-coral)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#FFFFFF",
                flexShrink: 0,
              }}>
                {(dbUser?.name || currentUser?.email || "?")[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {dbUser?.name || "Creator"}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser?.email || dbUser?.email}
              </p>
            </div>
          </div>
          <button
            id="signout-btn"
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "flex-start", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", padding: "7px 10px" }}
            onClick={handleSignOut}
          >
            <ArrowRightStartOnRectangleIcon style={{ width: 16, height: 16 }} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Layout Column ────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Topbar (Section 8) */}
        <header style={{
          height: 64,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 15,
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
              {getPageTitle()}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/app/upload")}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <PlusIcon style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
              Upload Video
            </button>
          </div>
        </header>

        {/* Offline Banner if Backend is unreachable */}
        {backendOffline && (
          <div style={{
            background: "#FFF1F2",
            borderBottom: "1px solid #FECDD3",
            color: "#9F1239",
            padding: "10px 24px",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 500,
          }}>
            <span>⚠️ Backend server appears offline (port 4000). Please ensure the backend is running to analyze videos or sync projects.</span>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "transparent",
                border: "1px solid #FB7185",
                borderRadius: 6,
                padding: "3px 10px",
                fontSize: 12,
                color: "#9F1239",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Page Content */}
        <main style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
