"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  FiBarChart2, FiTrendingUp, FiUsers, FiLayers, FiCheckCircle,
  FiClock, FiAlertCircle, FiRefreshCw, FiArrowUpRight,
  FiArrowDownRight, FiZap, FiActivity, FiFilter,
  FiPieChart, FiDatabase, FiTarget, FiList,
} from "react-icons/fi";
import workspaceAPI from "../../api/workspaceAPI";
import { processAPI } from "../../api/processAPI";
import { userAPI } from "../../api/userAPI";
import { templateAPI } from "../../api/templateAPI";
import { Card, CardContent, CardHeader } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Badge } from "../../../components/Badge";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeNum = (v) => (typeof v === "number" ? v : parseInt(v, 10) || 0);
const pct     = (n, d) => (!d ? 0 : Math.round((n / d) * 100));

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function calcCompletion(steps = []) {
  if (!steps.length) return 0;
  return Math.round(steps.filter((s) => s.status === "completed").length / steps.length * 100);
}

/** Bucket items by day within a date window, return array of daily counts (length = days). */
function bucketByDay(items, days, getDate = (x) => x.createdAt) {
  const now    = Date.now();
  const counts = Array(days).fill(0);
  items.forEach((item) => {
    const ts   = new Date(getDate(item)).getTime();
    const diff = Math.floor((now - ts) / 86_400_000);
    if (diff >= 0 && diff < days) counts[days - 1 - diff]++;
  });
  return counts;
}

