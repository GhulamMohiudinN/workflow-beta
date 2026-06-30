"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiLayers,
  FiClock,
  FiUser,
  FiEye,
  FiInfo,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiUsers,
  FiCalendar,
  FiX,
  FiCheck,
  FiLoader,
} from "react-icons/fi";
import { processAPI } from "../../../api/processAPI";
import { Card, CardContent } from "../../../../components/Card";
import { Button } from "../../../../components/Button";
import { Badge } from "../../../../components/Badge";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTimeAgo(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatAssignee(assignee) {
  if (!assignee) return "";
  if (typeof assignee === "string") return assignee;
  return assignee.name || assignee.email || "";
}

function calcProgress(steps = []) {
  if (!steps.length) return 0;
  const done = steps.filter((s) => s.status === "completed").length;
  return Math.round((done / steps.length) * 100);
}

// ─── Step status indicator ───────────────────────────────────────────────────

function StepStatusIcon({ status }) {
  if (status === "completed") {
    return (
      <div className="w-7 h-7 rounded-full bg-[var(--color-success)] flex items-center justify-center shrink-0 ring-4 ring-emerald-50">
        <FiCheckCircle className="h-3.5 w-3.5 text-white" />
      </div>
    );
  }
  if (status === "active" || status === "in-progress") {
    return (
      <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0 ring-4 ring-blue-50">
        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-[var(--color-border)] border-2 border-[var(--color-border-strong)] shrink-0" />
  );
}

function stepStatusBadge(status) {
  switch (status) {
    case "completed":  return "bg-emerald-100 text-emerald-800";
    case "active":
    case "in-progress": return "bg-blue-100 text-blue-800";
    case "draft":      return "bg-slate-100 text-slate-600";
    default:           return "bg-slate-100 text-slate-600";
  }
}

// ─── Info row ────────────────────────────────────────────────────────────────

function InfoRow({ label, value, valueClass = "text-[var(--color-text)]" }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-xs font-semibold text-[var(--color-muted)] shrink-0 mr-4">{label}</span>
      <span className={`text-xs font-black ${valueClass} text-right`}>{value || "—"}</span>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function UserProcessDetailPage() {
  const { id } = useParams();
  const [process, setProcess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const loadProcess = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await processAPI.getProcess(id);
      if (result.success) {
        setProcess(result.data);
      } else {
        setError(result.error || "Failed to load process details.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Mark step as completed (SENIOR APPROACH: API call with optimistic UI update) ───
  const handleCompleteStep = async () => {
    if (!selectedStep) return;

    setIsCompleting(true);
    try {
      // Optimistically update UI
      const updatedSteps = process.steps.map((s) =>
        s._id === selectedStep._id ? { ...s, status: "completed" } : s,
      );
      setProcess({ ...process, steps: updatedSteps });

      const result = await processAPI.completeStep(selectedStep._id);

      if (!result.success) {
        throw new Error(result.error || "Failed to complete step");
      }

      // Reload to sync with server
      await loadProcess();
      setSelectedStep(null);
    } catch (err) {
      console.error("Error completing step:", err);
      // Revert optimistic update on error
      await loadProcess();
    } finally {
      setIsCompleting(false);
    }
  };

  useEffect(() => {
    loadProcess();
  }, [id]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-20 h-4 rounded bg-[var(--color-border)]" />
          <div className="flex-1">
            <div className="w-64 h-6 rounded bg-[var(--color-border)] mb-2" />
            <div className="w-80 h-3 rounded bg-[var(--color-border)]" />
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 app-card p-6 space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-[var(--color-border)] shrink-0" />
                <div className="flex-1 rounded-lg p-4 bg-[var(--color-bg-soft)] space-y-2">
                  <div className="w-40 h-3.5 rounded bg-[var(--color-border)]" />
                  <div className="w-24 h-3 rounded bg-[var(--color-border)]" />
                </div>
              </div>
            ))}
          </div>
          <div className="app-card p-6 h-56" />
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
            <FiAlertCircle className="h-12 w-12 text-[var(--color-danger)] mx-auto mb-4" />
            <h2 className="text-lg font-black text-[var(--color-text)] mb-2">Could not load process</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Link href="/users/processesUsers">
                <Button variant="outline" icon={FiArrowLeft}>Go Back</Button>
              </Link>
              <Button onClick={loadProcess} icon={FiRefreshCw}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!process) return null;

  const steps = process.steps || [];
  const progress = calcProgress(steps);
  const assigneeNames = (process.assignedTo || [])
    .map((a) => (typeof a === "string" ? a : a?.name || a?.email || ""))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/users/processesUsers"
          className="flex items-center gap-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] text-sm font-semibold mt-1 shrink-0 transition-colors"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-[var(--color-text)] leading-tight">
            {process.name}
          </h1>
          {process.description && (
            <p className="text-[var(--color-muted)] mt-1 text-sm font-medium">{process.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`text-xs px-3 py-1 rounded-full font-bold ${
              process.status === "completed" ? "bg-emerald-100 text-emerald-800"
              : process.status === "active"  ? "bg-blue-100 text-blue-800"
              : "bg-slate-100 text-slate-600"
            }`}>
              {process.status || "active"}
            </span>
            {process.category && (
              <span className="text-xs px-3 py-1 rounded-full bg-[var(--color-bg-soft)] text-[var(--color-muted)] font-bold">
                {process.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 py-3">
        <FiEye className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
        <p className="text-sm font-semibold text-[var(--color-muted)]">
          View-only mode — you can see all process details but cannot make changes.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Steps timeline */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-[var(--color-text)]">Process Steps</h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {steps.filter((s) => s.status === "completed").length} of {steps.length} completed
                </p>
              </div>
              {steps.length > 0 && (
                <span className="text-sm font-black text-[var(--color-primary)]">{progress}%</span>
              )}
            </div>

            <CardContent>
              {steps.length === 0 ? (
                <div className="text-center py-10 text-[var(--color-faint)]">
                  <FiLayers className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No steps defined yet.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[var(--color-border)]" />
                  <div className="space-y-4">
                    {steps.map((step, idx) => {
                      const stepOrder = step.order ?? idx + 1;
                      const assignee  = formatAssignee(step.assignee);
                      return (
                        <div
                          key={step._id || idx}
                          className="relative flex gap-4 cursor-pointer group"
                          onClick={() => setSelectedStep(step)}
                        >
                          <div className="relative z-10 mt-0.5">
                            <StepStatusIcon status={step.status} />
                          </div>
                          <div className={`flex-1 rounded-lg p-4 border transition-all group-hover:border-[var(--color-primary)] group-hover:shadow-sm ${
                            step.status === "completed"
                              ? "bg-emerald-50 border-emerald-100"
                              : step.status === "active" || step.status === "in-progress"
                                ? "bg-blue-50 border-blue-100"
                                : "bg-[var(--color-bg-soft)] border-[var(--color-border)]"
                          }`}>
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <span className="text-[9px] font-black text-[var(--color-faint)] uppercase tracking-wide">Step {stepOrder}</span>
                                <h3 className="font-black text-sm text-[var(--color-text)] mt-0.5">{step.title}</h3>
                                {step.description && (
                                  <p className="text-xs text-[var(--color-muted)] mt-1">{step.description}</p>
                                )}
                              </div>
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0 ${stepStatusBadge(step.status)}`}>
                                {step.status || "pending"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[var(--color-muted)]">
                              {assignee && (
                                <span className="flex items-center gap-1.5"><FiUser className="h-3.5 w-3.5" />{assignee}</span>
                              )}
                              {step.timeEstimate && (
                                <span className="flex items-center gap-1.5"><FiClock className="h-3.5 w-3.5" />{step.timeEstimate}</span>
                              )}
                            </div>
                            {step.notes && (
                              <p className="mt-2 text-[10px] text-[var(--color-faint)] italic border-t border-[var(--color-border)] pt-2">
                                Note: {step.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Info panel */}
        <div className="space-y-5">
          {/* Progress */}
          {steps.length > 0 && (
            <Card>
              <CardContent>
                <h3 className="text-sm font-black text-[var(--color-text)] mb-4">Overall Progress</h3>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[var(--color-muted)] font-semibold">Completion</span>
                  <span className="font-black text-[var(--color-text)]">{progress}%</span>
                </div>
                <div className="h-2.5 bg-[var(--color-bg-soft)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? "bg-[var(--color-success)]" : "bg-[var(--color-primary)]"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--color-faint)] mt-2 text-right">
                  {steps.filter((s) => s.status === "completed").length} / {steps.length} steps done
                </p>
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardContent>
              <h3 className="text-sm font-black text-[var(--color-text)] mb-3 flex items-center gap-2">
                <FiInfo className="h-4 w-4 text-[var(--color-primary)]" />
                Process Details
              </h3>
              <div className="space-y-0.5">
                <InfoRow label="Status"       value={process.status}       valueClass={process.status === "completed" ? "text-[var(--color-success)]" : process.status === "active" ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"} />
                <InfoRow label="Category"     value={process.category} />
                <InfoRow label="Visibility"   value={process.visibility} />
                <InfoRow label="Last Updated" value={formatTimeAgo(process.updatedAt)} />
                <InfoRow label="Created"      value={formatDate(process.createdAt)} />
                {assigneeNames.length > 0 && <InfoRow label="Assigned To" value={assigneeNames.join(", ")} />}
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-[var(--color-warning)]">
                  <FiAlertCircle size={15} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[var(--color-text)]">Need Help?</h4>
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    Contact your process owner or workspace admin for assistance with this workflow.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Step Detail Modal */}
      {selectedStep && (
        <StepDetailModal
          step={selectedStep}
          isCompleting={isCompleting}
          onClose={() => setSelectedStep(null)}
          onComplete={handleCompleteStep}
        />
      )}
    </div>
  );
}

// ─── Step Detail Modal ───────────────────────────────────────────────────────

function StepDetailModal({ step, isCompleting, onClose, onComplete }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-popover)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-primary)]">
                <FiLayers className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-[var(--color-text)]">Step Details</h2>
            </div>
            <button
              onClick={onClose}
              className="app-focus flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-[10px] font-black text-[var(--color-faint)] uppercase tracking-wide mb-1">Step Title</p>
              <p className="text-sm font-black text-[var(--color-text)]">{step.title}</p>
            </div>

            {step.description && (
              <div>
                <p className="text-[10px] font-black text-[var(--color-faint)] uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed">{step.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {formatAssignee(step.assignee) && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-[10px] font-black text-[var(--color-faint)] uppercase tracking-wide mb-1">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <FiUser className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                    <p className="text-xs font-black text-[var(--color-text)] truncate">{formatAssignee(step.assignee)}</p>
                  </div>
                </div>
              )}
              {step.timeEstimate && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-[10px] font-black text-[var(--color-faint)] uppercase tracking-wide mb-1">Time Estimate</p>
                  <div className="flex items-center gap-2">
                    <FiClock className="w-3.5 h-3.5 text-[var(--color-warning)] shrink-0" />
                    <p className="text-xs font-black text-[var(--color-text)]">{step.timeEstimate}</p>
                  </div>
                </div>
              )}
            </div>

            {step.notes && (
              <div className="p-3 bg-[var(--color-bg-soft)] border border-[var(--color-border)] rounded-lg">
                <p className="text-[10px] font-black text-[var(--color-faint)] uppercase tracking-wide mb-1">Notes</p>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">{step.notes}</p>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-[var(--color-bg-soft)] border border-[var(--color-border)] rounded-lg">
              <FiInfo className="w-4 h-4 text-[var(--color-muted)] shrink-0" />
              <p className="text-xs text-[var(--color-muted)] font-semibold">
                Current Status: <span className="font-black text-[var(--color-text)] capitalize">{step.status}</span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-hover)]">
            <button
              onClick={onClose}
              disabled={isCompleting}
              className="px-4 py-2 text-sm font-semibold text-[var(--color-muted)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg)] disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onComplete}
              disabled={isCompleting || step.status === "completed"}
              className="px-5 py-2 text-sm font-black text-white bg-[var(--color-success)] hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 transition-all"
            >
              {isCompleting ? (
                <><FiLoader className="w-4 h-4 animate-spin" />Completing...</>
              ) : step.status === "completed" ? (
                <><FiCheck className="w-4 h-4" />Completed</>
              ) : (
                <><FiCheck className="w-4 h-4" />Mark Complete</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
