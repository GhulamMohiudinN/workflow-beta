"use client";

/**
 * The signed-in user's own profile, for admins and editors.
 *
 * Reached from the header's Profile menu item, which until now had no click
 * handler. Members in the read-only area have their own at /users/profile.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiCalendar, FiCheckCircle, FiClock, FiLock, FiMail, FiSave, FiShield, FiUser } from "react-icons/fi";
import authAPI from "../../api/auth";
import { userAPI } from "../../api/userAPI";
import { toast } from "../../../components/Toast";
import { workspaceRoleOf } from "../../utils/permissions";

const ROLE_LABEL = {
  admin:  { label: "Admin",  description: "Full access to everything in this workspace." },
  editor: { label: "Editor", description: "Can create and edit processes and templates." },
  viewer: { label: "Viewer", description: "Read-only access to processes." },
};

const formatDate = (value, withTime = false) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return withTime
    ? d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-faint)]" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[var(--color-muted)]">{label}</p>
        <div className="mt-0.5 text-sm font-semibold text-[var(--color-text)]">{children}</div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await authAPI.getProfile();
        const user = result?.user || result;
        setProfile(user);
        setName(user?.name || "");
      } catch {
        // Fall back to the copy saved at sign-in rather than showing nothing.
        try {
          const cached = JSON.parse(localStorage.getItem("user") || "null");
          setProfile(cached);
          setName(cached?.name || "");
        } catch {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveName = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return toast.error("Your name must be at least 2 characters");
    if (trimmed === profile?.name) return undefined;

    setSaving(true);
    const res = await userAPI.updateUser({ name: trimmed });
    setSaving(false);

    if (!res.success) return toast.error(res.error || "Could not save your name");

    setProfile((p) => ({ ...p, name: trimmed }));
    try {
      const cached = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...cached, name: trimmed }));
    } catch {
      // The header will pick the new name up on the next sign-in instead.
    }
    toast.success("Name updated");
    return undefined;
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
      </div>
    );
  }

  if (!profile) {
    return <p className="py-16 text-center text-sm text-[var(--color-muted)]">Could not load your profile.</p>;
  }

  const role = ROLE_LABEL[workspaceRoleOf(profile)] || null;
  const initials = (profile.name || profile.email || "?")
    .split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-text)]">My Profile</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Your account details and access level.</p>
      </div>

      {/* Identity */}
      <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-white p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-lg font-black text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-[var(--color-text)]">{profile.name}</p>
          <p className="truncate text-sm text-[var(--color-muted)]">{profile.email}</p>
          {role && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-[var(--color-primary)]">
              <FiShield size={11} /> {profile.userType === "admin" ? "Owner" : role.label}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <form onSubmit={saveName} className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="text-sm font-black text-[var(--color-text)]">Your Name</h2>
        <p className="mt-1 text-xs text-[var(--color-muted)]">How you appear to your team and on activity records.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <FiUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-faint)]" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            disabled={saving || name.trim() === profile.name}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            <FiSave size={14} /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      {/* Account */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white px-5 py-2">
        <div className="divide-y divide-[var(--color-border)]">
          <Detail icon={FiMail} label="Email">
            {profile.email}
            {profile.isEmailVerified && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-green-700">
                <FiCheckCircle size={11} /> Verified
              </span>
            )}
          </Detail>
          {role && (
            <Detail icon={FiShield} label="Access">
              {profile.userType === "admin" ? "Owner" : role.label}
              <p className="mt-0.5 text-xs font-normal text-[var(--color-muted)]">
                {role.description}
                {profile.userType !== "admin" && " Your access is set by a workspace admin."}
              </p>
            </Detail>
          )}
          {profile.workspaceName && <Detail icon={FiUser} label="Workspace">{profile.workspaceName}</Detail>}
          <Detail icon={FiCalendar} label="Member since">{formatDate(profile.createdAt)}</Detail>
          <Detail icon={FiClock} label="Last signed in">{formatDate(profile.lastLoggedIn, true)}</Detail>
        </div>
      </div>

      {/* Security */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-black text-[var(--color-text)]">Password</h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">Change your password from Settings.</p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
        >
          <FiLock size={14} /> Change password
        </Link>
      </div>
    </div>
  );
}
