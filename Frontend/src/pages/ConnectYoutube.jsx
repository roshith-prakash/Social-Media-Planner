import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { useUser } from "../context/UserContext";
import { axiosInstance } from "../utils/axiosInstance";
import toast from "react-hot-toast";

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
      <div className="glass-card animate-fadeInUp" style={{ padding: "40px 32px", textAlign: "center" }}>
        {/* YouTube Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 18, background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 20px",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#ff0000">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Connect YouTube Channel
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32 }}>
          Grant permissions so your AI agents can schedule and upload videos directly to your YouTube channel.
        </p>

        {dbUser?.youtubeChannelName ? (
          <div style={{
            padding: "16px 20px", borderRadius: "var(--radius-md)", background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.25)", marginBottom: 24, textAlign: "left",
          }}>
            <p style={{ fontSize: 12, color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Currently Linked
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
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
            className="btn btn-ghost btn-sm"
          >
            ← Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeLogin;

