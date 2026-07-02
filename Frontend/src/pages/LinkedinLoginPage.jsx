import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDBUser } from "../context/UserContext";

// LinkedIn OAuth configuration
const CLIENT_ID = "77h7dzm4j4liic"; // Matches backend default
const REDIRECT_URI = "http://localhost:4000/api/v1/auth/callback";

function LinkedinLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dbUser } = useDBUser();

  const AUTH_URL = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=openid%20profile%20email&state=${dbUser?.id}`;

  useEffect(() => {
    // Check for user data in URL after redirect from backend
    const urlParams = new URLSearchParams(location.search);
    const userData = urlParams.get("user");

    if (userData) {
      const user = JSON.parse(decodeURIComponent(userData));
      localStorage.setItem("user", JSON.stringify(user)); // Store user data
      navigate("/landing"); // Redirect to landing page
    }
  }, [location, navigate]);

  const handleLogin = () => {
    window.location.href = AUTH_URL;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Login with LinkedIn</h1>
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Sign in with LinkedIn
        </button>
      </div>
    </div>
  );
}

export default LinkedinLoginPage;