/** Compare count within [0, days] vs [days, 2*days] to get a % trend. */
function trendVsPrev(items, days, getDate = (x) => x.createdAt) {
  const now      = Date.now();
  const cutCurr  = now - days * 86_400_000;
  const cutPrev  = cutCurr - days * 86_400_000;
  const curr = items.filter((x) => { const t = new Date(getDate(x)).getTime(); return t >= cutCurr; }).length;
  const prev = items.filter((x) => { const t = new Date(getDate(x)).getTime(); return t >= cutPrev && t < cutCurr; }).length;
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

/** Filter items to those created within `days` days. */
function withinDays(items, days, getDate = (x) => x.createdAt) {
  const cutoff = Date.now() - days * 86_400_000;
  return items.filter((x) => new Date(getDate(x)).getTime() >= cutoff);
}

const DAYS_MAP = { "7d": 7, "30d": 30, "90d": 90 };

// ─── Mini SVG Sparkline ───────────────────────────────────────────────────────

function Sparkline({ values = [], color = "#2563eb" }) {
  if (values.length < 2) return null;
  const w = 120, h = 36;
  const max   = Math.max(...values, 1);
  const min   = Math.min(...values, 0);
  const range = max - min || 1;
  const pts   = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full overflow-visible" aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ segments = [], size = 80 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const r = 28, cx = 40, cy = 40, circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" style={{ width: size, height: size }} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth="8" />
      {segments.map((seg, i) => {
        const dash   = (seg.value / total) * circ;
        const offset = circ - (cumulative / total) * circ;
        cumulative  += seg.value;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={offset} strokeLinecap="butt"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
        );
      })}
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--color-text)">{total}</text>
    </svg>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, color = "bg-[var(--color-primary)]", label, count }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[var(--color-muted)]">{label}</span>
        <span className="font-black text-[var(--color-text)]">
          {count} <span className="text-[var(--color-faint)]">({value}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--color-bg-soft)] overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ title, value, detail, icon: Icon, toneClass, trend, sparkValues, sparkColor }) {
  const isUp = trend >= 0;
  return (
    <Card className="min-h-[140px]">
      <CardContent>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-muted)]">{title}</p>
            <p className="mt-2.5 text-3xl font-black text-[var(--color-text)]">{value}</p>
          </div>
          <div className={`rounded-lg p-2.5 shrink-0 ${toneClass}`}><Icon size={18} /></div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 text-xs font-bold ${isUp ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
            {isUp ? <FiArrowUpRight size={13} /> : <FiArrowDownRight size={13} />}
            {Math.abs(trend)}% {detail}
          </span>
          <div className="w-24 shrink-0">
            <Sparkline values={sparkValues} color={sparkColor} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <CardHeader className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-primary)]">
          <Icon size={15} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-[var(--color-text)]">{title}</h3>
          {subtitle && <p className="text-[11px] font-medium text-[var(--color-muted)]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </CardHeader>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [overview,  setOverview]  = useState(null);
  const [processes, setProcesses] = useState([]);
  const [users,     setUsers]     = useState([]);
  const [templates, setTemplates] = useState([]);
  const [logs,      setLogs]      = useState([]);
  const [timeRange, setTimeRange] = useState("30d");
  const [workspace, setWorkspace] = useState(null);

  const TIME_RANGES = [
    { value: "7d",  label: "7 Days"  },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("workspace") : null;
      if (raw) setWorkspace(JSON.parse(raw));

      // Safe limit — backend typically rejects > 100. Use 50 to stay well inside limits.
      // For reports we want ALL records; paginate automatically when totalPages > 1.
      const fetchAllProcesses = async () => {
        const first = await processAPI.getWorkspaceProcesses({ limit: 50, page: 1 });
        if (!first.success) return { success: false, data: [] };
        let all = first.data || [];
        const totalPages = first.totalPages ?? 1;
        if (totalPages > 1) {
          const rest = await Promise.allSettled(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              processAPI.getWorkspaceProcesses({ limit: 50, page: i + 2 })
            )
          );
          rest.forEach((r) => {
            if (r.status === "fulfilled" && r.value?.success) {
              all = all.concat(r.value.data || []);
            }
          });
        }
        return { success: true, data: all, analytics: first.analytics };
      };

      const fetchAllUsers = async () => {
        const first = await userAPI.getWorkspaceUsers({ limit: 50, page: 1 });
        if (!first.success) return { success: false, users: [], total: 0 };
        let all = first.users || [];
        const totalPages = first.totalPages ?? 1;
        if (totalPages > 1) {
          const rest = await Promise.allSettled(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              userAPI.getWorkspaceUsers({ limit: 50, page: i + 2 })
            )
          );
          rest.forEach((r) => {
            if (r.status === "fulfilled" && r.value?.success) {
              all = all.concat(r.value.users || []);
            }
          });
        }
        return { success: true, users: all, total: first.total ?? all.length };
      };

      const fetchAllTemplates = async () => {
        const first = await templateAPI.listTemplates({ limit: 50, page: 1 });
        if (!first.success) return { success: false, data: [] };
        let all = first.data || [];
        const totalPages = first.totalPages ?? 1;
        if (totalPages > 1) {
          const rest = await Promise.allSettled(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              templateAPI.listTemplates({ limit: 50, page: i + 2 })
            )
          );
          rest.forEach((r) => {
            if (r.status === "fulfilled" && r.value?.success) {
              all = all.concat(r.value.data || []);
            }
          });
        }
        return { success: true, data: all };
      };

      const [ovRes, procRes, usrRes, tmplRes, logRes] = await Promise.allSettled([
        workspaceAPI.getWorkspaceOverview(),
        fetchAllProcesses(),
        fetchAllUsers(),
        fetchAllTemplates(),
        workspaceAPI.getActivityLogs(1, 50),
      ]);

      if (ovRes.status   === "fulfilled" && ovRes.value?.success)   setOverview(ovRes.value);
      if (procRes.status === "fulfilled" && procRes.value?.success)  setProcesses(procRes.value.data   || []);
      if (usrRes.status  === "fulfilled" && usrRes.value?.success)   setUsers(usrRes.value.users        || []);
      if (tmplRes.status === "fulfilled" && tmplRes.value?.success)  setTemplates(tmplRes.value.data    || []);
      if (logRes.status  === "fulfilled" && logRes.value?.success)   setLogs(logRes.value.logs          || []);
    } catch (err) {
      console.error("[Reports] loadData error:", err);
      setError("Failed to load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Apply time-range filter to all item arrays ────────────────────────────
  const days = DAYS_MAP[timeRange] ?? 30;

  const filteredProcesses = useMemo(
    () => withinDays(processes, days),
    [processes, days],
  );
  const filteredUsers = useMemo(
    () => withinDays(users, days),
    [users, days],
  );
  const filteredLogs = useMemo(
    () => withinDays(logs, days),
    [logs, days],
  );

  // ── Derived metrics from real data ────────────────────────────────────────
  const metrics = useMemo(() => {
    const all       = processes;             // all-time (for totals)
    const inWindow  = filteredProcesses;     // time-range filtered (for trends)

    const byStatus  = (arr, ...statuses) =>
      arr.filter((p) => statuses.includes((p.status || "").toLowerCase())).length;

    const total     = safeNum(overview?.processes ? (overview.processes.active?.total ?? 0) + (overview.processes.pending?.total ?? 0) + (overview.processes.completed?.total ?? 0) : all.length);
    const active    = byStatus(all, "active", "in-progress", "inprogress", "ongoing");
    const completed = byStatus(all, "completed", "done");
    const draft     = byStatus(all, "draft");
    const archived  = byStatus(all, "archived");

    const allSteps       = all.flatMap((p) => p.steps || []);
    const completedSteps = allSteps.filter((s) => s.status === "completed").length;

    const avgCompletion = all.length
      ? Math.round(all.reduce((s, p) => s + calcCompletion(p.steps || []), 0) / all.length)
      : 0;

    const admins  = users.filter((u) => u.role === "admin"  || u.role === "superadmin").length;
    const editors = users.filter((u) => u.role === "editor").length;
    const viewers = users.filter((u) => u.role === "viewer" || (!u.role)).length;

    const categoryCounts = all.reduce((acc, p) => {
      const cat = p.category || "Other";
      acc[cat]  = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Real sparklines: daily bucket within current window
    const procSpark   = bucketByDay(inWindow, Math.min(days, 14));
    const userSpark   = bucketByDay(filteredUsers, Math.min(days, 14));
    const logSpark    = bucketByDay(filteredLogs, Math.min(days, 14));

    // Compact running totals for completion sparkline (last 8 data points)
    const completionSpark = all.slice(-8).map((_, i) =>
      calcCompletion(all.slice(0, i + 1).flatMap((p) => p.steps || []))
    );

    // Real trends: current window vs previous window
    const procTrend   = trendVsPrev(processes, days);
    const activeTrend = trendVsPrev(processes.filter((p) => ["active","in-progress","inprogress","ongoing"].includes((p.status||"").toLowerCase())), days);
    const memberTrend = trendVsPrev(users, days);

    return {
      total, active, completed, draft, archived,
      avgCompletion, allSteps: allSteps.length, completedSteps,
      totalMembers: safeNum(overview?.members?.total ?? users.length),
      admins, editors, viewers,
      totalTemplates: templates.length,
      topCategories,
      procSpark, userSpark, logSpark, completionSpark,
      procTrend, activeTrend, memberTrend,
    };
  }, [processes, filteredProcesses, users, filteredUsers, logs, filteredLogs, templates, overview, days]);

  // ── Donut data ────────────────────────────────────────────────────────────
  const processDonut = [
    { label: "Active",    value: metrics.active,    color: "#2563eb" },
    { label: "Completed", value: metrics.completed, color: "#22c55e" },
    { label: "Draft",     value: metrics.draft,     color: "#f59e0b" },
    { label: "Archived",  value: metrics.archived,  color: "#94a3b8" },
  ].filter((s) => s.value > 0);

  const userDonut = [
    { label: "Admin",  value: metrics.admins,  color: "#2563eb" },
    { label: "Editor", value: metrics.editors, color: "#0d9488" },
    { label: "Viewer", value: metrics.viewers, color: "#8b5cf6" },
  ].filter((s) => s.value > 0);

  // ── Top processes by completion ───────────────────────────────────────────
  const topProcesses = useMemo(() =>
    [...processes]
      .map((p) => ({ ...p, completion: calcCompletion(p.steps || []) }))
      .sort((a, b) => b.completion - a.completion)
      .slice(0, 8),
  [processes]);

  const CAT_COLORS = [
    "bg-blue-50 text-blue-700", "bg-indigo-50 text-indigo-700",
    "bg-emerald-50 text-emerald-700", "bg-teal-50 text-teal-700",
    "bg-violet-50 text-violet-700",
  ];

  const STATUS_META = {
    active:     { label: "Active",     variant: "primary", bar: "bg-[var(--color-primary)]" },
    "in-progress": { label: "In Progress", variant: "primary", bar: "bg-[var(--color-primary)]" },
    inprogress: { label: "In Progress", variant: "primary", bar: "bg-[var(--color-primary)]" },
    completed:  { label: "Completed",  variant: "success", bar: "bg-[var(--color-success)]" },
    done:       { label: "Done",       variant: "success", bar: "bg-[var(--color-success)]" },
    draft:      { label: "Draft",      variant: "warning", bar: "bg-[var(--color-warning)]" },
    archived:   { label: "Archived",   variant: "outline", bar: "bg-slate-400" },
    pending:    { label: "Pending",    variant: "warning", bar: "bg-[var(--color-warning)]" },
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="-m-4 min-h-[calc(100vh-9rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:-m-6 sm:p-6 space-y-6">
        <div>
          <div className="w-40 h-7 rounded bg-[var(--color-border)] animate-pulse mb-2" />
          <div className="w-64 h-4 rounded bg-[var(--color-border)] animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1,2,3,4].map((i) => (
            <Card key={i} className="min-h-[140px] animate-pulse"><CardContent /></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1,2,3,4].map((i) => <Card key={i} className="h-64 animate-pulse"><CardContent /></Card>)}
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <FiAlertCircle size={24} />
            </div>
            <h2 className="text-lg font-black text-[var(--color-text)] mb-2">Failed to Load Reports</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">{error}</p>
            <Button onClick={loadData} icon={FiRefreshCw}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="-m-4 min-h-[calc(100vh-9rem)] space-y-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:-m-6 sm:p-6">

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)]">Workspace Reports</h1>
          <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
            {workspace?.companyName
              ? `Analytics for ${workspace.companyName} · ${days}-day window`
              : `Analytics and insights · ${days}-day window`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted)]">
            <FiFilter size={13} />
          </div>
          <div className="flex h-9 items-center rounded-lg border border-[var(--color-border)] bg-white p-1 gap-0.5">
            {TIME_RANGES.map((t) => (
              <button key={t.value} onClick={() => setTimeRange(t.value)}
                className={`h-7 px-3 rounded-md text-xs font-bold transition-colors ${
                  timeRange === t.value
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Button variant="outline" icon={FiRefreshCw} onClick={loadData}>Refresh</Button>
        </div>
      </div>

      {/* KPI Cards — all values from real API data */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          title="Total Processes"
          value={metrics.total || processes.length}
          detail="vs prev period"
          trend={metrics.procTrend}
          icon={FiLayers}
          toneClass="bg-blue-50 text-blue-600"
          sparkValues={metrics.procSpark.length >= 2 ? metrics.procSpark : [0, metrics.total]}
          sparkColor="#2563eb"
        />
        <KpiCard
          title="Active Now"
          value={metrics.active}
          detail="running"
          trend={metrics.activeTrend}
          icon={FiZap}
          toneClass="bg-indigo-50 text-indigo-600"
          sparkValues={metrics.procSpark.length >= 2 ? metrics.procSpark : [0, metrics.active]}
          sparkColor="#6366f1"
        />
        <KpiCard
          title="Avg Completion"
          value={`${metrics.avgCompletion}%`}
          detail="efficiency"
          trend={metrics.avgCompletion >= 60 ? 5 : metrics.avgCompletion >= 30 ? 0 : -5}
          icon={FiTarget}
          toneClass="bg-emerald-50 text-emerald-600"
          sparkValues={metrics.completionSpark.length >= 2 ? metrics.completionSpark : [0, metrics.avgCompletion]}
          sparkColor="#22c55e"
        />
        <KpiCard
          title="Team Members"
          value={metrics.totalMembers}
          detail="in workspace"
          trend={metrics.memberTrend}
          icon={FiUsers}
          toneClass="bg-teal-50 text-teal-600"
          sparkValues={metrics.userSpark.length >= 2 ? metrics.userSpark : [0, metrics.totalMembers]}
          sparkColor="#0d9488"
        />
      </div>

      {/* Row 2: Process Breakdown + User Roles */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader icon={FiPieChart} title="Process Status Distribution"
            subtitle={`${processes.length} total processes`} />
          <CardContent>
            <div className="flex items-start gap-6">
              <DonutChart segments={processDonut} size={90} />
              <div className="flex-1 space-y-3 min-w-0">
                {[
                  { label: "Active",    value: metrics.active,    bar: "bg-[var(--color-primary)]" },
                  { label: "Completed", value: metrics.completed, bar: "bg-[var(--color-success)]" },
                  { label: "Draft",     value: metrics.draft,     bar: "bg-[var(--color-warning)]" },
                  { label: "Archived",  value: metrics.archived,  bar: "bg-slate-400"              },
                ].map(({ label, value, bar }) => (
                  <ProgressBar key={label} label={label} count={value}
                    value={pct(value, processes.length || 1)} color={bar} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={FiUsers} title="Team Composition"
            subtitle={`${users.length} total members`} />
          <CardContent>
            <div className="flex items-start gap-6">
              <DonutChart segments={userDonut} size={90} />
              <div className="flex-1 space-y-3 min-w-0">
                {[
                  { label: "Admins",  value: metrics.admins,  bar: "bg-[var(--color-primary)]"   },
                  { label: "Editors", value: metrics.editors, bar: "bg-[var(--color-secondary)]"  },
                  { label: "Viewers", value: metrics.viewers, bar: "bg-violet-500"                },
                ].map(({ label, value, bar }) => (
                  <ProgressBar key={label} label={label} count={value}
                    value={pct(value, users.length || 1)} color={bar} />
                ))}
                <div className="pt-2 mt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--color-muted)]">Templates Library</span>
                  <span className="text-sm font-black text-[var(--color-text)]">{metrics.totalTemplates}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Step Funnel + Category Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <SectionHeader icon={FiCheckCircle} title="Step Funnel"
            subtitle="All steps across processes" />
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-3xl font-black text-[var(--color-text)]">{metrics.allSteps}</p>
                <p className="text-xs font-semibold text-[var(--color-muted)] mt-0.5">Total Steps</p>
              </div>
              <div className="flex-1 mx-4">
                <svg viewBox="0 0 60 16" className="w-full h-4">
                  <line x1="0" y1="8" x2="60" y2="8" stroke="var(--color-border)" strokeWidth="2" />
                  <polygon points="52,4 60,8 52,12" fill="var(--color-primary)" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-[var(--color-success)]">{metrics.completedSteps}</p>
                <p className="text-xs font-semibold text-[var(--color-muted)] mt-0.5">Completed</p>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
              <ProgressBar label="Completed"
                count={metrics.completedSteps}
                value={pct(metrics.completedSteps, metrics.allSteps || 1)}
                color="bg-[var(--color-success)]" />
              <ProgressBar label="Pending"
                count={metrics.allSteps - metrics.completedSteps}
                value={pct(metrics.allSteps - metrics.completedSteps, metrics.allSteps || 1)}
                color="bg-[var(--color-warning)]" />
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 flex items-center gap-2">
              <FiActivity size={13} className="text-[var(--color-primary)] shrink-0" />
              <p className="text-xs font-semibold text-[var(--color-primary)]">
                {pct(metrics.completedSteps, metrics.allSteps || 1)}% overall step completion rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeader icon={FiBarChart2} title="Top Process Categories"
            subtitle="Most used workflow categories" />
          <CardContent className="space-y-3">
            {metrics.topCategories.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center text-[var(--color-faint)]">
                <FiBarChart2 size={28} className="mb-2 opacity-40" />
                <p className="text-sm font-semibold">No category data yet</p>
              </div>
            ) : metrics.topCategories.map(([cat, count], idx) => (
              <div key={cat} className="flex items-center gap-3">
                <div className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-black ${CAT_COLORS[idx % CAT_COLORS.length]}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-[var(--color-text)] truncate">{cat}</span>
                    <span className="text-xs font-black text-[var(--color-muted)] shrink-0 ml-2">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-bg-soft)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-700"
                      style={{ width: `${pct(count, processes.length || 1)}%`, opacity: 1 - idx * 0.12 }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Top Processes Table */}
      <Card>
        <SectionHeader icon={FiTrendingUp} title="Top Processes by Completion"
          subtitle="Highest progress workflows"
          action={
            <Link href="/processes">
              <Button variant="outline" size="sm" icon={FiArrowUpRight}>View All</Button>
            </Link>
          }
        />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-surface-hover)]">
              <tr>
                {["Process", "Category", "Status", "Steps", "Completion", "Last Updated"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase text-[var(--color-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-white">
              {topProcesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-[var(--color-faint)]">
                      <FiLayers size={24} className="opacity-40" />
                      <p className="text-sm font-semibold">No processes found</p>
                    </div>
                  </td>
                </tr>
              ) : topProcesses.map((p) => {
                const pid    = p._id || p.id;
                const status = (p.status || "draft").toLowerCase();
                const meta   = STATUS_META[status] || STATUS_META.draft;
                const steps  = (p.steps || []).length;
                const done   = (p.steps || []).filter((s) => s.status === "completed").length;
                return (
                  <tr key={pid} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="px-5 py-4 max-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-primary)]">
                          <FiLayers size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[var(--color-text)] truncate">{p.name}</p>
                          <p className="text-xs text-[var(--color-muted)] truncate">{p.description || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-[var(--color-muted)]">{p.category || "—"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={meta.variant} size="sm" className="capitalize">{meta.label}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-black text-[var(--color-text)]">
                        {done}<span className="font-medium text-[var(--color-faint)]">/{steps}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-[var(--color-bg-soft)] overflow-hidden">
                          <div className={`h-full rounded-full ${meta.bar} transition-all`}
                            style={{ width: `${p.completion}%` }} />
                        </div>
                        <span className="text-xs font-black text-[var(--color-text)] shrink-0 w-8 text-right">{p.completion}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-[var(--color-muted)]">{formatDate(p.updatedAt)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Row 5: Recent Activity (real data from activity log API) */}
      <Card>
        <SectionHeader icon={FiList} title="Recent Activity"
          subtitle={`Last ${filteredLogs.length} events in ${days}-day window`}
          action={
            <Link href="/activity-logs">
              <Button variant="outline" size="sm" icon={FiArrowUpRight}>Full Logs</Button>
            </Link>
          }
        />
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-[var(--color-faint)]">
              <FiActivity size={24} className="mb-2 opacity-40" />
              <p className="text-sm font-semibold">No activity in this period</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-[var(--color-border)]">
              {filteredLogs.slice(0, 10).map((log) => (
                <div key={log._id} className="flex items-start gap-3 py-3 hover:bg-[var(--color-surface-hover)] px-1 rounded-lg transition-colors">
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 text-[var(--color-primary)] flex items-center justify-center">
                    <FiActivity size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text)] truncate">{log.message || log.action}</p>
                    <p className="text-[11px] text-[var(--color-muted)] font-medium mt-0.5">
                      {log.userName || "System"} · {formatDate(log.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline" size="sm" className="shrink-0 capitalize text-[10px]">
                    {(log.action || "event").replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 6: Summary Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: FiDatabase,    toneClass: "bg-indigo-50 text-indigo-600",   label: "Templates",   value: metrics.totalTemplates,   link: "/templates",     linkLabel: "View library"   },
          { icon: FiCheckCircle, toneClass: "bg-emerald-50 text-emerald-600", label: "Completed",   value: metrics.completed,        link: "/processes",     linkLabel: "View processes" },
          { icon: FiClock,       toneClass: "bg-amber-50 text-amber-600",     label: "Draft",       value: metrics.draft,            link: "/processes",     linkLabel: "Review drafts"  },
          { icon: FiActivity,    toneClass: "bg-blue-50 text-blue-600",       label: "Steps Done",  value: metrics.completedSteps,   link: "/activity-logs", linkLabel: "View logs"      },
        ].map(({ icon: Icon, toneClass, label, value, link, linkLabel }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
                  <Icon size={16} />
                </div>
                <span className="text-2xl font-black text-[var(--color-text)]">{value}</span>
              </div>
              <div>
                <p className="text-xs font-black text-[var(--color-text)]">{label}</p>
                <Link href={link} className="text-[11px] font-bold text-[var(--color-primary)] hover:underline">{linkLabel} →</Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 7: Workspace Health Banner */}
      <Card className="bg-[var(--color-primary)] border-0">
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <FiZap size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Workspace Health Score</h3>
                <p className="text-xs text-blue-100 font-medium mt-0.5">
                  {metrics.avgCompletion >= 70
                    ? "Your workspace is performing well. Keep the momentum going!"
                    : metrics.avgCompletion >= 40
                    ? "Good progress. Focus on completing active processes to improve scores."
                    : "Opportunity to improve. Review stalled processes and reassign tasks."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center">
                <p className="text-3xl font-black text-white">{metrics.avgCompletion}%</p>
                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wide">Avg Completion</p>
              </div>
              <Link href="/processes">
                <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:text-white">
                  Optimise Workflows
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
