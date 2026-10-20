import { useState, useEffect } from "react";
import { axiosInstance } from "../utils/axiosInstance";
import { useUser } from "../context/UserContext";
import toast from "react-hot-toast";

function Twitter() {
  const { dbUser } = useUser();
  const [user, setUser] = useState(null);
  const [trends, setTrends] = useState([]);
  const [tweetText, setTweetText] = useState("");
  const [loading, setLoading] = useState(false);

  // Catch callback query params on /twitter or /success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    const username = params.get("username");
    const name = params.get("name");

    if (userId && username) {
      setUser({ userId, username, name: name || "No name provided" });
      window.history.replaceState({}, document.title, window.location.pathname);
      toast.success(`Connected as @${username}!`);
    } else if (dbUser?.twitterUsername) {
      setUser({
        userId: dbUser.twitterUserId || dbUser.id,
        username: dbUser.twitterUsername,
        name: dbUser.twitterName || dbUser.name || "X User",
      });
    }
  }, [dbUser]);

  // Initiate OAuth login
  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/auth/twitter/login", {
        params: {
          userId: dbUser?.id,
          firebaseUID: dbUser?.firebaseUID,
        },
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error(`Login failed: ${error.response?.data?.details || error.message}`);
      setLoading(false);
    }
  };

  // Fetch trends
  const handleFetchTrends = async () => {
    if (!user) {
      toast.error("Please connect your X account first");
      return;
    }
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/trends?userId=${user.userId}`
      );
      setTrends(response.data.trends?.slice(0, 8) || []);
      toast.success("Trends fetched successfully!");
    } catch (error) {
      toast.error(
        `Error fetching trends: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Post tweet
  const handlePostTweet = async () => {
    if (!user) {
      toast.error("Please connect your X account first");
      return;
    }
    if (!tweetText.trim()) {
      toast.error("Tweet text cannot be empty");
      return;
    }
    try {
      setLoading(true);
      const response = await axiosInstance.post("/api/post-tweet", {
        userId: user.userId,
        text: tweetText,
      });
      toast.success(`Tweet posted! ID: ${response.data.tweetId}`);
      setTweetText("");
    } catch (error) {
      toast.error(
        `Error posting tweet: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await axiosInstance.post("/logout", { userId: user.userId });
      setUser(null);
      setTrends([]);
      setTweetText("");
      toast.success("Disconnected X account");
    } catch (error) {
      toast.error(
        `Disconnect failed: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: "0 20px" }}>
      <div className="glass-card animate-fadeInUp" style={{ padding: "36px 32px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.06)",
            border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" color="var(--text-primary)">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
            X (Twitter) Integration
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Connect your X account to monitor trending topics and publish agentic content.
          </p>
        </div>

        {user ? (
          <div>
            {/* Account Status Card */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderRadius: "var(--radius-md)", background: "rgba(99,102,241,0.06)",
              border: "1px solid var(--border-subtle)", marginBottom: 28,
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                    @{user.username}
                  </span>
                  <span className="badge badge-brand">Connected</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{user.name}</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleFetchTrends}
                  disabled={loading}
                  className="btn btn-secondary btn-sm"
                >
                  {loading ? "Loading..." : "Fetch Trends"}
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="btn btn-ghost btn-sm"
                  style={{ color: "#f87171" }}
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Trends Section */}
            {trends.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
                  🔥 Top Worldwide Trends
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {trends.map((trend, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "6px 14px", borderRadius: 99, background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border-subtle)", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{trend.name}</span>
                      {trend.tweet_volume && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {(trend.tweet_volume / 1000).toFixed(0)}k
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compose Tweet Section */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
                Publish a Tweet
              </label>
              <textarea
                value={tweetText}
                onChange={(e) => setTweetText(e.target.value)}
                placeholder="What's happening? (max 280 characters)"
                maxLength={280}
                className="input"
                style={{
                  minHeight: 110, resize: "vertical", padding: 14, fontSize: 14,
                  lineHeight: 1.5, marginBottom: 10,
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: tweetText.length > 250 ? "#f59e0b" : "var(--text-muted)" }}>
                  {280 - tweetText.length} characters left
                </span>
                <button
                  onClick={handlePostTweet}
                  disabled={loading || !tweetText.trim()}
                  className="btn btn-primary btn-sm"
                >
                  {loading ? "Posting..." : "Post to X"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", maxWidth: 320, margin: "0 auto" }}
            >
              {loading ? "Connecting..." : "Connect X Account"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Twitter;

