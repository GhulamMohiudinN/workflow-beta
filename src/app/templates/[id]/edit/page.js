"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { templateAPI } from "../../../api/templateAPI";
import {
  FiArrowLeft,
  FiSave,
  FiPlus,
  FiTrash2,
  FiSettings,
  FiLayers,
  FiChevronUp,
  FiChevronDown,
  FiAlertCircle,
  FiCheck,
} from "react-icons/fi";

const CATEGORIES = [
  "Onboarding", "HR", "Finance", "IT", "Marketing",
  "Sales", "Operations", "Customer Support", "Legal",
];

// ─── Shared field styles (matches the rest of the dashboard) ─────────────────
const fieldClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100 placeholder:text-[var(--color-faint)]";

const labelClass =
  "mb-1.5 block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide";

export default function EditTemplatePage() {
  const { id } = useParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    status: "draft",
    steps: [],
  });

  useEffect(() => {
    if (!id) return;
    const fetchTemplate = async () => {
      try {
        setIsLoading(true);
        const result = await templateAPI.getTemplate(id);
        if (result.success) {
          const t = result.data;
          setFormData({
            name:        t.name        || "",
            description: t.description || "",
            category:    t.category    || "",
            status:      t.status      || "draft",
            steps: (t.steps || []).map((s, i) => ({
              ...s,
              id:    Math.random().toString(36).substr(2, 9),
              order: s.sequence || s.order || i + 1,
            })),
          });
        } else {
          setError(result.error || "Failed to load template");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  const handleInputChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleStepChange = (index, field, value) => {
    const steps = [...formData.steps];
    steps[index] = { ...steps[index], [field]: value };
    setFormData((prev) => ({ ...prev, steps }));
  };

  const addStep = () =>
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          id:           Math.random().toString(36).substr(2, 9),
          title:        "",
          description:  "",
          timeEstimate: "1d",
          order:        prev.steps.length + 1,
        },
      ],
    }));

  const removeStep = (index) => {
    const steps = formData.steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, order: i + 1 }));
    setFormData((prev) => ({ ...prev, steps }));
  };

  const moveStep = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === formData.steps.length - 1) return;
    const steps = [...formData.steps];
    const target = index + direction;
    [steps[index], steps[target]] = [steps[target], steps[index]];
    steps.forEach((s, i) => (s.order = i + 1));
    setFormData((prev) => ({ ...prev, steps }));
  };

  const handleSave = async () => {
    if (!formData.name)     { setError("Template name is required"); return; }
    if (!formData.category) { setError("Category is required");      return; }
    if (formData.steps.some((s) => !s.title)) {
      setError("All steps must have a title");
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await templateAPI.updateTemplate(id, formData);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push(`/templates/${id}`), 1200);
      } else {
        setError(result.error || "Failed to update template");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-100 border-t-[var(--color-primary)]" />
          <p className="text-sm font-semibold text-[var(--color-muted)]">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-4 min-h-[calc(100vh-9rem)] bg-gradient-to-br from-slate-50 via-cyan-50 to-emerald-50 p-4 sm:-m-6 sm:p-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/templates/${id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors mb-2"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Template
          </Link>
          <h1 className="text-2xl font-black text-[var(--color-text)]">Edit Template</h1>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-white text-sm font-bold rounded-lg shadow-md shadow-blue-600/20 hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            : <FiSave className="h-4 w-4" />
          }
          Save Changes
        </button>
      </div>

      {/* ── Alerts ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
          <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 mb-6">
          <FiCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-700">Template updated successfully! Redirecting…</p>
        </div>
      )}

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Left: Basic Details */}
        <div className="md:col-span-1">
          <div className="bg-white/90 rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)]">
            <div className="px-6 py-4 border-b border-[var(--color-border)]">
              <h2 className="flex items-center gap-2 text-sm font-black text-[var(--color-text)]">
                <FiSettings className="h-4 w-4 text-[var(--color-primary)]" />
                Basic Details
              </h2>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className={labelClass}>Template Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={fieldClass}
                  placeholder="e.g. Q4 Onboarding"
                />
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className={fieldClass}
                >
                  <option value="draft">Draft (Hidden from Library)</option>
                  <option value="active">Active (Available to use)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  className={`${fieldClass} resize-none`}
                  placeholder="Describe the purpose of this template…"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Predefined Steps */}
        <div className="md:col-span-2">
          <div className="bg-white/90 rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)]">
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black text-[var(--color-text)]">
                <FiLayers className="h-4 w-4 text-[var(--color-secondary)]" />
                Predefined Steps
              </h2>
              <button
                onClick={addStep}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <FiPlus className="h-3.5 w-3.5" />
                Add Step
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formData.steps.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-muted)]">
                  <FiLayers className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No steps defined yet</p>
                  <p className="text-xs mt-1">Click &quot;Add Step&quot; to get started</p>
                </div>
              )}

              {formData.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] hover:border-cyan-200 transition-colors"
                >
                  {/* Order column */}
                  <div className="flex flex-col items-center gap-1.5 pr-4 border-r border-[var(--color-border)]">
                    <button
                      onClick={() => moveStep(index, -1)}
                      disabled={index === 0}
                      className="text-[var(--color-faint)] hover:text-[var(--color-primary)] disabled:opacity-30 transition-colors"
                      aria-label="Move step up"
                    >
                      <FiChevronUp size={18} />
                    </button>
                    <div className="w-8 h-8 rounded-full border-2 border-cyan-200 bg-white flex items-center justify-center text-xs font-black text-cyan-700">
                      {step.order}
                    </div>
                    <button
                      onClick={() => moveStep(index, 1)}
                      disabled={index === formData.steps.length - 1}
                      className="text-[var(--color-faint)] hover:text-[var(--color-primary)] disabled:opacity-30 transition-colors"
                      aria-label="Move step down"
                    >
                      <FiChevronDown size={18} />
                    </button>
                  </div>

                  {/* Fields */}
                  <div className="flex-1 space-y-2.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Step title *"
                        value={step.title}
                        onChange={(e) => handleStepChange(index, "title", e.target.value)}
                        className={`${fieldClass} flex-1`}
                      />
                      <input
                        type="text"
                        placeholder="e.g. 2 hours"
                        value={step.timeEstimate}
                        onChange={(e) => handleStepChange(index, "timeEstimate", e.target.value)}
                        className={`${fieldClass} w-32`}
                      />
                      <button
                        onClick={() => removeStep(index)}
                        className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        aria-label="Remove step"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                    <textarea
                      placeholder="Step description…"
                      value={step.description}
                      onChange={(e) => handleStepChange(index, "description", e.target.value)}
                      rows={2}
                      className={`${fieldClass} resize-none`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
