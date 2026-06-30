"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiLayers, FiClock, FiCheckCircle, FiTrendingUp, FiArrowRight,
  FiAlertCircle, FiRefreshCw, FiZap,
} from "react-icons/fi";
import { processAPI } from "../../api/processAPI";
import { Card, CardContent, CardHeader } from "../../../components/Card";
import { Button } from "../../../components/Button";

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
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

function calcProgress(steps = []) {
  if (!steps.length) return 0;
  const done = steps.filter((s) => s.status === "completed").length;
  return Math.round((done / steps.length) * 100);
}

function statusVariant(status) {
  switch (status) {
    case "completed": return "bg-emerald-100 text-emerald-800";
    case "active":    return "bg-blue-100 text-blue-800";
    case "pending":   return "bg-amber-100 text-amber-800";
    default:          return "bg-slate-100 text-slate-600";
  }
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <Card className="min-h-[116px] animate-pulse">
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="w-24 h-2.5 rounded bg-[var(--color-border)]" />
            <div className="w-12 h-7 rounded bg-[var(--color-border)]" />
          </div>
          <div className="w-10 h-10 rounded-lg bg-[var(--color-border)]" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, toneClass }) {
  return (
    <Card className="min-h-[116px]">
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase text-[var(--color-muted)]">{label}</p>
            <p className="mt-3 text-2xl font-black text-[var(--color-text)]">{value}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${toneClass}`}>
            <Icon size={17} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function UserDashboard() {
  const [processes, setProcesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);
  const [user, setUser]           = useState(null);

  const loadData = async () => {
    setIsLoading(true); setError(null);
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
      const result = await processAPI.getAssignedProcesses();
      if (result.success) {
        setProcesses(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error || "Failed to load your processes.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const totalAssigned  = processes.length;
  const allSteps       = processes.flatMap((p) => p.steps || []);
  const completedSteps = allSteps.filter((s) => s.status === "completed").length;
  const pendingSteps   = allSteps.filter((s) => s.status !== "completed").length;
  const recentProcesses = processes.slice(0, 4);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-2">
          <div className="w-56 h-7 rounded bg-[var(--color-border)] animate-pulse mb-2" />
          <div className="w-80 h-4 rounded bg-[var(--color-border)] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatSkeleton /><StatSkeleton /><StatSkeleton />
        </div>
        <Card className="animate-pulse">
          <CardContent className="space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--color-border)] last:border-0">
                <div className="flex-1 space-y-2">
                  <div className="w-48 h-4 rounded bg-[var(--color-border)]" />
                  <div className="w-32 h-3 rounded bg-[var(--color-border)]" />
                </div>
                <div className="w-24 h-2 rounded bg-[var(--color-border)]" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 flex flex-col items-center">
            <FiAlertCircle className="h-12 w-12 text-[var(--color-danger)] mb-4" />
            <h2 className="text-lg font-black text-[var(--color-text)] mb-2">Could not load dashboard</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">{error}</p>
            <Button onClick={loadData} icon={FiRefreshCw}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-black text-[var(--color-text)]">
          Welcome back, {user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
          Here&apos;s an overview of your assigned workflows.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Assigned Processes" value={totalAssigned}  icon={FiLayers}      toneClass="bg-blue-50 text-blue-600" />
        <StatCard label="Completed Steps"    value={completedSteps} icon={FiCheckCircle} toneClass="bg-emerald-50 text-emerald-600" />
        <StatCard label="Pending Steps"      value={pendingSteps}   icon={FiClock}       toneClass="bg-amber-50 text-amber-600" />
      </div>

      {/* Recent Processes */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-[var(--color-text)]">My Recent Processes</h2>
            <p className="text-xs font-medium text-[var(--color-muted)] mt-0.5">Workflows you&apos;re assigned to</p>
          </div>
          {processes.length > 4 && (
            <Link href="/users/processesUsers" className="text-xs font-bold text-[var(--color-primary)] hover:underline">
              View all
            </Link>
          )}
        </CardHeader>

        {recentProcesses.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-primary)]">
              <FiLayers size={22} />
            </div>
            <h3 className="text-sm font-black text-[var(--color-text)] mb-1">No processes assigned yet</h3>
            <p className="text-xs text-[var(--color-muted)]">Contact your workspace admin to get started.</p>
          </CardContent>
        ) : (
          <>
            <div className="divide-y divide-[var(--color-border)]">
              {recentProcesses.map((process) => {
                const progress = calcProgress(process.steps || []);
                const pid = process._id || process.id;
                return (
                  <div key={pid} className="px-5 py-4 hover:bg-[var(--color-surface-hover)] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1">
                          <h3 className="font-black text-sm text-[var(--color-text)] truncate">{process.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${statusVariant(process.status)}`}>
                            {process.status || "active"}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-muted)]">
                          Updated: {formatTimeAgo(process.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="w-28">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-[var(--color-muted)] font-semibold">Progress</span>
                            <span className="font-black text-[var(--color-text)]">{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-[var(--color-bg-soft)] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? "bg-[var(--color-success)]" : "bg-[var(--color-primary)]"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <Link
                          href={`/users/processesUsers/${pid}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline"
                        >
                          View <FiArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-3 bg-[var(--color-surface-hover)] border-t border-[var(--color-border)]">
              <Link
                href="/users/processesUsers"
                className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1 hover:underline"
              >
                View all processes <FiArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        )}
      </Card>

      {/* Help tip */}
      <Card>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-primary)]">
              <FiZap size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--color-text)]">Need Help?</h3>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Click on any process to view its details and complete your assigned tasks.
                If you need assistance, contact your workspace admin.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
