import { useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const InstagramSuccess = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 500, margin: "80px auto", padding: "0 20px" }}>
      <div className="glass-card animate-fadeInUp" style={{ padding: "48px 32px", textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "linear-gradient(135deg, rgba(225,48,108,0.2), rgba(131,58,180,0.2))",
          border: "1px solid rgba(225,48,108,0.4)", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 20px",
        }}>
          <CheckCircleIcon style={{ width: 36, height: 36, color: "#E1306C" }} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Instagram Connected!
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
          Your Instagram Professional account is successfully connected. You can now publish Reels and schedule video posts directly to your Instagram profile.
        </p>

        <button
          onClick={() => navigate("/app/profile")}
          className="btn btn-primary btn-lg"
          style={{ width: "100%", justifyContent: "center", background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}
        >
          View Profile & Accounts
        </button>
      </div>
    </div>
  );
};

export default InstagramSuccess;
