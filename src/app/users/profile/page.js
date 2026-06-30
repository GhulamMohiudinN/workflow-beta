"use client";

import { useState, useEffect } from "react";
import {
  FiUser,
  FiMail,
  FiBriefcase,
  FiSave,
  FiEdit2,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";
import { authAPI } from "../../api/auth";
import { userAPI } from "../../api/userAPI";
import { Card, CardContent, CardHeader } from "../../../components/Card";
import { Button } from "../../../components/Button";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";
}

// ─── Inline toast notification ───────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors =
    type === "success"
      ? "bg-green-50 border-green-200 text-green-800"
      : "bg-red-50 border-red-200 text-red-800";

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border mb-4 text-sm font-medium ${colors}`}>
      {type === "success"
        ? <FiCheckCircle className="h-4 w-4 flex-shrink-0" />
        : <FiAlertCircle className="h-4 w-4 flex-shrink-0" />}
      {message}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }
  const [formData, setFormData] = useState({ name: "" });
  const [error, setError] = useState(null);

  // ── Load profile ───────────────────────────────────────────────────────────
  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try real API first, fall back to localStorage
      let userData = null;
      try {
        const result = await authAPI.getProfile();
        userData = result?.user || result;
      } catch {
        // API failed – use localStorage snapshot
        const stored = localStorage.getItem("user");
        if (stored) userData = JSON.parse(stored);
      }

      if (userData) {
        setProfile(userData);
        setFormData({ name: userData.name || "" });
      } else {
        setError("Could not load profile information.");
      }
    } catch {
      setError("Something went wrong. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setToast({ message: "Name must be at least 2 characters.", type: "error" });
      return;
    }
    if (trimmedName === profile?.name) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const result = await userAPI.updateUser({ name: trimmedName });
      const updatedUser = { ...profile, name: trimmedName, ...(result?.user || {}) };
      setProfile(updatedUser);
      // Sync localStorage so other parts of the app see the updated name
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setIsEditing(false);
      setToast({ message: "Profile updated successfully!", type: "success" });
    } catch (err) {
      setToast({
        message: err?.response?.data?.message || "Failed to update profile. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: profile?.name || "" });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="mb-2">
          <div className="w-40 h-6 rounded bg-[var(--color-border)] mb-2" />
          <div className="w-64 h-3.5 rounded bg-[var(--color-border)]" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="flex flex-col items-center gap-4 py-8">
            <div className="w-24 h-24 rounded-full bg-[var(--color-border)]" />
            <div className="w-32 h-4 rounded bg-[var(--color-border)]" />
            <div className="w-20 h-3 rounded bg-[var(--color-border)]" />
          </Card>
          <Card className="lg:col-span-2">
            <CardContent className="space-y-5">
              {[1,2,3,4].map(i => (
                <div key={i}>
                  <div className="w-24 h-3 rounded bg-[var(--color-border)] mb-2" />
                  <div className="w-full h-10 rounded-lg bg-[var(--color-border)]" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 flex flex-col items-center">
            <FiAlertCircle className="h-12 w-12 text-[var(--color-danger)] mb-4" />
            <h2 className="text-lg font-black text-[var(--color-text)] mb-2">Could not load profile</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">{error}</p>
            <Button onClick={loadProfile} icon={FiRefreshCw}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = getInitials(profile?.name);
  const userRole = profile?.role || profile?.userType || "member";

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-text)]">My Profile</h1>
        <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">View and manage your account information</p>
      </div>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Profile Card ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="flex flex-col items-center text-center py-8">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xl font-black mx-auto mb-4 shadow-lg shadow-blue-500/25">
                {initials}
              </div>
              <h2 className="text-lg font-black text-[var(--color-text)]">{profile?.name || "—"}</h2>
              <p className="text-[var(--color-primary)] font-semibold mt-1 capitalize text-sm">{userRole}</p>
              {profile?.email && (
                <p className="text-[var(--color-muted)] text-xs mt-1 truncate max-w-full">{profile.email}</p>
              )}
              {profile?.createdAt && (
                <p className="text-[var(--color-faint)] text-xs mt-2">Member since {formatDate(profile.createdAt)}</p>
              )}

              {/* Verification badge */}
              {profile?.isEmailVerified != null && (
                <div className={`mt-3 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold ${
                  profile.isEmailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  <FiCheckCircle className="h-3.5 w-3.5" />
                  {profile.isEmailVerified ? "Email Verified" : "Email Unverified"}
                </div>
              )}

              {/* Access */}
              <div className="mt-6 pt-5 border-t border-[var(--color-border)] w-full text-left">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-wide mb-2">Your Access</p>
                  <ul className="text-xs text-[var(--color-muted)] space-y-1.5">
                    <li className="flex items-center gap-2"><FiCheckCircle className="h-3.5 w-3.5 text-[var(--color-success)] shrink-0" /> View all processes</li>
                    <li className="flex items-center gap-2"><FiCheckCircle className="h-3.5 w-3.5 text-[var(--color-success)] shrink-0" /> Complete assigned tasks</li>
                    <li className="flex items-center gap-2 opacity-40 line-through"><span>Create or edit processes</span></li>
                    <li className="flex items-center gap-2 opacity-40 line-through"><span>Manage team members</span></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[var(--color-text)]">Personal Information</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="app-focus inline-flex items-center gap-2 px-3 py-2 text-[var(--color-primary)] hover:bg-blue-50 rounded-lg transition-colors text-xs font-bold"
                >
                  <FiEdit2 className="h-3.5 w-3.5" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-3 py-2 border border-[var(--color-border)] text-[var(--color-muted)] rounded-lg hover:bg-[var(--color-bg)] text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <Button onClick={handleSave} disabled={isSaving} loading={isSaving} icon={FiSave} size="sm">
                    Save Changes
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-black text-[var(--color-text)] mb-1.5">
                  <FiUser className="inline mr-1.5 h-3.5 w-3.5" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="app-focus w-full border border-[var(--color-border)] rounded-lg py-2.5 px-4 text-sm text-[var(--color-text)] bg-[var(--color-bg)] focus:border-[var(--color-primary)] outline-none transition-all disabled:opacity-60"
                    placeholder="Enter your full name"
                    disabled={isSaving}
                  />
                ) : (
                  <p className="text-sm font-semibold text-[var(--color-text)] py-2.5">{profile?.name || "—"}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-black text-[var(--color-text)] mb-1.5">
                  <FiMail className="inline mr-1.5 h-3.5 w-3.5" />
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--color-text)] py-2.5">{profile?.email || "—"}</p>
                  {profile?.isEmailVerified && (
                    <FiCheckCircle className="h-4 w-4 text-[var(--color-success)]" title="Verified" />
                  )}
                </div>
                <p className="text-xs text-[var(--color-faint)]">Email cannot be changed from here.</p>
              </div>

              {/* Username */}
              {profile?.username && (
                <div>
                  <label className="block text-xs font-black text-[var(--color-text)] mb-1.5">Username</label>
                  <p className="text-sm font-semibold text-[var(--color-text)] py-2.5">@{profile.username}</p>
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-xs font-black text-[var(--color-text)] mb-1.5">
                  <FiShield className="inline mr-1.5 h-3.5 w-3.5" />
                  Role
                </label>
                <div className="py-2.5 px-4 bg-[var(--color-bg-soft)] rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)] font-semibold capitalize">
                  {userRole}
                </div>
                <p className="text-xs text-[var(--color-faint)] mt-1">Role is assigned by your workspace admin.</p>
              </div>

              {/* User Type */}
              {profile?.userType && (
                <div>
                  <label className="block text-xs font-black text-[var(--color-text)] mb-1.5">
                    <FiLock className="inline mr-1.5 h-3.5 w-3.5" />
                    Account Type
                  </label>
                  <div className="py-2.5 px-4 bg-[var(--color-bg-soft)] rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)] font-semibold capitalize">
                    {profile.userType}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security notice */}
          <Card>
            <CardContent>
              <p className="text-sm text-[var(--color-muted)]">
                <strong className="text-[var(--color-text)]">Need to change your password or security settings?</strong>
                <br />
                Please contact your workspace administrator for assistance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}