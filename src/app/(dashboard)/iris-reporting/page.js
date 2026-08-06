"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiChevronDown,
  FiChevronUp, FiClock, FiDatabase, FiDownload, FiEdit2,
  FiFileText, FiMessageSquare, FiPlus, FiRefreshCw,
  FiSend, FiShield, FiTrash2, FiUploadCloud, FiUser, FiX,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { irisReportingAPI } from "../../api/irisReportingAPI";

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = ["Dashboard", "Obligations", "Approvals", "Report Pack"];

const STATUS_META = {
  planned:     { label: "Planned",     color: "bg-slate-100 text-slate-600",     dot: "bg-slate-400"    },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"    },
  completed:   { label: "Completed",   color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500"  },
  blocked:     { label: "Blocked",     color: "bg-red-100 text-red-700",         dot: "bg-red-500"      },
};

const APPROVAL_META = {
  pending:      { label: "Pending",      color: "text-amber-700 bg-amber-50 border-amber-200"       },
  approved:     { label: "Approved",     color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  rejected:     { label: "Rejected",     color: "text-red-700 bg-red-50 border-red-200"             },
  not_required: { label: "Not Required", color: "text-slate-600 bg-slate-50 border-slate-200"       },
};

const MAT_COLOR = {
  Low:      "bg-slate-100 text-slate-600",
  Standard: "bg-blue-100 text-blue-700",
  Medium:   "bg-amber-100 text-amber-700",
  High:     "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

const EMPTY_FORM = {
  title: "", source: "", legislationRef: "", category: "Reporting",
  obligationType: "reporting", status: "planned", dueDate: "",
  owner: "", reportType: "Statutory report", materiality: "Standard",
  approvalRequired: false, evidenceRequired: [""], details: "",
  legislationVersion: "", ruleVersion: "1.0", reportingPeriod: "",
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.planned;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${m.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function ApprovalBadge({ status }) {
  const m = APPROVAL_META[status] || APPROVAL_META.not_required;
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${m.color}`}>{m.label}</span>;
}

function MatBadge({ value }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${MAT_COLOR[value] || MAT_COLOR.Standard}`}>{value}</span>;
}

function StatCard({ label, value, sub, icon: Icon, tone }) {
  const tones = {
    blue:    { bg: "bg-blue-50",    text: "text-blue-700"    },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700" },
    amber:   { bg: "bg-amber-50",   text: "text-amber-700"   },
    red:     { bg: "bg-red-50",     text: "text-red-700"     },
    slate:   { bg: "bg-slate-50",   text: "text-slate-700"   },
  };
  const t = tones[tone] || tones.slate;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-black ${t.text}`}>{value ?? "—"}</p>
          {sub && <p className="mt-1 text-xs font-medium text-slate-400">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${t.bg}`}><Icon size={16} className={t.text} /></div>
      </div>
    </div>
  );
}

function ProgressBar({ value, color = "bg-blue-600" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function Tab({ label, active, onClick, count }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all whitespace-nowrap ${
        active ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-900"
      }`}>
      {label}
      {count !== undefined && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{count}</span>
      )}
    </button>
  );
}

// ─── Obligation Form ──────────────────────────────────────────────────────────
function ObligationForm({ form, setForm, onSubmit, saving, onCancel, editId, pendingFiles, setPendingFiles, legislationLibrary }) {
  const dropRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [legSearch, setLegSearch] = useState("");
  const [showLegDropdown, setShowLegDropdown] = useState(false);
  const legRef = useRef(null);

  // Filter library by search term
  const filteredLib = useMemo(() => {
    if (!legSearch.trim()) return legislationLibrary;
    const q = legSearch.toLowerCase();
    return legislationLibrary.filter(
      (l) => l.ref.toLowerCase().includes(q) || l.title.toLowerCase().includes(q) || l.source.toLowerCase().includes(q)
    );
  }, [legSearch, legislationLibrary]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (legRef.current && !legRef.current.contains(e.target)) setShowLegDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectLegRef = (item) => {
    setForm({
      ...form,
      legislationRef:   item.ref,
      source:           item.source,
      category:         item.category,
      obligationType:   item.obligationType,
      materiality:      item.defaultMateriality,
      // Auto-require approval for Critical/High
      approvalRequired: ["Critical", "High"].includes(item.defaultMateriality) ? true : form.approvalRequired,
    });
    setLegSearch(item.ref);
    setShowLegDropdown(false);
  };

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList).filter((f) => f.size <= 10 * 1024 * 1024);
    const oversize = Array.from(fileList).length - incoming.length;
    if (oversize > 0) toast.error(`${oversize} file(s) skipped — max 10 MB each`);
    setPendingFiles((prev) => {
      // Deduplicate by name+size
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`));
      return [...prev, ...incoming.filter((f) => !existing.has(`${f.name}-${f.size}`))];
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900">{editId ? "Edit Obligation" : "New Obligation"}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Capture the reporting requirement, source legislation, owner and evidence needs.</p>
        </div>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600"><FiX size={18} /></button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Obligation Title *</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Annual Financial Statements — FMA s.51"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Source Legislation</label>
          <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
            placeholder="e.g. Financial Management Act 1994 (Vic)"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Legislation Reference</label>
          {/* Searchable dropdown from the pre-loaded FMA / SD / AASB library */}
          <div className="relative" ref={legRef}>
            <input
              value={legSearch || form.legislationRef}
              onChange={(e) => { setLegSearch(e.target.value); setShowLegDropdown(true); setForm({ ...form, legislationRef: e.target.value }); }}
              onFocus={() => setShowLegDropdown(true)}
              placeholder="Search or type (e.g. SD 4.2.1, FMA s.51)"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
            {showLegDropdown && filteredLib.length > 0 && (
              <div className="absolute z-[300] left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                {filteredLib.slice(0, 20).map((item) => (
                  <button key={item.ref} type="button"
                    onClick={() => selectLegRef(item)}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0">
                    <span className="text-xs font-black text-blue-700 block">{item.ref}</span>
                    <span className="text-[11px] text-slate-600 truncate block">{item.title}</span>
                    <span className="text-[10px] text-slate-400">{item.source}</span>
                  </button>
                ))}
                {filteredLib.length === 0 && (
                  <p className="px-3 py-3 text-xs text-slate-400 italic">No matches — type your own reference</p>
                )}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 outline-none">
            {["Reporting","Legislation","Policy","Accounting standard","Compliance","Other"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Obligation Type</label>
          <select value={form.obligationType} onChange={(e) => setForm({ ...form, obligationType: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 outline-none">
            {["statutory_reporting","compliance_review","disclosure_pack","audit_evidence","reporting","approval","other"].map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Owner</label>
          <input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}
            placeholder="e.g. Chief Finance Officer"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Due Date</label>
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 outline-none">
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Materiality</label>
          <select value={form.materiality} onChange={(e) => setForm({ ...form, materiality: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 outline-none">
            {["Low","Standard","Medium","High","Critical"].map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Report Type</label>
          <input value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value })}
            placeholder="e.g. Financial statements"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Reporting Period</label>
          <input value={form.reportingPeriod} onChange={(e) => setForm({ ...form, reportingPeriod: e.target.value })}
            placeholder="e.g. FY2025-26"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Legislation Version</label>
          <input value={form.legislationVersion} onChange={(e) => setForm({ ...form, legislationVersion: e.target.value })}
            placeholder="e.g. FMA 1994 — 2018 Amendment"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 outline-none" />
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
          <input type="checkbox" id="approvalRequired" checked={form.approvalRequired}
            onChange={(e) => setForm({ ...form, approvalRequired: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-blue-700" />
          <label htmlFor="approvalRequired" className="text-sm font-medium text-slate-700">Approval workflow required</label>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">Details / Context</label>
        <textarea value={form.details} rows={3} onChange={(e) => setForm({ ...form, details: e.target.value })}
          placeholder="Describe the obligation, specific requirements and context..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 outline-none resize-none" />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600 mb-2 block">Evidence Requirements</label>
        <div className="space-y-2">
          {form.evidenceRequired.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input value={item}
                onChange={(e) => { const n = [...form.evidenceRequired]; n[i] = e.target.value; setForm({ ...form, evidenceRequired: n }); }}
                placeholder={`Evidence item ${i + 1}`}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 outline-none" />
              <button type="button"
                onClick={() => { const n = form.evidenceRequired.filter((_, idx) => idx !== i); setForm({ ...form, evidenceRequired: n.length ? n : [""] }); }}
                className="rounded-lg border border-slate-200 bg-white px-3 text-sm text-red-500 hover:bg-red-50">
                <FiX size={14} />
              </button>
            </div>
          ))}
        </div>
        <button type="button"
          onClick={() => setForm({ ...form, evidenceRequired: [...form.evidenceRequired, ""] })}
          className="mt-2 flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900">
          <FiPlus size={12} /> Add evidence item
        </button>
      </div>

      {/* ── Document Upload Section ──────────────────────────────────────── */}
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-2 block">
          Attach Supporting Documents
          <span className="ml-2 font-normal text-slate-400">(PDF, Word, Excel, Images, ZIP — max 10 MB each)</span>
        </label>

        {/* Drop zone */}
        <div
          ref={dropRef}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed transition-colors ${
            dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/40"
          }`}
        >
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 py-6 px-4 text-center">
            <FiUploadCloud size={28} className={dragging ? "text-blue-600" : "text-slate-400"} />
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {dragging ? "Drop files here" : "Drag & drop files, or click to browse"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">All files will be uploaded when you save the obligation</p>
            </div>
            <input
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.csv"
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
            />
          </label>
        </div>

        {/* Pending file list */}
        {pendingFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-bold text-slate-500">{pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""} queued for upload</p>
            {pendingFiles.map((file, idx) => {
              const ext = file.name.split(".").pop()?.toLowerCase();
              const iconColor =
                ext === "pdf" ? "text-red-500" :
                ["doc","docx"].includes(ext) ? "text-blue-600" :
                ["xls","xlsx"].includes(ext) ? "text-emerald-600" :
                ["png","jpg","jpeg"].includes(ext) ? "text-violet-500" : "text-slate-400";
              return (
                <div key={`${file.name}-${idx}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FiFileText size={14} className={`${iconColor} shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                      <p className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button type="button"
                    onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="ml-2 shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <FiX size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
        <button type="submit" disabled={saving}
          className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : editId ? "Update Obligation" : "Create Obligation"}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Obligation Card ──────────────────────────────────────────────────────────
function ObligationCard({
  item, onEdit, onDelete, onUpload, onDeleteFile, onDownload,
  uploading, onApproveStep, onAddComment, onDeleteComment,
}) {
  const [expanded,      setExpanded]      = useState(false);
  const [activeSection, setActiveSection] = useState("evidence"); // evidence | comments | approval
  const [commentText,   setCommentText]   = useState("");
  const [submitting,    setSubmitting]    = useState(false);

  const overdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "completed";
  // Unique ID for the hidden file input — avoids ref issues on re-render
  const inputId = `file-upload-${item._id}`;

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    await onAddComment(item._id, commentText.trim());
    setCommentText("");
    setSubmitting(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Capture the input ref BEFORE any async work so we can reset it after
    const input = e.target;
    await onUpload(item._id, file);
    // Reset input after upload completes — never before — so the File object
    // stays valid for the entire duration of the multipart request.
    input.value = "";
  };

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${overdue ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-white"}`}>

      {/* ── Clickable summary row — click anywhere to expand ─────────────── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 p-5">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <StatusBadge status={item.status} />
              <MatBadge value={item.materiality} />
              {item.approvalRequired && <ApprovalBadge status={item.approvalStatus || "pending"} />}
              {overdue && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">
                  <FiAlertTriangle size={10} /> Overdue
                </span>
              )}
              {(item.evidenceFiles?.length > 0) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
                  <FiFileText size={10} /> {item.evidenceFiles.length} file{item.evidenceFiles.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <h3 className="text-sm font-black text-slate-900 leading-snug">{item.title}</h3>
            {item.legislationRef && (
              <p className="text-xs font-mono text-blue-500 mt-0.5">{item.legislationRef}</p>
            )}
            {!expanded && item.details && (
              <p className="text-xs text-slate-400 mt-1 truncate">{item.details}</p>
            )}
          </div>
          {/* Right: expand indicator + action buttons */}
          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${
              expanded ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-200 hover:text-blue-600"
            }`}
              onClick={() => setExpanded((v) => !v)}>
              {expanded ? <><FiChevronUp size={13} /> Collapse</> : <><FiChevronDown size={13} /> View All</>}
            </span>
            <button onClick={() => onEdit(item)}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit obligation">
              <FiEdit2 size={14} />
            </button>
            <button onClick={() => onDelete(item._id)}
              className="rounded-lg border border-red-100 bg-white p-2 text-red-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete obligation">
              <FiTrash2 size={14} />
            </button>
          </div>
        </div>

        {/* ── Always-visible summary meta strip ─────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pb-4 border-t border-slate-100 pt-3">
          {[
            { label: "Source",   value: item.source || "—" },
            { label: "Owner",    value: item.owner  || "—" },
            { label: "Due Date", value: item.dueDate
                ? new Date(item.dueDate).toLocaleDateString("en-AU", { day:"2-digit", month:"short", year:"numeric" })
                : "Not set", red: overdue },
            { label: "Period",   value: item.reportingPeriod || "—" },
          ].map(({ label, value, red }) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className={`text-xs font-semibold mt-0.5 truncate ${red ? "text-red-600" : "text-slate-700"}`}>{value}</p>
            </div>
          ))}
        </div>
      </button>

      {/* ── Expanded body ────────────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-slate-100">

          {/* Full field grid — ALL obligation fields visible when expanded */}
          <div className="px-5 pt-4 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {[
              { label: "Category",          value: item.category || "—"           },
              { label: "Obligation Type",   value: (item.obligationType || "—").replace(/_/g, " ") },
              { label: "Report Type",       value: item.reportType || "—"         },
              { label: "Legislation Ver.",  value: item.legislationVersion || "—" },
              { label: "Rule Version",      value: item.ruleVersion || "—"        },
              { label: "Approval Required", value: item.approvalRequired ? "Yes" : "No" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 capitalize">{value}</p>
              </div>
            ))}
          </div>

          {/* Details */}
          {item.details && (
            <div className="px-5 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Details / Context</p>
              <p className="text-sm text-slate-600 leading-relaxed">{item.details}</p>
            </div>
          )}

          {/* Required evidence chips */}
          {item.evidenceRequired?.filter(Boolean).length > 0 && (
            <div className="px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Required Evidence</p>
              <div className="flex flex-wrap gap-2">
                {item.evidenceRequired.filter(Boolean).map((ev, i) => (
                  <span key={i} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">{ev}</span>
                ))}
              </div>
            </div>
          )}

          {/* Section switcher */}
          <div className="flex border-t border-slate-100 bg-slate-50">
            {[
              { key: "evidence", label: `Evidence (${item.evidenceFiles?.length || 0})` },
              { key: "comments", label: `Comments (${item.comments?.length || 0})` },
              ...(item.approvalRequired
                ? [{ key: "approval", label: `Approval (${item.approvalSteps?.length || 0})` }]
                : []),
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveSection(key)}
                className={`px-4 py-2.5 text-xs font-bold transition-colors ${
                  activeSection === key
                    ? "border-b-2 border-blue-700 text-blue-700 bg-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── Evidence Files section ───────────────────────────────────── */}
          {activeSection === "evidence" && (
            <div className="px-5 py-4">
              {/* Upload button — uses label+id, never .click() */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-600">
                  {item.evidenceFiles?.length
                    ? `${item.evidenceFiles.length} file${item.evidenceFiles.length > 1 ? "s" : ""} attached`
                    : "No files attached yet"}
                </p>
                <label htmlFor={inputId}
                  className={`flex items-center gap-1.5 cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors ${uploading === item._id ? "opacity-60 pointer-events-none" : ""}`}>
                  <FiUploadCloud size={13} />
                  {uploading === item._id ? "Uploading…" : "Attach Document"}
                </label>
                <input
                  id={inputId}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.csv"
                  onChange={handleFileChange}
                  disabled={uploading === item._id}
                />
              </div>

              {/* Accepted file types hint */}
              <p className="text-[11px] text-slate-400 mb-3">
                Accepted: PDF, Word, Excel, Images, ZIP, CSV — max 10 MB
              </p>

              {item.evidenceFiles?.length > 0 ? (
                <div className="space-y-2">
                  {item.evidenceFiles.map((file) => {
                    const ext = file.fileName.split(".").pop()?.toLowerCase();
                    const iconColor =
                      ext === "pdf" ? "text-red-500" :
                      ["doc","docx"].includes(ext) ? "text-blue-600" :
                      ["xls","xlsx"].includes(ext) ? "text-emerald-600" :
                      ["png","jpg","jpeg"].includes(ext) ? "text-violet-500" : "text-slate-400";
                    return (
                      <div key={file._id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <FiFileText size={15} className={`${iconColor} shrink-0`} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{file.fileName}</p>
                            <p className="text-[11px] text-slate-400">
                              {(file.fileSize / 1024).toFixed(1)} KB
                              {" · "}
                              {new Date(file.uploadedAt).toLocaleDateString("en-AU", { day:"2-digit", month:"short", year:"numeric" })}
                              {file.uploadedBy && file.uploadedBy !== "System" && ` · ${file.uploadedBy}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0 ml-2">
                          <button onClick={() => onDownload(item._id, file._id)}
                            className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors">
                            <FiDownload size={11} /> View
                          </button>
                          <button onClick={() => onDeleteFile(item._id, file._id)}
                            className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100 transition-colors">
                            <FiTrash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
                  <FiUploadCloud size={24} className="text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-400">
                    Click &ldquo;Attach Document&rdquo; to upload evidence
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Comments section ─────────────────────────────────────────── */}
          {activeSection === "comments" && (
            <div className="px-5 py-4 space-y-3">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {item.comments?.length > 0 ? item.comments.map((c) => (
                  <div key={c._id} className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                      <FiUser size={11} className="text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-500">
                        {c.authorName}
                        {" · "}
                        {new Date(c.createdAt).toLocaleDateString("en-AU", { day:"2-digit", month:"short" })}
                      </p>
                      <p className="text-xs text-slate-800 mt-0.5">{c.text}</p>
                    </div>
                    <button onClick={() => onDeleteComment(item._id, c._id)}
                      className="text-slate-300 hover:text-red-500 transition-colors shrink-0 mt-0.5">
                      <FiX size={12} />
                    </button>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">No comments yet.</p>
                )}
              </div>
              <form onSubmit={handleComment} className="flex gap-2 pt-1 border-t border-slate-100">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a reviewer note or comment…"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 outline-none" />
                <button type="submit" disabled={!commentText.trim() || submitting}
                  className="rounded-lg bg-blue-700 px-3 py-2 text-white disabled:opacity-40 hover:bg-blue-800 transition-colors">
                  <FiSend size={13} />
                </button>
              </form>
            </div>
          )}

          {/* ── Approval steps section ───────────────────────────────────── */}
          {activeSection === "approval" && item.approvalRequired && (
            <div className="px-5 py-4 space-y-2">
              {item.approvalSteps?.length > 0 ? item.approvalSteps.map((step, idx) => (
                <div key={step._id}
                  className={`flex items-center justify-between rounded-xl border p-3 ${
                    step.status === "approved" ? "border-emerald-200 bg-emerald-50" :
                    step.status === "rejected" ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
                  }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                      step.status === "approved" ? "bg-emerald-600 text-white" :
                      step.status === "rejected" ? "bg-red-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}>{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{step.stepName}</p>
                      {step.assignedTo && <p className="text-[11px] text-slate-500">{step.assignedTo}</p>}
                      {step.notes && <p className="text-[11px] italic text-slate-500">&ldquo;{step.notes}&rdquo;</p>}
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    {step.status === "pending" ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => onApproveStep(item._id, step._id, "approved")}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100">
                          Approve
                        </button>
                        <button onClick={() => onApproveStep(item._id, step._id, "rejected")}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100">
                          Reject
                        </button>
                      </div>
                    ) : (
                      <ApprovalBadge status={step.status} />
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  No approval steps configured. Add steps when editing this obligation.
                </p>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function IrisReportingPage() {
  const [activeTab,    setActiveTab]    = useState("Dashboard");
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);
  const [data,         setData]         = useState(null);
  const [showForm,     setShowForm]     = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [uploadingId,  setUploadingId]  = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [legLibrary,   setLegLibrary]   = useState([]);
  const [ruleWarnings, setRuleWarnings] = useState([]);

  const summary      = useMemo(() => data?.summary      || null, [data]);
  const requirements = useMemo(() => data?.requirements || [],   [data]);

  const filtered = useMemo(() => {
    if (filterStatus === "all") return requirements;
    return requirements.filter((r) => r.status === filterStatus);
  }, [requirements, filterStatus]);

  const pendingApprovals = useMemo(() =>
    requirements.filter((r) => r.approvalRequired && (!r.approvalStatus || r.approvalStatus === "pending")),
  [requirements]);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    // Fetch overview and legislation library in parallel
    const [overviewRes, libRes] = await Promise.all([
      irisReportingAPI.getOverview(),
      irisReportingAPI.getLegislationLibrary(),
    ]);

    if (overviewRes.success) setData(overviewRes.data);
    else setError(overviewRes.error || "Unable to load IRIS reporting data");

    if (libRes.success && Array.isArray(libRes.data?.library)) {
      setLegLibrary(libRes.data.library);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(false); setPendingFiles([]); setRuleWarnings([]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setRuleWarnings([]);
    const payload = { ...form, evidenceRequired: form.evidenceRequired.filter(Boolean) };

    // Dry-run validation to surface warnings before saving
    const validation = await irisReportingAPI.validateRequirement(payload, editId || null);
    if (validation.success && validation.warnings?.length) {
      setRuleWarnings(validation.warnings);
    }

    const res = editId
      ? await irisReportingAPI.updateRequirement(editId, payload)
      : await irisReportingAPI.createRequirement(payload);

    if (res.success) {
      const targetId = res.requirementId || editId;
      if (pendingFiles.length > 0 && targetId) {
        setUploadingId(targetId);
        for (const file of pendingFiles) {
          const uploadRes = await irisReportingAPI.uploadEvidenceFile(targetId, file);
          if (!uploadRes.success) toast.error(`Failed to upload ${file.name}`);
        }
        setUploadingId(null);
      }
      toast.success(editId ? "Obligation updated" : "Obligation created");
      await loadData(true);
      resetForm();
    } else {
      // Business rule error from backend — show it clearly
      toast.error(res.error || "Failed to save");
      setRuleWarnings((prev) => res.error ? [res.error, ...prev] : prev);
    }
    setSaving(false);
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setForm({
      title: item.title || "", source: item.source || "",
      legislationRef: item.legislationRef || "", category: item.category || "Reporting",
      obligationType: item.obligationType || "reporting", status: item.status || "planned",
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : "",
      owner: item.owner || "", reportType: item.reportType || "Statutory report",
      materiality: item.materiality || "Standard", approvalRequired: Boolean(item.approvalRequired),
      evidenceRequired: item.evidenceRequired?.length ? item.evidenceRequired : [""],
      details: item.details || "", legislationVersion: item.legislationVersion || "",
      ruleVersion: item.ruleVersion || "1.0", reportingPeriod: item.reportingPeriod || "",
    });
    setShowForm(true);
    setActiveTab("Obligations");
    // Scroll to bottom so the edit form is visible (form is now at the bottom of the list)
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 100);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this obligation? This cannot be undone.")) return;
    const res = await irisReportingAPI.deleteRequirement(id);
    if (res.success) { toast.success("Obligation deleted"); await loadData(true); }
    else toast.error(res.error || "Failed to delete");
  };

  const handleUpload = async (reqId, file) => {
    setUploadingId(reqId);
    const res = await irisReportingAPI.uploadEvidenceFile(reqId, file);
    if (res.success) { toast.success("File uploaded"); await loadData(true); }
    else toast.error(res.error || "Upload failed");
    setUploadingId(null);
  };

  const handleDeleteFile = async (reqId, fileId) => {
    const res = await irisReportingAPI.deleteEvidenceFile(reqId, fileId);
    if (res.success) { toast.success("File deleted"); await loadData(true); }
    else toast.error(res.error || "Delete failed");
  };

  const handleDownload = (reqId, fileId) =>
    irisReportingAPI.downloadEvidenceFile(reqId, fileId);

  const handleApproveStep = async (reqId, stepId, decision) => {
    const notes = decision === "rejected"
      ? (window.prompt("Reason for rejection (optional):") || "")
      : "";
    const res = await irisReportingAPI.decideApprovalStep(reqId, stepId, decision, notes);
    if (res.success) { toast.success(`Step ${decision}`); await loadData(true); }
    else toast.error(res.error || "Action failed");
  };

  const handleAddComment = async (reqId, text) => {
    const res = await irisReportingAPI.addComment(reqId, text);
    if (res.success) await loadData(true);
    else toast.error(res.error || "Comment failed");
  };

  const handleDeleteComment = async (reqId, commentId) => {
    const res = await irisReportingAPI.deleteComment(reqId, commentId);
    if (res.success) await loadData(true);
    else toast.error(res.error || "Failed");
  };

  // ── Loading & Error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-100 border-t-blue-700" />
          <p className="text-sm font-semibold text-slate-500">Loading IRIS workspace…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <div className="flex items-center gap-2 font-bold text-red-700 mb-2">
          <FiAlertCircle /> Unable to load IRIS reporting
        </div>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button onClick={() => loadData()}
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">
          Retry
        </button>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Hero Header */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">IRIS Reporting and Evidence Map</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black">Policy-Driven Statutory Reporting</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Configure obligations, assign evidence requirements, and track reporting progress — from the Financial Management Act 1994 through to AASB/IFRS compliance.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-center">
              <p className="text-3xl font-black text-white">{summary?.complianceScore ?? 0}%</p>
              <p className="text-xs font-semibold text-slate-300 mt-0.5">Compliance Score</p>
            </div>
            <button onClick={() => loadData(true)} disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition-colors disabled:opacity-50">
              <FiRefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Obligations" value={summary?.total ?? 0}
          sub="across all categories" icon={FiDatabase} tone="blue" />
        <StatCard label="Completed" value={summary?.completed ?? 0}
          sub={`${requirements.length ? Math.round((summary?.completed / summary?.total) * 100) : 0}% complete`}
          icon={FiCheckCircle} tone="emerald" />
        <StatCard label="In Progress" value={summary?.inProgress ?? 0}
          sub={summary?.overdueCount ? `${summary.overdueCount} overdue` : "On track"}
          icon={FiClock} tone={summary?.overdueCount > 0 ? "red" : "amber"} />
        <StatCard label="Evidence Files" value={summary?.evidenceCount ?? 0}
          sub="uploaded across obligations" icon={FiUploadCloud} tone="blue" />
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 flex overflow-x-auto">
          {TABS.map((t) => (
            <Tab key={t} label={t} active={activeTab === t} onClick={() => setActiveTab(t)}
              count={t === "Approvals" ? pendingApprovals.length : t === "Obligations" ? requirements.length : undefined} />
          ))}
          <div className="ml-auto flex items-center px-4">
            {activeTab === "Obligations" && (
              <button
                onClick={() => { setEditId(null); setForm(EMPTY_FORM); setPendingFiles([]); setShowForm(true);
                  setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 100);
                }}
                className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 transition-colors">
                <FiPlus size={13} /> New Obligation
              </button>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6">

          {/* ── Dashboard Tab ─────────────────────────────────────────────── */}
          {activeTab === "Dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Progress by status */}
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-black text-slate-900 mb-4">Obligation Progress</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Completed",   count: summary?.completed  || 0, color: "bg-emerald-500" },
                      { label: "In Progress", count: summary?.inProgress || 0, color: "bg-amber-500"   },
                      { label: "Blocked",     count: summary?.blocked    || 0, color: "bg-red-500"     },
                      { label: "Planned",     count: (summary?.total || 0) - (summary?.completed || 0) - (summary?.inProgress || 0) - (summary?.blocked || 0), color: "bg-slate-300" },
                    ].map(({ label, count, color }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-600">{label}</span>
                          <span className="font-black text-slate-900">{count} <span className="text-slate-400">({summary?.total ? Math.round((count / summary.total) * 100) : 0}%)</span></span>
                        </div>
                        <ProgressBar value={summary?.total ? (count / summary.total) * 100 : 0} color={color} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next due / overdue */}
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-black text-slate-900 mb-4">Upcoming Deadlines</h3>
                  <div className="space-y-3">
                    {requirements
                      .filter((r) => r.dueDate && r.status !== "completed")
                      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                      .slice(0, 5)
                      .map((r) => {
                        const overdue = new Date(r.dueDate) < new Date();
                        return (
                          <div key={r._id} className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-800 truncate">{r.title}</p>
                              <p className="text-[11px] text-slate-400">{r.owner || "Unassigned"}</p>
                            </div>
                            <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${overdue ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                              {new Date(r.dueDate).toLocaleDateString("en-AU", { day:"2-digit", month:"short" })}
                            </span>
                          </div>
                        );
                      })
                    }
                    {requirements.filter((r) => r.dueDate && r.status !== "completed").length === 0 && (
                      <p className="text-sm text-slate-400 italic">No upcoming deadlines.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent obligations */}
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-3">Recent Obligations</h3>
                <div className="space-y-2">
                  {requirements.slice(0, 3).map((r) => (
                    <div key={r._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusBadge status={r.status} />
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <MatBadge value={r.materiality} />
                        <button onClick={() => { setActiveTab("Obligations"); handleEdit(r); }}
                          className="text-xs font-bold text-blue-700 hover:underline">Edit</button>
                      </div>
                    </div>
                  ))}
                  {requirements.length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-6">No obligations yet. Create your first one in the Obligations tab.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Obligations Tab ───────────────────────────────────────────── */}
          {activeTab === "Obligations" && (
            <div className="space-y-5">
              {/* Filter bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {["all", "planned", "in_progress", "completed", "blocked"].map((s) => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                        filterStatus === s ? "bg-blue-700 text-white" : "text-slate-500 hover:text-slate-900"
                      }`}>
                      {s === "all" ? "All" : s.replace("_", " ")}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-semibold text-slate-500">{filtered.length} obligation{filtered.length !== 1 ? "s" : ""}</p>
              </div>

              {/* Obligation cards */}
              <div className="space-y-4">
                {filtered.map((item) => (
                  <ObligationCard key={item._id} item={item}
                    onEdit={handleEdit} onDelete={handleDelete}
                    onUpload={handleUpload} onDeleteFile={handleDeleteFile}
                    onDownload={handleDownload} uploading={uploadingId}
                    onApproveStep={handleApproveStep}
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment} />
                ))}
                {filtered.length === 0 && !showForm && (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                    <FiShield size={32} className="mb-3 opacity-30" />
                    <p className="text-sm font-semibold">No obligations{filterStatus !== "all" ? ` with status "${filterStatus.replace("_"," ")}"` : ""}</p>
                  </div>
                )}
              </div>

              {/* ── New / Edit obligation form — ALWAYS at the bottom ──────── */}
              {showForm ? (
                <>
                  {/* Business rule warnings */}
                  {ruleWarnings.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
                      {ruleWarnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-amber-800">
                          <FiAlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                          {w}
                        </div>
                      ))}
                    </div>
                  )}
                  <ObligationForm form={form} setForm={setForm} onSubmit={handleSubmit}
                    saving={saving} onCancel={resetForm} editId={editId}
                    pendingFiles={pendingFiles} setPendingFiles={setPendingFiles}
                    legislationLibrary={legLibrary} />
                </>
              ) : (
                <button
                  onClick={() => { setEditId(null); setForm(EMPTY_FORM); setPendingFiles([]); setShowForm(true); }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-5 text-sm font-bold text-slate-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all">
                  <FiPlus size={16} /> Add New Obligation
                </button>
              )}
            </div>
          )}

          {/* ── Approvals Tab ─────────────────────────────────────────────── */}
          {activeTab === "Approvals" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
                <FiAlertTriangle size={16} className="text-amber-600 shrink-0" />
                <p className="text-sm font-semibold text-amber-800">
                  {pendingApprovals.length > 0
                    ? `${pendingApprovals.length} obligation${pendingApprovals.length > 1 ? "s require" : " requires"} approval.`
                    : "No pending approvals. All obligations are either approved or do not require approval."}
                </p>
              </div>
              {pendingApprovals.map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{item.source || "—"} · Owner: {item.owner || "—"}</p>
                    </div>
                    <ApprovalBadge status={item.approvalStatus || "pending"} />
                  </div>
                  {item.details && <p className="text-sm text-slate-600 mb-3">{item.details}</p>}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400 flex-1">Awaiting sign-off before report finalisation.</p>
                    <button onClick={() => handleEdit(item)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      Review & Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Report Pack Tab ───────────────────────────────────────────── */}
          {activeTab === "Report Pack" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <FiShield size={20} className="text-blue-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-blue-900">Compliance Score: {summary?.complianceScore ?? 0}%</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {(summary?.complianceScore ?? 0) >= 80
                        ? "Strong compliance posture. Ensure all evidence is uploaded before sign-off."
                        : (summary?.complianceScore ?? 0) >= 50
                        ? "Moderate compliance. Review in-progress and blocked obligations."
                        : "Compliance needs attention. Prioritise blocked and overdue obligations."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Obligation", "Source", "Owner", "Due Date", "Status", "Materiality", "Evidence Files"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {requirements.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No obligations defined yet.</td></tr>
                    ) : requirements.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="text-sm font-black text-slate-900 truncate">{r.title}</p>
                          {r.legislationRef && <p className="text-[11px] font-mono text-slate-400 truncate">{r.legislationRef}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[150px] truncate">{r.source || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{r.owner || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                          {r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-AU", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3"><MatBadge value={r.materiality} /></td>
                        <td className="px-4 py-3 text-xs font-black text-slate-900">{r.evidenceFiles?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Recommended Next Step</p>
                <p className="text-sm text-slate-700">
                  Maintain a single evidence register per obligation and attach each item to the appropriate report template before final sign-off.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
