import { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import { updateMe } from "../../api/userApi";
import { getInstagramLoginUrl, disconnectInstagram } from "../../api/instagramApi";
import { SparklesIcon, PencilIcon, CheckIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { YouTubeLogo, InstagramLogo } from "../../components/SocialLogos";

const VOICES = ["professional", "casual", "educational", "entertaining", "inspirational"];
const PLATFORMS = ["youtube", "instagram"];

export default function ProfilePage() {
  const { dbUser, refreshUser } = useUser();
  const { currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: dbUser?.name || "",
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
    <div style={{ padding: "40px 32px", maxWidth: 680, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 28, color: "var(--ink)" }}>Profile & Preferences</h1>

      {/* Avatar + Identity */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="avatar" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }} />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "var(--brand-coral-subtle)",
              border: "1px solid var(--brand-coral-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 800, color: "var(--brand-coral)",
            }}>
              {(dbUser.name || currentUser?.email || "?")[0].toUpperCase()}
            </div>
          )}
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", margin: 0 }}>{dbUser.name || "Creator"}</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>{currentUser?.email || dbUser.email}</p>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginLeft: "auto" }} onClick={() => setEditing(e => !e)}>
            <PencilIcon style={{ width: 14, height: 14 }} />
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ padding: "10px 18px", borderRadius: 10, background: "var(--brand-coral-subtle)", border: "1px solid var(--brand-coral-light)", textAlign: "center" }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: "var(--brand-coral)", margin: 0 }}>{dbUser.totalAnalyses || 0}</p>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0, fontWeight: 600 }}>Analyses</p>
          </div>
          {dbUser.niche && <span className="badge badge-brand" style={{ alignSelf: "center" }}>{dbUser.niche}</span>}
          {dbUser.brandVoice && <span className="badge badge-muted" style={{ alignSelf: "center", textTransform: "capitalize" }}>{dbUser.brandVoice} voice</span>}
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="card animate-scaleIn" style={{ padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: "var(--ink)" }}>Edit Profile Details</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6, color: "var(--ink-soft)" }}>Display Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6, color: "var(--ink-soft)" }}>Niche</label>
              <input className="input" value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} placeholder="e.g. AI Tools, Web Development" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 10, color: "var(--ink-soft)" }}>Brand Voice</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {VOICES.map(v => (
                  <button key={v} onClick={() => setForm(f => ({ ...f, brandVoice: v }))} style={{
                    padding: "7px 14px", borderRadius: 99, fontSize: 13, cursor: "pointer",
                    background: form.brandVoice === v ? "var(--brand-coral)" : "var(--surface-secondary)",
                    color: form.brandVoice === v ? "#fff" : "var(--ink-soft)",
                    border: `1px solid ${form.brandVoice === v ? "transparent" : "var(--border)"}`,
                    fontWeight: form.brandVoice === v ? 600 : 500,
                    textTransform: "capitalize",
                    transition: "all 0.15s ease",
                  }}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 10, color: "var(--ink-soft)" }}>Preferred Platforms</label>
              <div style={{ display: "flex", gap: 10 }}>
                {PLATFORMS.map(p => {
                  const selected = form.preferredPlatforms.includes(p);
                  return (
                    <button key={p} onClick={() => togglePlatform(p)} style={{
                      padding: "8px 16px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                      background: selected ? "var(--brand-coral-subtle)" : "var(--surface-secondary)",
                      border: `1.5px solid ${selected ? "var(--brand-coral)" : "var(--border)"}`,
                      color: selected ? "var(--brand-coral)" : "var(--ink-soft)",
                      fontWeight: selected ? 600 : 500,
                      textTransform: "capitalize",
                      transition: "all 0.15s ease",
                    }}>{p}</button>
                  );
                })}
              </div>
            </div>
            <button id="save-profile-btn" className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ alignSelf: "flex-start", marginTop: 6 }}>
              <CheckIcon style={{ width: 16, height: 16 }} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--ink)" }}>Account Information</h2>
        {[
          { label: "Email", value: currentUser?.email || dbUser?.email || "—" },
          { label: "Member since", value: dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Active" },
        ].map(({ label, value }, idx, arr) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: idx === arr.length - 1 ? "none" : "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
            <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Connected Social Accounts */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Connected Social Accounts</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>Manage authorized platforms for automated and instant publishing.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* YouTube */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderRadius: 12, background: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#FFF0F0", border: "1px solid rgba(255,0,51,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <YouTubeLogo size={22} />
              </div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", display: "block" }}>YouTube Channel</span>
                {dbUser.youtubeChannelName ? (
                  <span style={{ fontSize: 12, color: "var(--status-success-fg)", fontWeight: 500 }}>Connected as {dbUser.youtubeChannelName}</span>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Not connected</span>
                )}
              </div>
            </div>
            <Link to="/app/connect-youtube" className="btn btn-secondary btn-sm">
              {dbUser.youtubeChannelName ? "Manage" : "Connect"}
            </Link>
          </div>

          {/* Instagram */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderRadius: 12, background: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#FFF0F4", border: "1px solid rgba(225,48,108,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <InstagramLogo size={22} />
              </div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", display: "block" }}>Instagram Professional</span>
                {dbUser.instagramUsername ? (
                  <span style={{ fontSize: 12, color: "var(--status-success-fg)", fontWeight: 500 }}>Connected as @{dbUser.instagramUsername}</span>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Not connected</span>
                )}
              </div>
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

