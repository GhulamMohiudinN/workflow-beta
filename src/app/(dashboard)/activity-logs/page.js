"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import workspaceAPI from "../../api/workspaceAPI";
import {
  FiActivity, FiClock, FiLayers, FiUserPlus, FiEdit2,
  FiCheckCircle, FiAlertCircle, FiRefreshCw, FiUser,
  FiChevronLeft, FiChevronRight, FiMaximize2, FiInfo,
  FiSearch, FiX, FiShield, FiList,
} from "react-icons/fi";
import { Card, CardContent, CardHeader } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Badge } from "../../../components/Badge";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeOnly(iso) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

const ACTION_META = {
  invite_member:  { icon: FiUserPlus,     toneClass: "bg-blue-50 text-blue-600",    badgeVariant: "primary",   label: "Invite Member"  },
  create_process: { icon: FiLayers,       toneClass: "bg-indigo-50 text-indigo-600",badgeVariant: "secondary", label: "Create Process" },
  update_process: { icon: FiEdit2,        toneClass: "bg-amber-50 text-amber-600",  badgeVariant: "warning",   label: "Update Process" },
  complete_task:  { icon: FiCheckCircle,  toneClass: "bg-emerald-50 text-emerald-600", badgeVariant: "success", label: "Complete Task" },
  remove_member:  { icon: FiAlertCircle,  toneClass: "bg-red-50 text-red-600",      badgeVariant: "danger",    label: "Remove Member"  },
  default:        { icon: FiActivity,     toneClass: "bg-slate-50 text-slate-500",  badgeVariant: "outline",   label: "Activity"       },
};

function getActionMeta(action) {
  return ACTION_META[action] || ACTION_META.default;
}

function humaniseAction(action = "") {
  return action.replace(/_/g, " ");
}

// ─── Log Item ─────────────────────────────────────────────────────────────────

