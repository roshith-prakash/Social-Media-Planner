// src/pages/YouTubeSuccess.tsx
import { useNavigate } from "react-router-dom";

const YouTubeSuccess = () => {
  const navigate = useNavigate();

  const handleNext = () => {
    // Redirect user to Home, video upload page, or wherever
    navigate("/");
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>✅ YouTube Account Connected!</h1>
      <p>
        Your account is now linked. You can start uploading videos from this
        app.
      </p>
      <button onClick={handleNext} style={{ marginTop: "1rem" }}>
        Go to Home
      </button>
    </div>
  );
};

export default YouTubeSuccess;
