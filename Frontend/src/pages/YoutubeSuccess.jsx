import { useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const YouTubeSuccess = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 500, margin: "80px auto", padding: "0 20px" }}>
      <div className="glass-card animate-fadeInUp" style={{ padding: "48px 32px", textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, background: "rgba(34,197,94,0.12)",
          border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 20px",
        }}>
          <CheckCircleIcon style={{ width: 36, height: 36, color: "#4ade80" }} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          YouTube Connected!
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
          Your YouTube account has been successfully linked. You can now publish and schedule videos from your companion dashboard.
        </p>

        <button
          onClick={() => navigate("/app/projects")}
          className="btn btn-primary btn-lg"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Go to Projects
        </button>
      </div>
    </div>
  );
};

export default YouTubeSuccess;

