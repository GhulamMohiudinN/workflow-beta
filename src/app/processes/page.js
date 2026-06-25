"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiAlertCircle,
  FiBarChart2,
  FiCheckCircle,
  FiCloud,
  FiEdit2,
  FiEye,
  FiFilter,
  FiGrid,
  FiLayers,
  FiList,
  FiMoreVertical,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiTrendingUp,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { processAPI } from "../api/processAPI";
import { Avatar, Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card, CardContent } from "../../components/Card";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const statusMeta = {
  active: {
    label: "On Schedule",
    variant: "success",
    icon: FiCheckCircle,
    bar: "bg-emerald-500",
    color: "#10b981",
    pill: "bg-emerald-100 text-emerald-700",
  },
  inprogress: {
    label: "In Progress",
    variant: "primary",
    icon: FiRefreshCw,
    bar: "bg-cyan-600",
    color: "#0891b2",
    pill: "bg-cyan-100 text-cyan-700",
  },
  completed: {
    label: "Completed",
    variant: "success",
    icon: FiCheckCircle,
    bar: "bg-teal-600",
    color: "#0d9488",
    pill: "bg-teal-100 text-teal-700",
  },
  draft: {
    label: "Review Required",
    variant: "warning",
    icon: FiAlertCircle,
    bar: "bg-amber-500",
    color: "#f59e0b",
    pill: "bg-amber-100 text-amber-700",
  },
  archived: {
    label: "High Priority",
    variant: "primary",
    icon: FiLayers,
    bar: "bg-slate-500",
    color: "#64748b",
    pill: "bg-slate-100 text-slate-700",
  },
};

const categoryMeta = {
  Onboarding: {
    icon: FiUserPlus,
    tone: "bg-cyan-50 text-cyan-600",
  },
  HR: {
    icon: FiUsers,
    tone: "bg-violet-50 text-violet-500",
  },
  Finance: {
    icon: FiBarChart2,
    tone: "bg-emerald-50 text-emerald-500",
  },
  IT: {
    icon: FiCloud,
    tone: "bg-sky-50 text-sky-600",
  },
  Marketing: {
    icon: FiTrendingUp,
    tone: "bg-rose-50 text-rose-500",
  },
  Sales: {
    icon: FiTrendingUp,
    tone: "bg-indigo-50 text-indigo-500",
  },
  Operations: {
    icon: FiCloud,
    tone: "bg-teal-50 text-teal-600",
  },
  "Customer Support": {
    icon: FiUsers,
    tone: "bg-red-50 text-red-500",
  },
  Legal: {
    icon: FiShield,
    tone: "bg-slate-100 text-slate-600",
  },
};