function LogItem({ log }) {
  const [expanded, setExpanded] = useState(false);
  const hasChanges = log.data?.changes?.length > 0;
  const meta = getActionMeta(log.action);
  const Icon = meta.icon;

  return (
    <div className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors">
      <div className="px-5 py-4 flex items-start gap-4">
        {/* Icon */}
        <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-lg ${meta.toneClass}`}>
          <Icon size={17} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <Badge variant={meta.badgeVariant} size="sm" className="uppercase">
              {humaniseAction(log.action)}
            </Badge>
            <span className="text-[11px] font-semibold text-[var(--color-faint)] flex items-center gap-1 shrink-0">
              <FiClock size={11} />
              {formatTimeOnly(log.createdAt)}
            </span>
          </div>

          <p className="text-sm font-semibold text-[var(--color-text)] leading-snug mb-2.5">
            {log.message}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {/* User chip */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] bg-[var(--color-bg-soft)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5">
              <FiUser size={11} className="text-[var(--color-primary)] shrink-0" />
              <span className="font-black text-[var(--color-text)]">{log.userName || "System"}</span>
              {log.userEmail && (
                <>
                  <span className="text-[var(--color-border-strong)]">·</span>
                  <span className="font-medium opacity-75">{log.userEmail}</span>
                </>
              )}
            </div>

            {/* View Changes toggle */}
            {hasChanges && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="app-focus inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] bg-blue-50 hover:bg-blue-100 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <FiMaximize2 size={10} />
                {expanded ? "Collapse" : "View Changes"}
              </button>
            )}
          </div>

          {/* Expanded diff table */}
          {expanded && hasChanges && (
            <div className="mt-4 rounded-lg border border-[var(--color-border)] overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface-hover)] border-b border-[var(--color-border)]">
                <FiInfo size={13} className="text-[var(--color-primary)]" />
                <span className="text-[10px] font-black text-[var(--color-muted)] uppercase tracking-wider">Modified Properties</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[var(--color-surface-hover)]">
                    <tr>
                      {["Field", "Previous", "Updated"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left text-[10px] font-black uppercase text-[var(--color-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] bg-white">
                    {log.data.changes.map((change, idx) => (
                      <tr key={idx} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                        <td className="px-4 py-2.5 font-black text-[var(--color-primary)]">#{change.field}</td>
                        <td className="px-4 py-2.5">
                          <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded font-semibold border border-red-100 line-through text-[11px]">
                            {String(change.oldValue)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black border border-emerald-100 text-[11px]">
                            {String(change.newValue)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LogSkeleton() {
  return (
    <div className="px-5 py-4 flex items-start gap-4 border-b border-[var(--color-border)] last:border-0 animate-pulse">
      <div className="h-10 w-10 rounded-lg bg-[var(--color-border)] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="w-24 h-4 rounded bg-[var(--color-border)]" />
          <div className="w-16 h-3 rounded bg-[var(--color-border)]" />
        </div>
        <div className="w-3/4 h-4 rounded bg-[var(--color-border)]" />
        <div className="w-40 h-6 rounded-lg bg-[var(--color-border)]" />
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, toneClass }) {
  return (
    <Card className="min-h-[100px]">
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase text-[var(--color-muted)]">{label}</p>
            <p className="mt-3 text-2xl font-black text-[var(--color-text)]">{value ?? "—"}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${toneClass}`}><Icon size={17} /></div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ActivityLogsPage() {
  const [logs,        setLogs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [searchTerm,  setSearchTerm]  = useState("");
  const [pagination,  setPagination]  = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await workspaceAPI.getActivityLogs(page, 20);
      if (response.success) {
        setLogs(response.logs);
        setPagination({ page: response.page, totalPages: response.totalPages, total: response.total, limit: response.limit });
      } else {
        throw new Error("Failed to load activity logs.");
      }
    } catch (err) {
      console.error("Activity fetch error:", err);
      setError("Unable to reach the activity database. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); }, []);

  // Search filter
  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter((log) =>
      log.message?.toLowerCase().includes(term) ||
      log.userName?.toLowerCase().includes(term) ||
      log.userEmail?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  // Group by date
  const groupedLogs = useMemo(() => {
    const today     = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    return filteredLogs.reduce((groups, log) => {
      const dateStr = new Date(log.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const label = dateStr === today ? "Today" : dateStr === yesterday ? "Yesterday" : dateStr.toUpperCase();
      if (!groups[label]) groups[label] = [];
      groups[label].push(log);
      return groups;
    }, {});
  }, [filteredLogs]);

  // Derived stats from current page
  const actionCounts = useMemo(() => {
    const counts = { invite_member: 0, create_process: 0, update_process: 0, complete_task: 0 };
    logs.forEach((l) => { if (l.action in counts) counts[l.action]++; });
    return counts;
  }, [logs]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && logs.length === 0) {
    return (
      <div className="-m-4 min-h-[calc(100vh-9rem)] space-y-6 bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:-m-6 sm:p-6">
        <div>
          <div className="w-48 h-7 rounded bg-[var(--color-border)] animate-pulse mb-2" />
          <div className="w-72 h-4 rounded bg-[var(--color-border)] animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="min-h-[100px] animate-pulse">
              <CardContent><div className="h-full" /></CardContent>
            </Card>
          ))}
        </div>
        <Card>
          {[1,2,3,4,5].map(i => <LogSkeleton key={i} />)}
        </Card>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <FiAlertCircle size={24} />
            </div>
            <h2 className="text-lg font-black text-[var(--color-text)] mb-2">Failed to Load Logs</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">{error}</p>
            <Button onClick={() => fetchLogs(1)} icon={FiRefreshCw}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="-m-4 min-h-[calc(100vh-9rem)] space-y-6 bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:-m-6 sm:p-6">

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)]">Activity Logs</h1>
          <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
            Real-time audit trail of all operations within your workspace.
          </p>
        </div>
        <Button
          variant="outline" icon={FiRefreshCw}
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Logs"       value={pagination.total}               icon={FiList}        toneClass="bg-blue-50 text-blue-600" />
        <StatCard label="Members Invited"  value={actionCounts.invite_member}     icon={FiUserPlus}    toneClass="bg-indigo-50 text-indigo-600" />
        <StatCard label="Processes Updated" value={actionCounts.update_process}   icon={FiEdit2}       toneClass="bg-amber-50 text-amber-600" />
        <StatCard label="Tasks Completed"  value={actionCounts.complete_task}     icon={FiCheckCircle} toneClass="bg-emerald-50 text-emerald-600" />
      </div>

      {/* Search Bar */}
      <Card className="bg-white/90">
        <CardContent className="flex items-center gap-4">
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by user, message, or action…"
              className="app-focus h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-10 pr-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)] hover:text-[var(--color-muted)] transition-colors"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
          {searchTerm && (
            <span className="text-xs font-bold text-[var(--color-muted)] shrink-0">
              {filteredLogs.length} result{filteredLogs.length !== 1 ? "s" : ""}
            </span>
          )}
        </CardContent>
      </Card>

      {/* Log Groups */}
      {Object.entries(groupedLogs).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedLogs).map(([date, dayLogs]) => (
            <section key={date}>
              {/* Date label */}
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest">
                  <FiClock size={11} />
                  {date}
                </span>
                <span className="text-[10px] font-bold text-[var(--color-faint)]">
                  {dayLogs.length} event{dayLogs.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Log card */}
              <Card>
                {dayLogs.map((log) => (
                  <LogItem key={log._id} log={log} />
                ))}
              </Card>
            </section>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-primary)]">
              <FiActivity size={24} />
            </div>
            <h3 className="text-lg font-black text-[var(--color-text)]">No activity found</h3>
            <p className="mt-2 max-w-sm text-sm font-medium text-[var(--color-muted)]">
              {searchTerm ? "Try adjusting your search term." : "No activity has been recorded yet."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                Clear search
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!searchTerm && pagination.totalPages > 1 && (
        <Card className="bg-white/90">
          <CardContent className="flex items-center justify-between gap-4">
            <p className="hidden text-xs font-semibold text-[var(--color-muted)] sm:block">
              Showing{" "}
              <span className="font-black text-[var(--color-text)]">
                {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-black text-[var(--color-text)]">{pagination.total}</span> logs
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="app-focus flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <FiChevronLeft size={15} />
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => {
                const p = i + 1;
                const near = Math.abs(pagination.page - p) <= 1 || p === 1 || p === pagination.totalPages;
                const ellipsis = Math.abs(pagination.page - p) === 2 && p !== 1 && p !== pagination.totalPages;
                if (!near && !ellipsis) return null;
                if (ellipsis) return <span key={p} className="w-9 text-center text-xs font-bold text-[var(--color-faint)]">…</span>;
                return (
                  <button
                    key={p}
                    onClick={() => fetchLogs(p)}
                    className={`app-focus flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black transition-colors ${
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
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="app-focus flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <FiChevronRight size={15} />
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
