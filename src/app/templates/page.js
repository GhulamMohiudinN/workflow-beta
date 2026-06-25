"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiAlertCircle,
  FiBarChart2,
  FiCheckCircle,
  FiCopy,
  FiEdit2,
  FiEye,
  FiFilter,
  FiGrid,
  FiLayers,
  FiList,
  FiPlus,
  FiSearch,
  FiShield,
  FiTrash2,
  FiTrendingUp,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { templateAPI } from "../api/templateAPI";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card, CardContent } from "../../components/Card";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const CATEGORY_TABS = [
  { value: "all", label: "All Templates" },
  { value: "Onboarding", label: "Onboarding" },
  { value: "HR", label: "HR" },
  { value: "Finance", label: "Finance" },
  { value: "IT", label: "IT" },
  { value: "Operations", label: "Operations" },
  { value: "Legal", label: "Legal" },
];

const statusMeta = {
  active: {
    label: "Active",
    variant: "success",
    className: "bg-emerald-100 text-emerald-700",
  },
  draft: {
    label: "Draft",
    variant: "outline",
    className: "bg-slate-100 text-slate-700",
  },
  archived: {
    label: "Archived",
    variant: "outline",
    className: "bg-slate-100 text-slate-700",
  },
};

const categoryMeta = {
  Onboarding: {
    icon: FiUserPlus,
    tone: "bg-cyan-50 text-cyan-700",
    rail: "bg-cyan-500",
  },
  HR: {
    icon: FiUsers,
    tone: "bg-violet-50 text-violet-600",
    rail: "bg-violet-500",
  },
  Finance: {
    icon: FiBarChart2,
    tone: "bg-emerald-50 text-emerald-700",
    rail: "bg-emerald-500",
  },
  IT: {
    icon: FiCopy,
    tone: "bg-sky-50 text-sky-700",
    rail: "bg-sky-500",
  },
  Marketing: {
    icon: FiTrendingUp,
    tone: "bg-rose-50 text-rose-600",
    rail: "bg-rose-500",
  },
  Sales: {
    icon: FiTrendingUp,
    tone: "bg-indigo-50 text-indigo-600",
    rail: "bg-indigo-500",
  },
  Operations: {
    icon: FiLayers,
    tone: "bg-teal-50 text-teal-700",
    rail: "bg-teal-500",
  },
  "Customer Support": {
    icon: FiUsers,
    tone: "bg-red-50 text-red-600",
    rail: "bg-red-500",
  },
  Legal: {
    icon: FiShield,
    tone: "bg-slate-100 text-slate-700",
    rail: "bg-slate-500",
  },
};

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await templateAPI.listTemplates({
          search,
          status: statusFilter,
          limit: 100,
        });

        if (!result.success) {
          setError(result.error || "Failed to load templates");
          setTemplates([]);
          return;
        }

        setAnalytics((previous) => ({
          ...previous,
          total: result.total ?? result.data?.length ?? 0,
        }));

        setTemplates(
          (result.data || []).map((template, index) => ({
            id: template._id ?? template.id ?? String(index + 1),
            rawId: template._id || template.id,
            name: template.name || "Untitled template",
            description: template.description || "No template description yet.",
            category: template.category || "Operations",
            steps: (template.steps || []).length,
            status: template.status || "draft",
            lastUpdated: formatDate(template.updatedAt),
            createdBy: template.createdBy || null,
          })),
        );
      } catch (err) {
        console.error("Unexpected error fetching templates:", err);
        setError("An unexpected error occurred. Please refresh the page.");
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [search, statusFilter]);

  const filteredTemplates = useMemo(() => {
    const query = search.toLowerCase();

    return templates.filter((template) => {
      const matchesStatus =
        statusFilter === "all" ||
        template.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesCategory =
        categoryFilter === "all" || template.category === categoryFilter;
      const matchesSearch =
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query);

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [categoryFilter, search, statusFilter, templates]);

  const metrics = useMemo(() => {
    const activeCount = templates.filter((template) =>
      ["active", "draft"].includes(template.status),
    ).length;
    const totalSteps = templates.reduce((total, template) => total + template.steps, 0);
    const categories = new Set(templates.map((template) => template.category)).size;

    return [
      {
        title: "Total Templates",
        value: analytics?.total ?? templates.length,
        detail: "Reusable workflows",
        icon: FiCopy,
        tone: "cyan",
      },
      {
        title: "Active Library",
        value: activeCount,
        detail: "Ready to launch",
        icon: FiCheckCircle,
        tone: "emerald",
      },
      {
        title: "Standard Steps",
        value: totalSteps,
        detail: "Across templates",
        icon: FiLayers,
        tone: "teal",
      },
      {
        title: "Categories",
        value: categories,
        detail: "Workflow families",
        icon: FiBarChart2,
        tone: "slate",
      },
    ];
  }, [analytics, templates]);

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    const targetId = deleteConfirm.rawId || deleteConfirm.id;
    const result = await templateAPI.deleteTemplate(targetId);

    if (result.success) {
      setTemplates((current) =>
        current.filter((template) => (template.rawId || template.id) !== targetId),
      );
      setDeleteConfirm(null);
    } else {
      setError(result.error || "Failed to delete template");
    }

    setIsDeleting(false);
  };

  if (isLoading) {
    return <TemplatesLoadingState />;
  }

  return (
    <div className="-m-4 min-h-[calc(100vh-9rem)] space-y-6 bg-linear-to-br from-slate-50 via-cyan-50 to-emerald-50 p-4 sm:-m-6 sm:p-6">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)]">
            Process Templates
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
            Accelerate the team with reusable workflow structures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/processes/new">
            <Button variant="outline" icon={FiPlus}>
              New Blank Process
            </Button>
          </Link>
          <Link href="/processes/new">
            <Button icon={FiCopy}>Create from Template</Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-cyan-100 pb-1">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setCategoryFilter(tab.value)}
            className={`shrink-0 border-b-2 px-3 py-2 text-xs font-black transition ${
              categoryFilter === tab.value
                ? "border-cyan-700 text-cyan-800"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
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
              placeholder="Search templates..."
              className="app-focus h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)]">
              <FiFilter size={16} />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
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

      {filteredTemplates.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={() => setDeleteConfirm(template)}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      {filteredTemplates.length > 0 && viewMode === "list" && (
        <TemplateTable
          templates={filteredTemplates}
          onDelete={setDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}

      {filteredTemplates.length === 0 && (
        <EmptyState search={search} categoryFilter={categoryFilter} />
      )}

      {deleteConfirm && (
        <DeleteTemplateModal
          template={deleteConfirm}
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
    slate: "bg-slate-100 text-slate-700",
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

function TemplateCard({ template, onDelete, isDeleting }) {
  const category = categoryMeta[template.category] || categoryMeta.Operations;
  const CategoryIcon = category.icon;
  const status = statusMeta[template.status?.toLowerCase()] || statusMeta.draft;
  const targetId = template.rawId || template.id;

  return (
    <Card hover className="min-h-[300px] border-white/70 bg-white/90 shadow-[0_18px_45px_rgba(15,118,110,0.08)]">
      <CardContent className="flex h-full flex-col px-6 py-6">
        <div className="mb-7 flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${category.tone}`}>
            <CategoryIcon size={19} />
          </div>
          <Badge
            variant={status.variant}
            size="sm"
            className={`rounded px-2.5 py-1 text-[9px] uppercase ${status.className}`}
          >
            {status.label}
          </Badge>
        </div>

        <div className="min-h-[72px]">
          <h2 className="line-clamp-1 text-sm font-semibold text-[var(--color-text)]">
            {template.name}
          </h2>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-[var(--color-muted)]">
            {template.description}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <TemplateStat icon={FiLayers} value={`${template.steps} Steps`} />
          <TemplateStat icon={FiEye} value={template.lastUpdated} />
        </div>

        <div className="mt-auto flex items-center justify-between pt-6">
          <span className="rounded bg-cyan-50 px-2 py-1 text-[10px] font-bold uppercase text-cyan-700">
            {template.category}
          </span>
          <ActionCluster
            targetId={targetId}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateStat({ icon: Icon, value }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
      <Icon className="h-3.5 w-3.5 text-cyan-700" />
      <span className="truncate">{value}</span>
    </div>
  );
}