export default function ProcessesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [processes, setProcesses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const canEdit = userRole === "admin" || userRole === "editor";

  useEffect(() => {
    let resolvedRole = "viewer";

    try {
      const rawRole = localStorage.getItem("role")?.toLowerCase();
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");

      if (rawRole && rawRole !== "member") {
        resolvedRole = rawRole;
      } else if (userObj?.role && userObj.role.toLowerCase() !== "member") {
        resolvedRole = userObj.role.toLowerCase();
        localStorage.setItem("role", resolvedRole);
      } else if (userObj?.userType?.toLowerCase() === "admin") {
        resolvedRole = "admin";
      }
    } catch (err) {
      console.error("Failed to resolve process permissions", err);
    }

    setUserRole(resolvedRole);

    const fetchProcesses = async (currentRole) => {
      try {
        setIsLoading(true);
        setError(null);

        const filters = {};
        if (search) filters.search = search;
        if (filter !== "all") filters.status = filter;

        let result;

        if (currentRole === "admin" || currentRole === "superadmin") {
          result = await processAPI.getWorkspaceProcesses(filters);
        } else if (currentRole === "editor") {
          result = await processAPI.getWorkspaceProcesses(filters);
          if (!result.success && (result.status === 403 || result.status === 401)) {
            result = await processAPI.getAssignedProcesses(filters);
          }
        } else {
          result = await processAPI.getAssignedProcesses(filters);
        }

        if (!result.success) {
          setError(result.error || "Failed to load processes");
          setProcesses([]);
          return;
        }

        setAnalytics((previous) => {
          if (result.analytics) return result.analytics;
          if (result.count != null) return { ...previous, total: result.count };
          return previous;
        });

        setProcesses(
          (result.data || []).map((process, index) => {
            const completion = calculateCompletion(process);
            const status = completion === 100 ? "completed" : process.status || "draft";

            return {
              id: process._id ?? process.id ?? String(index + 1),
              rawId: process._id || process.id,
              name: process.name || "Untitled process",
              description: process.description || "No process description yet.",
              category: process.category || "Operations",
              steps: (process.steps || []).length,
              completedSteps: (process.steps || []).filter(
                (step) => step.status === "completed",
              ).length,
              status,
              visibility: process.visibility || "private",
              lastUpdated: formatDate(process.updatedAt),
              completion,
              assignees: process.assignees || [],
              settings: process.settings,
              createdBy: process.createdBy || null,
              nextStep: getNextStep(process.steps || []),
            };
          }),
        );
      } catch (err) {
        console.error("Process load error", err);
        setError("An unexpected error occurred. Please refresh the page.");
        setProcesses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcesses(resolvedRole);
  }, [filter, search]);

  const filteredProcesses = useMemo(
    () =>
      processes.filter((process) => {
        const matchesStatus =
          filter === "all" || process.status?.toLowerCase() === filter.toLowerCase();
        const query = search.toLowerCase();
        const matchesSearch =
          process.name.toLowerCase().includes(query) ||
          process.description.toLowerCase().includes(query);

        return matchesStatus && matchesSearch;
      }),
    [filter, processes, search],
  );

  const metrics = useMemo(() => {
    const localAverage = processes.length
      ? Math.round(
          processes.reduce((total, process) => total + process.completion, 0) /
            processes.length,
        )
      : 0;

    return [
      {
        title: "Total Processes",
        value: analytics?.total ?? processes.length,
        detail: "+12%",
        icon: FiLayers,
        tone: "cyan",
      },
      {
        title: "Active",
        value:
          analytics?.active ??
          processes.filter((process) =>
            ["active", "inprogress"].includes(process.status?.toLowerCase()),
          ).length,
        detail: "+8",
        icon: FiTrendingUp,
        tone: "emerald",
      },
      {
        title: "Completed",
        value:
          analytics?.completed ??
          processes.filter((process) => process.status === "completed").length,
        detail: "This Year",
        icon: FiCheckCircle,
        tone: "teal",
      },
      {
        title: "Avg Efficiency",
        value: `${analytics?.avgCompletion ?? localAverage}%`,
        detail: "+4%",
        icon: FiBarChart2,
        tone: "amber",
      },
    ];
  }, [analytics, processes]);

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    const targetId = deleteConfirm.rawId || deleteConfirm.id;
    const result = await processAPI.deleteProcess(targetId);

    if (result.success) {
      setProcesses((current) =>
        current.filter((process) => (process.rawId || process.id) !== targetId),
      );
      setDeleteConfirm(null);
    } else {
      setError(result.error || "Failed to delete process");
    }

    setIsDeleting(false);
  };

  if (isLoading) {
    return <ProcessLoadingState />;
  }

  return (
    <div className="-m-4 min-h-[calc(100vh-9rem)] space-y-6 bg-linear-to-br from-slate-50 via-cyan-50 to-emerald-50 p-4 sm:-m-6 sm:p-6">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)]">
            Operational Processes
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
            {canEdit
              ? "Manage and monitor high-fidelity enterprise workflows."
              : "Monitor the workflows assigned to you."}
          </p>
        </div>

        {canEdit && (
          <Link href="/processes/new">
            <Button icon={FiPlus}>Create New Process</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card className="bg-white/90">
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative min-w-0 flex-1">
            <FiSearch
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]"
              size={16}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search processes..."
              className="app-focus h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)]">
              <FiFilter size={16} />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="app-focus h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm font-semibold text-[var(--color-text)]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex h-10 items-center rounded-lg border border-[var(--color-border)] bg-white p-1">
              <IconToggle
                active={viewMode === "grid"}
                label="Grid view"
                icon={FiGrid}
                onClick={() => setViewMode("grid")}
              />
              <IconToggle
                active={viewMode === "list"}
                label="List view"
                icon={FiList}
                onClick={() => setViewMode("list")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredProcesses.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
          {filteredProcesses.map((process) => (
            <ProcessCard
              key={process.id}
              process={process}
              canEdit={canEdit}
              onDelete={() => setDeleteConfirm(process)}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      {filteredProcesses.length > 0 && viewMode === "list" && (
        <ProcessTable
          processes={filteredProcesses}
          canEdit={canEdit}
          onDelete={setDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}

      {filteredProcesses.length === 0 && (
        <EmptyState canEdit={canEdit} search={search} />
      )}

      {deleteConfirm && (
        <DeleteProcessModal
          process={deleteConfirm}
          loading={isDeleting}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

function MetricCard({ title, value, detail, icon: Icon, tone }) {
  const toneMap = {
    cyan: "bg-cyan-50 text-cyan-700",
    emerald: "bg-emerald-50 text-emerald-700",
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <Card className="min-h-[116px]">
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--color-muted)]">
              {title}
            </p>
            <p className="mt-3 text-2xl font-black text-[var(--color-text)]">
              {value}
            </p>
          </div>
          <div className={`rounded-lg p-2.5 ${toneMap[tone]}`}>
            <Icon size={17} />
          </div>
        </div>
        <p className="mt-2 text-right text-[10px] font-bold text-[var(--color-muted)]">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

function ProcessCard({ process, canEdit, onDelete, isDeleting }) {
  const meta = statusMeta[process.status?.toLowerCase()] || statusMeta.draft;
  const StatusIcon = meta.icon;
  const category =
    categoryMeta[process.category] || categoryMeta.Operations;
  const CategoryIcon = category.icon;
  const targetId = process.rawId || process.id;
  const totalStages = Math.max(process.steps, 1);
  const currentStage =
    process.completion === 100
      ? totalStages
      : Math.min(process.completedSteps + 1, totalStages);
  const stageLabel = `${currentStage}/${totalStages}`;

  return (
    <Card hover className="min-h-[300px] border-white/70 bg-white/90 shadow-[0_18px_45px_rgba(15,118,110,0.08)]">
      <CardContent className="flex h-full flex-col px-6 py-6">
        <div className="mb-7 flex items-start justify-between gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.tone}`}
          >
            <CategoryIcon size={19} />
          </div>
          <Badge
            variant={meta.variant}
            size="sm"
            className={`rounded px-2.5 py-1 text-[9px] uppercase ${meta.pill}`}
          >
            <StatusIcon className="mr-1" size={12} />
            {meta.label}
          </Badge>
        </div>

        <div className="min-h-[64px]">
          <h2 className="line-clamp-1 text-sm font-semibold text-[var(--color-text)]">
            {process.name}
          </h2>
          <p className="mt-1 line-clamp-1 text-xs font-medium text-[var(--color-muted)]">
            {process.description}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-5">
          <CircularProgress value={process.completion} color={meta.color} />

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-[var(--color-muted)]">
                  Next Step:{" "}
                  <span className="font-semibold text-slate-500">
                    {process.nextStep}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-[var(--color-text)]">
                  Stage
                </p>
                <p className="text-[9px] font-black text-[var(--color-text)]">
                  {stageLabel}
                </p>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${meta.bar}`}
                style={{ width: `${process.completion}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-8">
          <AssigneeStack assignees={process.assignees} />
          <ActionCluster
            targetId={targetId}
            canEdit={canEdit}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ProcessTable({ processes, canEdit, onDelete, isDeleting }) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--color-border)]">
          <thead className="bg-[var(--color-surface-hover)]">
            <tr>
              {["Process", "Status", "Steps", "Assigned", "Progress", "Actions"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-left text-[10px] font-black uppercase text-[var(--color-muted)]"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] bg-white">
            {processes.map((process) => {
              const meta =
                statusMeta[process.status?.toLowerCase()] || statusMeta.draft;
              const StatusIcon = meta.icon;
              const targetId = process.rawId || process.id;

              return (
                <tr key={process.id} className="hover:bg-[var(--color-surface-hover)]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                        <FiLayers size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[var(--color-text)]">
                          {process.name}
                        </p>
                        <p className="truncate text-xs font-medium text-[var(--color-muted)]">
                          {process.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                      <Badge
                        variant={meta.variant}
                        size="sm"
                        className={`rounded px-2.5 py-1 text-[9px] uppercase ${meta.pill}`}
                      >
                        <StatusIcon className="mr-1" size={12} />
                        {meta.label}
                      </Badge>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-[var(--color-muted)]">
                    {process.steps}
                  </td>
                  <td className="px-5 py-4">
                    <AssigneeStack assignees={process.assignees} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="w-32">
                      <div className="mb-1 text-xs font-bold text-[var(--color-text)]">
                        {process.completion}%
                      </div>
                      <div className="h-2 rounded-full bg-[var(--color-bg-soft)]">
                        <div
                          className={`h-full rounded-full ${meta.bar}`}
                          style={{ width: `${process.completion}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <ActionCluster
                      targetId={targetId}
                      canEdit={canEdit}
                      onDelete={() => onDelete(process)}
                      isDeleting={isDeleting}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ActionCluster({ targetId, canEdit, onDelete, isDeleting }) {
  if (!targetId) {
    return <span className="text-xs font-semibold text-red-500">ID missing</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <IconLink href={`/processes/${targetId}`} label="View process" icon={FiEye} />
      {canEdit && (
        <>
          <IconLink
            href={`/processes/${targetId}/edit`}
            label="Edit process"
            icon={FiEdit2}
          />
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="app-focus flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label="Delete process"
            title="Delete process"
          >
            <FiTrash2 size={15} />
          </button>
        </>
      )}
      <FiMoreVertical size={15} className="text-[var(--color-faint)]" />
    </div>
  );
}

function CircularProgress({ value, color }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="4"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-[9px] font-black text-[var(--color-text)]">
        {safeValue}%
      </span>
    </div>
  );
}

function IconLink({ href, label, icon: Icon }) {
  return (
    <Link
      href={href}
      className="app-focus flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary)]"
      aria-label={label}
      title={label}
    >
      <Icon size={15} />
    </Link>
  );
}

function IconToggle({ active, label, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`app-focus flex h-8 w-8 items-center justify-center rounded-md transition ${
        active
          ? "bg-cyan-50 text-cyan-700"
          : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

function AssigneeStack({ assignees = [], max = 3 }) {
  if (!assignees.length) {
    return (
      <span className="flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
        <FiUsers size={14} />
        Unassigned
      </span>
    );
  }

  const visible = assignees.slice(0, max);
  const overflow = assignees.length - max;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((assignee, index) => {
          const name =
            typeof assignee === "string"
              ? "User"
              : assignee.name || assignee.email || "User";

          return (
            <Avatar
              key={assignee._id || assignee.id || `${name}-${index}`}
              name={name}
              src={assignee.profilePicture}
              size="sm"
            />
          );
        })}
      </div>
      {overflow > 0 && (
        <span className="text-xs font-bold text-[var(--color-muted)]">
          +{overflow}
        </span>
      )}
    </div>
  );
}

function ErrorAlert({ message, onDismiss }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div className="flex-1">
        <h3 className="text-sm font-black text-red-900">Error Loading Processes</h3>
        <p className="mt-1 text-sm font-medium text-red-700">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="app-focus rounded-md px-2 text-lg leading-none text-red-500 hover:bg-red-100"
        aria-label="Dismiss error"
      >
        x
      </button>
    </div>
  );
}

function EmptyState({ canEdit, search }) {
  return (
    <Card>
      <CardContent className="flex min-h-[280px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
          <FiLayers size={24} />
        </div>
        <h3 className="text-lg font-black text-[var(--color-text)]">
          No processes found
        </h3>
        <p className="mt-2 max-w-md text-sm font-medium text-[var(--color-muted)]">
          {search
            ? "Try another search term or clear the current filters."
            : canEdit
              ? "Create your first operational workflow to start tracking progress."
              : "No assigned processes are currently available."}
        </p>
        {canEdit && (
          <Link href="/processes/new" className="mt-5">
            <Button icon={FiPlus}>Create New Process</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function DeleteProcessModal({ process, loading, onClose, onConfirm }) {
  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close delete dialog"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-md shadow-[var(--shadow-popover)]">
        <CardContent className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <FiAlertCircle size={26} />
          </div>
          <h2 className="text-xl font-black text-[var(--color-text)]">
            Delete Process?
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-[var(--color-muted)]">
            Are you sure you want to delete{" "}
            <span className="font-bold text-[var(--color-text)]">{process.name}</span>?
            This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={onConfirm}
              loading={loading}
              icon={FiTrash2}
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProcessLoadingState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="mb-4 h-11 w-11 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
      <p className="text-sm font-semibold text-[var(--color-muted)]">
        Loading operational processes...
      </p>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function calculateCompletion(process) {
  const allSteps = process.steps || [];
  if (!allSteps.length) return 0;

  const done = allSteps.filter((step) => step.status === "completed").length;
  return Math.round((done / allSteps.length) * 100);
}

function getNextStep(steps) {
  const nextStep =
    steps.find((step) => step.status !== "completed") || steps[steps.length - 1];

  return nextStep?.title || nextStep?.name || "Final Sign-off";
}
