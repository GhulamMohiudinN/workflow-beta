"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  FiUsers, FiUserPlus, FiSearch, FiFilter, FiMail, FiEdit2, FiTrash2,
  FiCheckCircle, FiXCircle, FiShield, FiEye, FiX, FiAlertTriangle,
  FiChevronLeft, FiChevronRight, FiRefreshCw, FiUser, FiClock,
  FiCalendar, FiSave, FiToggleLeft, FiStar,
} from "react-icons/fi";
import { userAPI } from "../../api/userAPI";
import { Card, CardContent, CardHeader } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Badge } from "../../../components/Badge";

// ─── Constants & Helpers ────────────────────────────────────────────────────

const ROLES = ["admin", "editor", "viewer"];
const AVATAR_COLORS = [
  "bg-red-500","bg-blue-500","bg-green-500","bg-purple-500",
  "bg-amber-500","bg-pink-500","bg-indigo-500","bg-teal-500","bg-cyan-500","bg-orange-500",
];

function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function roleBadgeVariant(role) {
  switch (role) {
    case "admin":      return "danger";
    case "editor":     return "primary";
    case "viewer":     return "success";
    case "superadmin": return "secondary";
    default:           return "outline";
  }
}

function statusBadgeVariant(status) {
  switch (status) {
    case "active":   return "success";
    case "inactive": return "outline";
    case "pending":  return "warning";
    default:         return "outline";
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return formatDate(iso);
}

// ─── Atomic UI ──────────────────────────────────────────────────────────────

function Spinner({ size = "h-5 w-5" }) {
  return (
    <div className={`${size} animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]`} />
  );
}

function UserAvatar({ name = "", size = "h-10 w-10" }) {
  return (
    <div className={`${size} ${avatarColor(name)} rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold text-sm leading-none">
        {name?.charAt(0)?.toUpperCase() || "?"}
      </span>
    </div>
  );
}

function DetailRow({ icon, label, value, valueColor = "text-[var(--color-text)]" }) {
  const display = value != null && value !== "" ? value : "—";
  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-[var(--color-border)] last:border-0 group">
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-[var(--color-primary)] flex-shrink-0 group-hover:bg-blue-100 transition-colors">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-[var(--color-faint)] uppercase tracking-wider leading-none mb-1">{label}</p>
        <p className={`text-sm font-semibold ${valueColor} truncate`}>{display}</p>
      </div>
    </div>
  );
}

// ─── Metric stat card ────────────────────────────────────────────────────────

function StatCard({ label, value, icon, toneClass }) {
  return (
    <Card className="min-h-[116px]">
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase text-[var(--color-muted)]">{label}</p>
            <p className="mt-3 text-2xl font-black text-[var(--color-text)]">{value}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${toneClass}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Modal Shell ─────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-popover)] w-full max-w-lg overflow-hidden border border-[var(--color-border)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]">
          <h2 className="text-base font-black text-[var(--color-text)]">{title}</h2>
          <button
            onClick={onClose}
            className="app-focus flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] transition-colors"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewUserModal({ user, onClose }) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-popover)] w-full max-w-md overflow-hidden border border-[var(--color-border)]">
        {/* Hero header */}
        <div className="bg-[var(--color-primary)] px-6 pt-6 pb-10 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/15 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center text-center">
            <div className="ring-4 ring-white/25 rounded-full mb-3">
              <UserAvatar name={user.name} size="h-16 w-16" />
            </div>
            <h3 className="text-xl font-black text-white">{user.name}</h3>
            {user.username && <p className="text-blue-100 text-sm mt-0.5">@{user.username}</p>}
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <span className="text-xs px-3 py-1 rounded-full bg-white/20 text-white font-semibold border border-white/30">
                {user.role}
              </span>
              {user.invitationStatus && (
                <span className="text-xs px-3 py-1 rounded-full bg-white/20 text-white font-semibold border border-white/30">
                  {user.invitationStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details card — overlaps hero */}
        <div className="-mt-5 mx-4 bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-card)] border border-[var(--color-border)] px-5 py-4 space-y-0.5 mb-5 relative z-10">
          <DetailRow icon={<FiMail className="h-4 w-4" />}        label="Email Address"      value={user.email} />
          <DetailRow icon={<FiShield className="h-4 w-4" />}      label="User Permission"     value={user.userType} />
          <DetailRow icon={<FiCheckCircle className="h-4 w-4" />} label="Verification Status"
            value={user.isEmailVerified != null ? (user.isEmailVerified ? "✓ Verified Account" : "✗ Verification Pending") : null}
            valueColor={user.isEmailVerified ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}
          />
          <DetailRow icon={<FiToggleLeft className="h-4 w-4" />}  label="Security Status"
            value={user.isBanned != null ? (user.isBanned ? "Account Restricted" : "Active & Healthy") : null}
            valueColor={user.isBanned ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}
          />
          <DetailRow icon={<FiClock className="h-4 w-4" />}       label="Last Active"         value={timeAgo(user.lastActive || user.lastLoggedIn)} />
          <DetailRow icon={<FiCalendar className="h-4 w-4" />}    label="Member Since"        value={formatDate(user.createdAt)} />
          {user.rate != null && (
            <DetailRow icon={<FiStar className="h-4 w-4" />}      label="Performance Rate"    value={`${user.rate}/hr`} />
          )}
        </div>

        <div className="px-4 pb-5">
          <Button fullWidth onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditUserModal({ user, onClose, onSaved }) {
  const [name, setName]       = useState(user?.name || "");
  const [role, setRole]       = useState(user?.role || "viewer");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const isDirty = name.trim() !== (user?.name || "") || role !== (user?.role || "");

  const ROLE_CONFIG = {
    admin:  { variant: "danger",  desc: "Full access — manages users, settings & all processes." },
    editor: { variant: "primary", desc: "Can create & edit processes but not manage users." },
    viewer: { variant: "success", desc: "Read-only access to all processes." },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) { setError("Name must be at least 2 characters."); return; }
    if (trimmed === user?.name && role === user?.role) { onClose(); return; }
    setError(""); setLoading(true);
    try {
      const res = await userAPI.updateUser({ name: trimmed, role });
      const updated = { ...user, name: trimmed, role, ...(res?.user || {}) };
      setSuccess(true);
      setTimeout(() => { onSaved(updated); }, 600);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  return (
    <ModalShell title="Edit Member" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-5">
          {/* User preview */}
          <div className="flex items-center gap-4 p-4 bg-[var(--color-bg-soft)] rounded-lg border border-[var(--color-border)]">
            <UserAvatar name={name || user.name} size="h-12 w-12" />
            <div className="min-w-0 flex-1">
              <p className="font-black text-[var(--color-text)] text-sm truncate">{name || user.name || "—"}</p>
              <p className="text-xs text-[var(--color-muted)] truncate">{user.email}</p>
            </div>
            <Badge variant={roleBadgeVariant(role)} size="sm">{role}</Badge>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">
              Full Name <span className="text-[var(--color-danger)]">*</span>
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-faint)]" />
              <input
                type="text" value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
                className="app-focus pl-9 w-full border border-[var(--color-border)] rounded-lg py-2.5 pr-4 text-sm text-[var(--color-text)] bg-[var(--color-surface)] focus:border-[var(--color-primary)] transition-all outline-none disabled:bg-[var(--color-bg-soft)]"
                placeholder="Enter full name" minLength={2} required disabled={loading || success}
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r} type="button" onClick={() => setRole(r)} disabled={loading || success}
                  className={`py-2.5 px-3 rounded-lg border-2 text-sm font-semibold capitalize transition-all ${
                    role === r
                      ? "border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]"
                      : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:bg-blue-50/40"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-[var(--color-muted)] font-medium">{ROLE_CONFIG[role]?.desc}</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <FiAlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <FiCheckCircle className="h-4 w-4 flex-shrink-0" /> Member updated successfully!
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" fullWidth disabled={loading || success || !isDirty} loading={loading} icon={FiSave}>
            {success ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteUserModal({ user, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleDelete = async () => {
    setLoading(true); setError("");
    try {
      await userAPI.deleteUser(user._id || user.id);
      onDeleted(user._id || user.id);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete member.");
      setLoading(false);
    }
  };

  if (!user) return null;
  return (
    <ModalShell title="Remove Member" onClose={onClose}>
      <div className="px-6 py-5">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3 border-2 border-red-100">
            <FiAlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-base font-black text-[var(--color-text)] mb-1.5">Are you absolutely sure?</h3>
          <p className="text-sm text-[var(--color-muted)] max-w-xs">
            This permanently removes{" "}
            <span className="font-black text-[var(--color-text)]">{user.name}</span>{" "}
            from the workspace. This action <span className="text-[var(--color-danger)] font-black">cannot</span> be undone.
          </p>
        </div>

        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100 mb-4">
          <UserAvatar name={user.name} size="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-[var(--color-text)] truncate">{user.name}</p>
            <p className="text-xs text-[var(--color-muted)] truncate">{user.email}</p>
          </div>
          <Badge variant={roleBadgeVariant(user.role)} size="sm">{user.role}</Badge>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <FiAlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleDelete} loading={loading} icon={FiTrash2}>
            Delete Member
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users,      setUsers]      = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [roleStats,  setRoleStats]  = useState({ total: 0, admin: 0, editor: 0, viewer: 0 });
  const [search,     setSearch]     = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [viewUser,   setViewUser]   = useState(null);
  const [editUser,   setEditUser]   = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef(null);
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true); setError("");
    try {
      const data = await userAPI.getWorkspaceUsers({
        page,
        limit: pagination.limit,
        role:   filterRole === "all" ? "" : filterRole,
        search: debouncedSearch,
      });
      const list = data?.users || data?.members || data?.data || [];
      const meta = data?.pagination || data?.meta || {};
      setUsers(list);
      setPagination({
        page:       meta.page       || page,
        totalPages: meta.totalPages || Math.max(1, Math.ceil((meta.total || list.length) / pagination.limit)),
        total:      meta.total      || list.length,
        limit:      meta.limit      || pagination.limit,
      });
      if (data?.stats) {
        setRoleStats(data.stats);
      } else {
        const s = { total: meta.total || list.length, admin: 0, editor: 0, viewer: 0 };
        list.forEach((u) => { const r = u.role?.toLowerCase(); if (r in s) s[r]++; });
        setRoleStats(s);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load workspace users.");
    } finally {
      setLoading(false);
    }
  }, [filterRole, debouncedSearch, pagination.limit]); // eslint-disable-line

  useEffect(() => { fetchUsers(1); }, [filterRole, debouncedSearch]); // eslint-disable-line

  const handlePage = (p) => {
    if (p < 1 || p > pagination.totalPages) return;
    fetchUsers(p);
  };

  const handleSaved = (updated) => {
    setUsers((prev) => prev.map((u) => (u._id === updated._id || u.id === updated.id) ? updated : u));
    setEditUser(null);
    fetchUsers(pagination.page);
  };

  const handleDeleted = (id) => {
    const removed = users.find((u) => u._id === id || u.id === id);
    setUsers((prev) => prev.filter((u) => u._id !== id && u.id !== id));
    if (removed) {
      setRoleStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        ...(removed.role in prev ? { [removed.role]: Math.max(0, (prev[removed.role] ?? 1) - 1) } : {}),
      }));
    }
    setDeleteUser(null);
  };

  return (
    <div className="-m-4 min-h-[calc(100vh-9rem)] space-y-6 bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:-m-6 sm:p-6">
      {/* Modals */}
      {viewUser   && <ViewUserModal   user={viewUser}   onClose={() => setViewUser(null)} />}
      {editUser   && <EditUserModal   user={editUser}   onClose={() => setEditUser(null)}   onSaved={handleSaved} />}
      {deleteUser && <DeleteUserModal user={deleteUser} onClose={() => setDeleteUser(null)} onDeleted={handleDeleted} />}

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)]">Team Members</h1>
          <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
            Manage your team members and their permissions in the workspace.
          </p>
        </div>
        <Link href="/users/add">
          <Button icon={FiUserPlus}>Add Team Member</Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Members" value={roleStats.total}  toneClass="bg-blue-50 text-blue-600"   icon={<FiUsers  size={17} />} />
        <StatCard label="Admins"        value={roleStats.admin}  toneClass="bg-red-50 text-red-600"     icon={<FiShield size={17} />} />
        <StatCard label="Editors"       value={roleStats.editor} toneClass="bg-indigo-50 text-indigo-600" icon={<FiEdit2  size={17} />} />
        <StatCard label="Viewers"       value={roleStats.viewer} toneClass="bg-green-50 text-green-600" icon={<FiEye    size={17} />} />
      </div>

      {/* Search / Filter */}
      <Card className="bg-white/90">
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" size={16} />
            <input
              type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="app-focus h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)]"
            />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)]">
              <FiFilter size={16} />
              <select
                value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                className="app-focus h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm font-semibold text-[var(--color-text)]"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>
            <button
              onClick={() => fetchUsers(pagination.page)}
              className="app-focus flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
              title="Refresh"
            >
              <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[var(--color-text)]">All Members</h2>
          {!loading && (
            <span className="text-xs font-bold text-[var(--color-muted)] bg-[var(--color-bg-soft)] px-2.5 py-1 rounded-full">
              {pagination.total} member{pagination.total !== 1 ? "s" : ""}
            </span>
          )}
        </CardHeader>

        {loading ? (
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="h-10 w-10" />
            <p className="text-sm font-semibold text-[var(--color-muted)]">Loading team members…</p>
          </CardContent>
        ) : error ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
              <FiAlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-sm font-black text-[var(--color-text)] mb-1">Something went wrong</p>
            <p className="text-xs text-[var(--color-muted)] mb-4 max-w-xs">{error}</p>
            <Button onClick={() => fetchUsers(1)} icon={FiRefreshCw}>Try Again</Button>
          </CardContent>
        ) : users.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-primary)]">
              <FiUsers size={24} />
            </div>
            <h3 className="text-lg font-black text-[var(--color-text)]">No members found</h3>
            <p className="mt-2 max-w-md text-sm font-medium text-[var(--color-muted)]">
              {search || filterRole !== "all"
                ? "Try clearing your search or filter."
                : "Add your first team member to get started."}
            </p>
            <Link href="/users/add" className="mt-5">
              <Button icon={FiUserPlus}>Add Team Member</Button>
            </Link>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--color-border)]">
              <thead className="bg-[var(--color-surface-hover)]">
                <tr>
                  {["Member", "Role", "Status", "Last Active", "Verified", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase text-[var(--color-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-white">
                {users.map((u) => (
                  <tr key={u._id || u.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={u.name} size="h-9 w-9" />
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[var(--color-text)] truncate">{u.name || "—"}</p>
                          <p className="text-xs text-[var(--color-muted)] truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={roleBadgeVariant(u.role)} size="sm" className="capitalize">{u.role || "—"}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusBadgeVariant(u.invitationStatus || "active")} size="sm" className="capitalize">
                        {u.invitationStatus || "active"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-[var(--color-muted)]">
                      {timeAgo(u.lastActive || u.lastLoggedIn)}
                    </td>
                    <td className="px-5 py-4">
                      {u.isEmailVerified
                        ? <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-success)]"><FiCheckCircle size={13} />Verified</span>
                        : <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-warning)]"><FiXCircle size={13} />Pending</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewUser(u)}
                          className="app-focus flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-blue-50 hover:text-[var(--color-primary)] transition-colors"
                          title="View member"
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          onClick={() => setEditUser(u)}
                          className="app-focus flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary)] transition-colors"
                          title="Edit member"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteUser(u)}
                          className="app-focus flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete member"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="border-t border-[var(--color-border)] px-5 py-4 flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--color-muted)]">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} members
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePage(pagination.page - 1)} disabled={pagination.page <= 1}
                className="app-focus flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <FiChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p} onClick={() => handlePage(p)}
                    className={`app-focus flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                      p === pagination.page
                        ? "bg-[var(--color-primary)] text-white"
                        : "border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => handlePage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                className="app-focus flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <FiChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
