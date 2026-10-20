import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import { PrivateRoute, PublicRoute } from "./components/RouteGuards";

// Public Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";

// App Pages
import AppLayout from "./pages/app/AppLayout";
import UploadPage from "./pages/app/UploadPage";
import AnalysisPage from "./pages/app/AnalysisPage";
import ProjectsPage from "./pages/app/ProjectsPage";
import ProfilePage from "./pages/app/ProfilePage";
import CalendarPage from "./pages/app/CalendarPage";
import AnalyticsPage from "./pages/app/AnalyticsPage";


import YouTubeLogin from "./pages/ConnectYoutube";
import YouTubeSuccess from "./pages/YoutubeSuccess";
import InstagramSuccess from "./pages/InstagramSuccess";
import UploadVideoFromCDN from "./pages/YoutubeUpload";
import Twitter from "./pages/Twitter";
import LinkedinLoginPage from "./pages/LinkedinLoginPage";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <UserProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                fontSize: "14px",
                boxShadow: "var(--shadow-elevated)",
              },
              success: { iconTheme: { primary: "#4ade80", secondary: "transparent" } },
              error: { iconTheme: { primary: "#f87171", secondary: "transparent" } },
            }}
          />

          <Routes>
            {/* ── Public Routes ─────────────────────────────────────── */}
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ── Social OAuth Callbacks & Pages ───────────────────── */}
            <Route path="/youtube/success" element={<YouTubeSuccess />} />
            <Route path="/instagram/success" element={<InstagramSuccess />} />
            <Route path="/twitter" element={<PrivateRoute><Twitter /></PrivateRoute>} />
            <Route path="/linkedin" element={<PrivateRoute><LinkedinLoginPage /></PrivateRoute>} />

            {/* ── Onboarding (after signup) ────────────────────────── */}
            <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />

            {/* ── App Routes (authenticated) ────────────────────────── */}
            <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/app/upload" replace />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="analysis/:id" element={<AnalysisPage />} />
              <Route path="analytics/:projectId" element={<AnalyticsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="connect-youtube" element={<YouTubeLogin />} />
              <Route path="youtube-upload" element={<UploadVideoFromCDN />} />
              <Route path="twitter" element={<Twitter />} />
              <Route path="linkedin" element={<LinkedinLoginPage />} />
            </Route>


            {/* ── Fallback ─────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

        </UserProvider>
      </AuthProvider>
    </Router>
  );
}
