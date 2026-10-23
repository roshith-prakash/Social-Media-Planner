import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { useUser } from "../context/UserContext";
import { axiosInstance } from "../utils/axiosInstance";
import toast from "react-hot-toast";
import { YouTubeLogo } from "../components/SocialLogos";

const YouTubeLogin = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const { dbUser } = useUser();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    const user = auth.currentUser;
    const uid = user?.uid || dbUser?.firebaseUID || dbUser?.id;
    if (!uid) {
      toast.error("Please log in first");
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.get("/youtube/login", {
        params: { firebaseUID: uid },
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      toast.error(`Failed to initiate YouTube connection: ${err.response?.data?.details || err.message}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: "0 20px" }}>
      <div className="card animate-fadeInUp" style={{ padding: "40px 32px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
        {/* YouTube Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: "#FFF0F0",
          border: "1px solid rgba(255,0,51,0.2)", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 20px",
        }}>
          <YouTubeLogo size={36} />
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Connect YouTube Channel
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32 }}>
          Grant permissions so ReachAI can schedule and publish videos directly to your YouTube channel.
        </p>

        {dbUser?.youtubeChannelName ? (
          <div style={{
            padding: "16px 20px", borderRadius: 12, background: "var(--mint)",
            border: "1px solid var(--mint-dark)20", marginBottom: 24, textAlign: "left",
          }}>
            <p style={{ fontSize: 11, color: "var(--mint-dark)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Currently Linked
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
              {dbUser.youtubeChannelName}
            </p>
          </div>
        ) : null}

        <button
          onClick={handleConnect}
          disabled={loading}
          className="btn btn-primary btn-lg"
          style={{ width: "100%", justifyContent: "center" }}
        >
          {loading ? "Redirecting to Google..." : "Connect with Google OAuth"}
        </button>

        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => navigate("/app/profile")}
            className="btn btn-secondary btn-sm"
          >
            ← Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeLogin;

