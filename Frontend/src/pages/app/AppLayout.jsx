import { useNavigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { auth, signOut } from "../../firebase/firebase";
import {
  SparklesIcon,
  VideoCameraIcon,
  FolderOpenIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { path: "/app/upload", label: "Analyze Video", icon: VideoCameraIcon },
  { path: "/app/projects", label: "My Projects", icon: FolderOpenIcon },
  { path: "/app/profile", label: "Profile", icon: UserCircleIcon },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { dbUser } = useUser();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out");
      navigate("/");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0,
        borderRight: "1px solid var(--border-subtle)",
        background: "rgba(13,13,31,0.8)",
        backdropFilter: "blur(20px)",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
        zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, background: "var(--gradient-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--glow-subtle)", flexShrink: 0,
          }}>
            <SparklesIcon style={{ width: 18, height: 18, color: "#fff" }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.02em" }}>
            ReachAI
          </span>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              id={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                textDecoration: "none", fontSize: 14, fontWeight: 500,
                transition: "all 0.2s ease",
                background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                color: isActive ? "var(--text-accent)" : "var(--text-secondary)",
                border: isActive ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
              })}
            >
              <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Sign Out */}
        <div style={{ padding: "12px", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 10, marginBottom: 4,
          }}>
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: "50%", background: "var(--gradient-brand)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "#fff",
              }}>
                {(dbUser?.name || currentUser?.email || "?")[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {dbUser?.name || "Creator"}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {dbUser?.username ? `@${dbUser.username}` : currentUser?.email}
              </p>
            </div>
          </div>
          <button
            id="signout-btn"
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "flex-start", gap: 8, fontSize: 13, color: "var(--text-muted)", padding: "8px 12px" }}
            onClick={handleSignOut}
          >
            <ArrowRightStartOnRectangleIcon style={{ width: 16, height: 16 }} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
