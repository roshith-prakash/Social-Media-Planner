import { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import { updateMe } from "../../api/userApi";
import { getInstagramLoginUrl, disconnectInstagram } from "../../api/instagramApi";
import { SparklesIcon, PencilIcon, CheckIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const VOICES = ["professional", "casual", "educational", "entertaining", "inspirational"];
const PLATFORMS = ["youtube", "instagram"];

export default function ProfilePage() {
  const { dbUser, refreshUser } = useUser();
  const { currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: dbUser?.name || "",
    bio: dbUser?.bio || "",
    niche: dbUser?.niche || "",
    brandVoice: dbUser?.brandVoice || "professional",
    preferredPlatforms: dbUser?.preferredPlatforms || [],
  });

  const togglePlatform = (p) => {
    setForm(prev => ({
      ...prev,
      preferredPlatforms: prev.preferredPlatforms.includes(p)
        ? prev.preferredPlatforms.filter(x => x !== p)
        : [...prev.preferredPlatforms, p],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMe(form);
      await refreshUser();
      setEditing(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!dbUser) return <div style={{ padding: 40, color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <div style={{ padding: "40px 32px", maxWidth: 640 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 28 }}>Profile</h1>

      {/* Avatar + Identity */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="avatar" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "var(--gradient-brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 800, color: "#fff",
            }}>
              {(dbUser.name || currentUser?.email || "?")[0].toUpperCase()}
            </div>
          )}
          <div>
            <p style={{ fontSize: 20, fontWeight: 700 }}>{dbUser.name || "Creator"}</p>
            {dbUser.username && <p style={{ fontSize: 14, color: "var(--text-muted)" }}>@{dbUser.username}</p>}
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{currentUser?.email}</p>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginLeft: "auto" }} onClick={() => setEditing(e => !e)}>
            <PencilIcon style={{ width: 14, height: 14 }} />
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ padding: "12px 20px", borderRadius: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: "var(--text-accent)" }}>{dbUser.totalAnalyses}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Analyses</p>
          </div>
          {dbUser.niche && <span className="badge badge-brand" style={{ alignSelf: "center" }}>{dbUser.niche}</span>}
          {dbUser.brandVoice && <span className="badge badge-muted" style={{ alignSelf: "center", textTransform: "capitalize" }}>{dbUser.brandVoice}</span>}
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="glass-card animate-scaleIn" style={{ padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Edit Profile</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6, color: "var(--text-secondary)" }}>Display Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6, color: "var(--text-secondary)" }}>Bio</label>
              <textarea className="input" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell us about yourself..." rows={3} style={{ resize: "vertical" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6, color: "var(--text-secondary)" }}>Niche</label>
              <input className="input" value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} placeholder="e.g. AI Tools, Web Development" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 10, color: "var(--text-secondary)" }}>Brand Voice</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {VOICES.map(v => (
                  <button key={v} onClick={() => setForm(f => ({ ...f, brandVoice: v }))} style={{
                    padding: "7px 14px", borderRadius: 99, fontSize: 13, cursor: "pointer",
                    background: form.brandVoice === v ? "var(--gradient-brand)" : "rgba(255,255,255,0.05)",
                    color: form.brandVoice === v ? "#fff" : "var(--text-secondary)",
                    border: `1px solid ${form.brandVoice === v ? "transparent" : "var(--border-subtle)"}`,
                    textTransform: "capitalize",
                  }}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 10, color: "var(--text-secondary)" }}>Preferred Platforms</label>
              <div style={{ display: "flex", gap: 10 }}>
                {PLATFORMS.map(p => (
                  <button key={p} onClick={() => togglePlatform(p)} style={{
                    padding: "8px 16px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                    background: form.preferredPlatforms.includes(p) ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${form.preferredPlatforms.includes(p) ? "var(--border-strong)" : "var(--border-subtle)"}`,
                    color: form.preferredPlatforms.includes(p) ? "var(--text-accent)" : "var(--text-muted)",
                    textTransform: "capitalize",
                  }}>{p === "x" ? "X (Twitter)" : p}</button>
                ))}
              </div>
            </div>
            <button id="save-profile-btn" className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ alignSelf: "flex-start" }}>
              <CheckIcon style={{ width: 16, height: 16 }} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Account Information</h2>
        {[
          { label: "Email", value: currentUser?.email },
          { label: "Username", value: dbUser.username ? `@${dbUser.username}` : "Not set" },
          { label: "Member since", value: new Date(dbUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) },
          { label: "Onboarding", value: dbUser.onboardingCompleted ? "Complete" : "Incomplete" },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
            <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Connected Social Accounts */}
      <div className="glass-card" style={{ padding: 24, marginTop: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Connected Social Accounts</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* YouTube */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>YouTube</span>
              {dbUser.youtubeChannelName ? (
                <span className="badge badge-brand">{dbUser.youtubeChannelName}</span>
              ) : (
                <span className="badge badge-muted">Not Connected</span>
              )}
            </div>
            <Link to="/app/connect-youtube" className="btn btn-secondary btn-sm">
              {dbUser.youtubeChannelName ? "Manage" : "Connect"}
            </Link>
          </div>

          {/* Instagram */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Instagram</span>
              {dbUser.instagramUsername ? (
                <span className="badge" style={{ background: "linear-gradient(135deg, rgba(225,48,108,0.2), rgba(131,58,180,0.2))", color: "#E1306C", border: "1px solid rgba(225,48,108,0.3)" }}>
                  @{dbUser.instagramUsername}
                </span>
              ) : (
                <span className="badge badge-muted">Not Connected</span>
              )}
            </div>
            {dbUser.instagramUsername ? (
              <button
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  try {
                    await disconnectInstagram();
                    toast.success("Instagram disconnected");
                    refreshUser?.();
                  } catch {
                    toast.error("Failed to disconnect Instagram");
                  }
                }}
              >
                Disconnect
              </button>
            ) : (
              <button
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  try {
                    const identifier = currentUser?.uid || dbUser?.firebaseUID || dbUser?.id;
                    const res = await getInstagramLoginUrl(identifier);
                    if (res.data?.url) {
                      window.location.href = res.data.url;
                    }
                  } catch (err) {
                    toast.error("Failed to initiate Instagram login: " + (err.response?.data?.details || err.message));
                  }
                }}
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

