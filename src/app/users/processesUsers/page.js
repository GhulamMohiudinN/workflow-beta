"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FiLayers, FiSearch, FiClock, FiUsers, FiEye,
  FiAlertCircle, FiRefreshCw, FiX, FiBarChart2, FiCheckCircle, FiTrendingUp,
} from "react-icons/fi";
import { processAPI } from "../../api/processAPI";
import { Card, CardContent, CardHeader } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Badge } from "../../../components/Badge";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTimeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : `${d}d ago`;
}

function calcProgress(steps = []) {
  if (!steps.length) return 0;
  return Math.round(steps.filter((s) => s.status === "completed").length / steps.length * 100);
}

const statusMeta = {
  active:    { label: "Active",    variant: "primary" },
  completed: { label: "Completed", variant: "success" },
  pending:   { label: "Pending",   variant: "warning" },
  draft:     { label: "Draft",     variant: "outline" },
};

const ICON_TONES = [
  "bg-blue-50 text-blue-600",   "bg-purple-50 text-purple-600",
  "bg-amber-50 text-amber-600", "bg-teal-50 text-teal-600",
  "bg-pink-50 text-pink-600",   "bg-indigo-50 text-indigo-600",
];
const progressBar = (done) => done === 100 ? "bg-[var(--color-success)]" : "bg-[var(--color-primary)]";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ProcessCardSkeleton() {
  return (
    <Card className="min-h-[280px] animate-pulse">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-lg bg-[var(--color-border)]" />
          <div className="w-16 h-5 rounded bg-[var(--color-border)]" />
        </div>
        <div className="w-40 h-4 rounded bg-[var(--color-border)]" />
        <div className="w-full h-3 rounded bg-[var(--color-border)]" />
        <div className="space-y-2">
          <div className="w-32 h-3 rounded bg-[var(--color-border)]" />
          <div className="w-36 h-3 rounded bg-[var(--color-border)]" />
        </div>
        <div className="h-2 rounded-full bg-[var(--color-border)]" />
      </CardContent>
    </Card>
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
            <p className="mt-2 text-2xl font-black text-[var(--color-text)]">{value}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${toneClass}`}><Icon size={17} /></div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function UserProcessesPage() {
  const [allProcesses, setAllProcesses] = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userRole, setUserRole]         = useState("viewer");

  const searchTimer = useRef(null);
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const loadProcesses = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const result = await processAPI.getAssignedProcesses();
      if (result.success) {
        setAllProcesses(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error || "Failed to load processes.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const r = localStorage.getItem("role")?.toLowerCase();
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      setUserRole(u.role?.toLowerCase() || r || "viewer");
    }
    loadProcesses();
  }, [loadProcesses]);

  const filtered = allProcesses.filter((p) => {
    const q = debouncedSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  // Derived stats
  const completedCount = allProcesses.filter((p) => calcProgress(p.steps || []) === 100).length;
  const totalSteps     = allProcesses.flatMap((p) => p.steps || []).length;
  const avgProgress    = allProcesses.length
    ? Math.round(allProcesses.reduce((s, p) => s + calcProgress(p.steps || []), 0) / allProcesses.length)
    : 0;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 flex flex-col items-center">
            <FiAlertCircle className="h-12 w-12 text-[var(--color-danger)] mb-4" />
            <h2 className="text-lg font-black text-[var(--color-text)] mb-2">Could not load processes</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">{error}</p>
            <Button onClick={loadProcesses} icon={FiRefreshCw}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)]">My Processes</h1>
          <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
            Workflows you are assigned to
          </p>
        </div>
        <Button
          variant="outline" icon={FiRefreshCw}
          onClick={loadProcesses} disabled={isLoading}
          className={isLoading ? "animate-spin" : ""}
        >
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Assigned" value={allProcesses.length} icon={FiLayers}      toneClass="bg-blue-50 text-blue-600" />
        <StatCard label="Completed"      value={completedCount}       icon={FiCheckCircle} toneClass="bg-emerald-50 text-emerald-600" />
        <StatCard label="Total Steps"    value={totalSteps}           icon={FiBarChart2}   toneClass="bg-indigo-50 text-indigo-600" />
        <StatCard label="Avg Progress"   value={`${avgProgress}%`}   icon={FiTrendingUp}  toneClass="bg-amber-50 text-amber-600" />
      </div>

      {/* Search */}
      <Card className="bg-white/90">
        <CardContent className="flex items-center gap-4">
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" size={16} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search processes by name, description, or category..."
              className="app-focus h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-10 pr-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)] hover:text-[var(--color-muted)]"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View-only notice */}
      {userRole === "viewer" && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 py-3">
          <FiEye className="h-4 w-4 text-[var(--color-primary)] flex-shrink-0" />
          <p className="text-sm font-semibold text-[var(--color-muted)]">
            You have view access. To create or edit processes, contact your workspace admin.
          </p>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <ProcessCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-primary)]">
              <FiLayers size={24} />
            </div>
            <h3 className="text-lg font-black text-[var(--color-text)]">
              {debouncedSearch ? "No results found" : "No processes assigned yet"}
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium text-[var(--color-muted)]">
              {debouncedSearch
                ? "Try adjusting your search query."
                : "Contact your workspace admin to get processes assigned to you."}
            </p>
            {debouncedSearch && (
              <button onClick={() => setSearch("")} className="mt-4 text-xs font-bold text-[var(--color-primary)] hover:underline">
                Clear search
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((process, idx) => {
            const pid      = process._id || process.id;
            const progress = calcProgress(process.steps || []);
            const status   = progress === 100 ? "completed" : (process.status || "active");
            const meta     = statusMeta[status] || statusMeta.draft;
            const assigneeNames = (process.assignedTo || [])
              .map((a) => (typeof a === "string" ? a : a?.name || a?.email || ""))
              .filter(Boolean).join(", ") || null;

            return (
              <Card key={pid} hover className="min-h-[280px] bg-white/90">
                <CardContent className="flex h-full flex-col px-5 py-5">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${ICON_TONES[idx % ICON_TONES.length]}`}>
                      <FiLayers size={19} />
                    </div>
                    <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                  </div>

                  <div className="min-h-[56px]">
                    <h3 className="line-clamp-1 text-sm font-black text-[var(--color-text)]">{process.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs font-medium text-[var(--color-muted)]">
                      {process.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-[var(--color-muted)]">
                    <span className="flex items-center gap-1.5">
                      <FiClock size={12} /> Updated: {formatTimeAgo(process.updatedAt)}
                    </span>
                    {assigneeNames && (
                      <span className="flex items-start gap-1.5">
                        <FiUsers size={12} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-1">Assigned: {assigneeNames}</span>
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-[var(--color-muted)] font-semibold">Progress</span>
                      <span className="font-black text-[var(--color-text)]">
                        {progress}% ({(process.steps || []).filter(s => s.status === "completed").length}/{(process.steps || []).length})
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-soft)]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressBar(progress)}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-end pt-5 border-t border-[var(--color-border)]">
                    <Link
                      href={`/users/processesUsers/${pid}`}
                      className="app-focus inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-black text-[var(--color-primary)] hover:bg-blue-100 transition-colors"
                    >
                      <FiEye size={13} /> View Details
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
