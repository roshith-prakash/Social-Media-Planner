import { useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const YouTubeSuccess = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 520, margin: "80px auto", padding: "0 20px" }}>
      <div className="card animate-fadeInUp" style={{ padding: "48px 36px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: "var(--mint)",
          border: "1px solid var(--mint-dark)20", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 20px",
        }}>
          <CheckCircleIcon style={{ width: 36, height: 36, color: "var(--mint-dark)" }} />
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 8 }}>
          YouTube Connected!
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
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

