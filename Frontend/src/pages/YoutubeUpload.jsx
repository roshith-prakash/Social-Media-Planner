import { useState } from "react";
import { useUser } from "../context/UserContext";
import { axiosInstance } from "../utils/axiosInstance";
import toast from "react-hot-toast";

function UploadVideoFromCDN() {
  const [cdnUrl, setCdnUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const { dbUser } = useUser();

  const handleUpload = async () => {
    if (!cdnUrl.trim() || !title.trim()) {
      toast.error("Please provide both a video URL and a title");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/agent/upload-youtube", {
        userId: dbUser?.id,
        cdnUrl,
        title,
        description,
      });
      toast.success("Upload initiated successfully!");
      console.log("Upload result:", res.data);
      setCdnUrl("");
      setTitle("");
      setDescription("");
    } catch (err) {
      toast.error(`Upload failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 20px" }}>
      <div className="glass-card animate-fadeInUp" style={{ padding: "36px 32px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
          Direct YouTube CDN Uploader
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
          Publish a video directly from cloud storage (Cloudinary, S3) to your connected YouTube channel.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
              Video CDN URL
            </label>
            <input
              className="input"
              placeholder="https://res.cloudinary.com/.../video.mp4"
              value={cdnUrl}
              onChange={(e) => setCdnUrl(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
              Video Title
            </label>
            <input
              className="input"
              placeholder="e.g. My Amazing Video"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
              Description
            </label>
            <textarea
              className="input"
              style={{ minHeight: 100, resize: "vertical", padding: 12 }}
              placeholder="Video description, hashtags, links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ marginTop: 8 }}
          >
            {loading ? "Publishing to YouTube..." : "Publish to YouTube"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadVideoFromCDN;

