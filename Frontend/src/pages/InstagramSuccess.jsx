import { useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const InstagramSuccess = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 520, margin: "80px auto", padding: "0 20px" }}>
      <div className="card animate-fadeInUp" style={{ padding: "48px 36px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "var(--brand-coral-light)",
          border: "1px solid var(--brand-coral)30", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 20px",
        }}>
          <CheckCircleIcon style={{ width: 36, height: 36, color: "#E1306C" }} />
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Instagram Connected!
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
          Your Instagram Professional account is successfully connected. You can now publish Reels and schedule video posts directly to your Instagram profile.
        </p>

        <button
          onClick={() => navigate("/app/profile")}
          className="btn btn-primary btn-lg"
          style={{ width: "100%", justifyContent: "center" }}
        >
          View Profile & Accounts
        </button>
      </div>
    </div>
  );
};

export default InstagramSuccess;