function TemplateTable({ templates, onDelete, isDeleting }) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--color-border)]">
          <thead className="bg-[var(--color-surface-hover)]">
            <tr>
              {["Template", "Category", "Status", "Steps", "Updated", "Actions"].map(
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
            {templates.map((template) => {
              const category =
                categoryMeta[template.category] || categoryMeta.Operations;
              const CategoryIcon = category.icon;
              const status =
                statusMeta[template.status?.toLowerCase()] || statusMeta.draft;
              const targetId = template.rawId || template.id;

              return (
                <tr key={template.id} className="hover:bg-[var(--color-surface-hover)]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.tone}`}>
                        <CategoryIcon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[var(--color-text)]">
                          {template.name}
                        </p>
                        <p className="truncate text-xs font-medium text-[var(--color-muted)]">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-[var(--color-muted)]">
                    {template.category}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant={status.variant}
                      size="sm"
                      className={`rounded px-2.5 py-1 text-[9px] uppercase ${status.className}`}
                    >
                      {status.label}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-[var(--color-muted)]">
                    {template.steps}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-[var(--color-muted)]">
                    {template.lastUpdated}
                  </td>
                  <td className="px-5 py-4">
                    <ActionCluster
                      targetId={targetId}
                      onDelete={() => onDelete(template)}
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

function ActionCluster({ targetId, onDelete, isDeleting }) {
  if (!targetId) {
    return <span className="text-xs font-semibold text-red-500">ID missing</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <IconLink href={`/templates/${targetId}`} label="View template" icon={FiEye} />
      <IconLink
        href={`/templates/${targetId}/edit`}
        label="Edit template"
        icon={FiEdit2}
      />
      <IconLink
        href={`/processes/new?templateId=${targetId}`}
        label="Use template"
        icon={FiPlus}
      />
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        className="app-focus flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        aria-label="Delete template"
        title="Delete template"
      >
        <FiTrash2 size={15} />
      </button>
    </div>
  );
}

function IconLink({ href, label, icon: Icon }) {
  return (
    <Link
      href={href}
      className="app-focus flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-cyan-50 hover:text-cyan-700"
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

function EmptyState({ search, categoryFilter }) {
  return (
    <Card>
      <CardContent className="flex min-h-[280px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
          <FiCopy size={24} />
        </div>
        <h3 className="text-lg font-black text-[var(--color-text)]">
          No templates found
        </h3>
        <p className="mt-2 max-w-md text-sm font-medium text-[var(--color-muted)]">
          {search || categoryFilter !== "all"
            ? "Try another search term or clear the current filters."
            : "Create a process and save it as a template to build your library."}
        </p>
        <Link href="/processes/new" className="mt-5">
          <Button icon={FiPlus}>Create Process</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ErrorAlert({ message, onDismiss }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div className="flex-1">
        <h3 className="text-sm font-black text-red-900">Error Loading Templates</h3>
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

function DeleteTemplateModal({ template, loading, onClose, onConfirm }) {
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
            Delete Template?
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-[var(--color-muted)]">
            Are you sure you want to delete{" "}
            <span className="font-bold text-[var(--color-text)]">{template.name}</span>?
            Processes already created from it will not be affected.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
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

function TemplatesLoadingState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="mb-4 h-11 w-11 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
      <p className="text-sm font-semibold text-[var(--color-muted)]">
        Loading process templates...
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
