import { useState, useEffect } from "react";
import { axiosInstance } from "../utils/axiosInstance";

function Twitter() {
  const [user, setUser] = useState(null);
  const [trends, setTrends] = useState([]);
  const [tweetText, setTweetText] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Catch callback query params on /success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    const username = params.get("username");
    const name = params.get("name");

    if (userId && username) {
      setUser({ userId, username, name: name || "No name provided" });
      // Clear query params for clean URL
      window.history.replaceState({}, document.title, "/success");
    }
  }, []);

  // Initiate OAuth login
  const handleLogin = async () => {
    try {
      setLoading(true);
      setMessage("");
      const response = await axiosInstance.get("/auth/twitter/login");
      window.location.href = response.data.url;
    } catch (error) {
      setMessage(`Login failed: ${error.message}`);
      setLoading(false);
    }
  };

  // Fetch trends
  const handleFetchTrends = async () => {
    if (!user) {
      setMessage("Please log in first");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const response = await axiosInstance.get(
        `/api/trends?userId=${user.userId}`
      );
      setTrends(response.data.trends.slice(0, 5)); // Top 5 trends
      setMessage("Trends fetched successfully!");
    } catch (error) {
      setMessage(
        `Error fetching trends: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Post tweet
  const handlePostTweet = async () => {
    if (!user) {
      setMessage("Please log in first");
      return;
    }
    if (!tweetText.trim()) {
      setMessage("Tweet text cannot be empty");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const response = await axiosInstance.post("/api/post-tweet", {
        userId: user.userId,
        text: tweetText,
      });
      setMessage(`Tweet posted! ID: ${response.data.tweetId}`);
      setTweetText("");
    } catch (error) {
      setMessage(
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
      setMessage("");
      await axiosInstance.post("/logout", { userId: user.userId });
      setUser(null);
      setTrends([]);
      setTweetText("");
      setMessage("Logged out successfully");
    } catch (error) {
      setMessage(
        `Logout failed: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">X Agentic AI Demo</h1>

      {user ? (
        <div>
          <div className="flex items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                Welcome, @{user.username}
              </h2>
              <p className="text-gray-600">Name: {user.name}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Agent Actions</h3>
            <button
              onClick={handleFetchTrends}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300 mr-2"
            >
              {loading ? "Loading..." : "Fetch Top Trends"}
            </button>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-red-300"
            >
              Logout
            </button>
          </div>

          {trends.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Top Trends</h3>
              <ul className="list-disc pl-5">
                {trends.map((trend, index) => (
                  <li key={index} className="text-gray-800">
                    {trend.name}{" "}
                    {trend.tweet_volume ? `(${trend.tweet_volume} tweets)` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Post a Tweet</h3>
            <textarea
              value={tweetText}
              onChange={(e) => setTweetText(e.target.value)}
              placeholder="Enter your tweet (max 280 characters)"
              maxLength={280}
              className="w-full p-2 border rounded mb-2"
            />
            <button
              onClick={handlePostTweet}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300"
            >
              {loading ? "Posting..." : "Post Tweet"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? "Loading..." : "Login with X"}
          </button>
        </div>
      )}

      {message && (
        <p
          className={`mt-4 text-center ${
            message.includes("Error") ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default Twitter;
