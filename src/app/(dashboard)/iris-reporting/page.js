"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDatabase,
  FiPlus,
  FiShield,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";
import { irisReportingAPI } from "../../api/irisReportingAPI";

const statCardClass =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default function IrisReportingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    title: "",
    source: "",
    category: "Reporting",
    obligationType: "reporting",
    status: "planned",
    dueDate: "",
    owner: "",
    reportType: "Statutory report",
    materiality: "Standard",
    approvalRequired: false,
    evidenceRequired: [""],
    details: "",
  });
  const [saving, setSaving] = useState(false);
  const [activeRequirementId, setActiveRequirementId] = useState(null);
  const [uploadingFileId, setUploadingFileId] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(() => data?.summary || null, [data]);
  const requirements = useMemo(() => data?.requirements || [], [data]);

  const resetForm = () => {
    setForm({
      title: "",
      source: "",
      category: "Reporting",
      obligationType: "reporting",
      status: "planned",
      dueDate: "",
      owner: "",
      reportType: "Statutory report",
      materiality: "Standard",
      approvalRequired: false,
      evidenceRequired: [""],
      details: "",
    });
    setActiveRequirementId(null);
    setPendingFiles([]);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const overview = await irisReportingAPI.getOverview();
      if (!overview.success) {
        setError(overview.error || "Unable to load IRIS reporting data");
        return;
      }
      setData(overview.data);
    } catch (err) {
      setError(err.message || "Unable to load IRIS reporting data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        evidenceRequired: form.evidenceRequired.filter(Boolean),
      };
      const response = activeRequirementId
        ? await irisReportingAPI.updateRequirement(activeRequirementId, payload)
        : await irisReportingAPI.createRequirement(payload);
      if (!response.success) {
        setError(response.error || "Unable to save requirement");
        return;
      }

      // Upload any pending files
      const requirementId =
        response.data?.requirement?._id || activeRequirementId;
      if (pendingFiles.length > 0 && requirementId) {
        for (const file of pendingFiles) {
          await irisReportingAPI.uploadEvidenceFile(requirementId, file);
        }
      }

      await loadData();
      resetForm();
    } catch (err) {
      setError(err.message || "Unable to save requirement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (requirementId) => {
    try {
      const response = await irisReportingAPI.deleteRequirement(requirementId);
      if (!response.success) {
        setError(response.error || "Unable to delete requirement");
        return;
      }
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete requirement");
    }
  };

  const startEdit = (item) => {
    setActiveRequirementId(item._id || item.id);
    setForm({
      title: item.title || "",
      source: item.source || "",
      category: item.category || "Reporting",
      obligationType: item.obligationType || "reporting",
      status: item.status || "planned",
      dueDate: item.dueDate
        ? new Date(item.dueDate).toISOString().slice(0, 10)
        : "",
      owner: item.owner || "",
      reportType: item.reportType || "Statutory report",
      materiality: item.materiality || "Standard",
      approvalRequired: Boolean(item.approvalRequired),
      evidenceRequired:
        Array.isArray(item.evidenceRequired) && item.evidenceRequired.length
          ? item.evidenceRequired
          : [""],
      details: item.details || "",
    });
  };

  const handleFileUpload = async (requirementId, file) => {
    if (!file) return;
    try {
      setUploadingFileId(requirementId);
      const response = await irisReportingAPI.uploadEvidenceFile(
        requirementId,
        file,
      );
      if (!response.success) {
        setError(response.error || "Unable to upload file");
        return;
      }
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to upload file");
    } finally {
      setUploadingFileId(null);
    }
  };

  const handleDownloadFile = async (requirementId, fileId, fileName) => {
    try {
      const response = await irisReportingAPI.downloadEvidenceFile(
        requirementId,
        fileId,
        fileName,
      );
      if (!response.success) {
        setError(response.error || "Unable to download file");
      }
    } catch (err) {
      setError(err.message || "Unable to download file");
    }
  };

  const handleDeleteFile = async (requirementId, fileId) => {
    try {
      const response = await irisReportingAPI.deleteEvidenceFile(
        requirementId,
        fileId,
      );
      if (!response.success) {
        setError(response.error || "Unable to delete file");
        return;
      }
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete file");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
        Loading IRIS reporting workspace…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <FiAlertCircle /> Unable to load reporting workspace
        </div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-900 to-slate-700 p-8 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
              IRIS Reporting and Evidence Map
            </p>
            <h1 className="mt-2 text-3xl font-black">
              Policy-driven statutory reporting workspace
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              Configure obligations, assign evidence requirements, and track
              reporting progress using a structured compliance workflow.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <FiShield /> Compliance score {summary?.complianceScore ?? 0}%
            </div>
            <div className="mt-1 text-slate-300">
              {summary?.total ?? 0} obligations tracked
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className={statCardClass}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total obligations
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">
            {summary?.total ?? 0}
          </div>
        </div>
        <div className={statCardClass}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Completed
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-600">
            {summary?.completed ?? 0}
          </div>
        </div>
        <div className={statCardClass}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            In progress
          </div>
          <div className="mt-3 text-3xl font-black text-amber-600">
            {summary?.inProgress ?? 0}
          </div>
        </div>
        <div className={statCardClass}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Evidence items
          </div>
          <div className="mt-3 text-3xl font-black text-blue-600">
            {summary?.evidenceCount ?? 0}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form
            onSubmit={handleSubmit}
            className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {activeRequirementId ? "Edit obligation" : "Add obligation"}
                </h2>
                <p className="text-sm text-slate-500">
                  Capture a new reporting obligation, evidence requirement, and
                  due date.
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-semibold text-slate-500"
              >
                Clear
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Obligation title"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                required
              />
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Source"
                value={form.source}
                onChange={(event) =>
                  setForm({ ...form, source: event.target.value })
                }
              />
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                <option value="Reporting">Reporting</option>
                <option value="Legislation">Legislation</option>
                <option value="Policy">Policy</option>
                <option value="Accounting standard">Accounting standard</option>
                <option value="Compliance">Compliance</option>
                <option value="Other">Other</option>
              </select>
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Owner"
                value={form.owner}
                onChange={(event) =>
                  setForm({ ...form, owner: event.target.value })
                }
              />
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm({ ...form, dueDate: event.target.value })
                }
              />
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value })
                }
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={form.materiality}
                onChange={(event) =>
                  setForm({ ...form, materiality: event.target.value })
                }
              >
                <option value="Standard">Standard</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.approvalRequired}
                  onChange={(event) =>
                    setForm({ ...form, approvalRequired: event.target.checked })
                  }
                />
                Approval required
              </label>
            </div>
            <textarea
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              rows="3"
              placeholder="Details"
              value={form.details}
              onChange={(event) =>
                setForm({ ...form, details: event.target.value })
              }
            />
            <div className="mt-3">
              <div className="text-sm font-semibold text-slate-700">
                Evidence requirements
              </div>
              {form.evidenceRequired.map((item, index) => (
                <div key={`${item}-${index}`} className="mt-2 flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    placeholder="Evidence item"
                    value={item}
                    onChange={(event) => {
                      const next = [...form.evidenceRequired];
                      next[index] = event.target.value;
                      setForm({ ...form, evidenceRequired: next });
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    onClick={() => {
                      const next = form.evidenceRequired.filter(
                        (_, currentIndex) => currentIndex !== index,
                      );
                      setForm({
                        ...form,
                        evidenceRequired: next.length ? next : [""],
                      });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="mt-2 flex items-center gap-2 text-sm font-semibold text-blue-700"
                onClick={() =>
                  setForm({
                    ...form,
                    evidenceRequired: [...form.evidenceRequired, ""],
                  })
                }
              >
                <FiPlus /> Add evidence
              </button>
            </div>

            <div className="mt-3">
              <div className="text-sm font-semibold text-slate-700">
                Attach evidence files
              </div>
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                <FiUploadCloud /> Select files to upload
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files) {
                      setPendingFiles([
                        ...pendingFiles,
                        ...Array.from(event.target.files),
                      ]);
                    }
                  }}
                />
              </label>
              {pendingFiles.length > 0 && (
                <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <div className="text-xs font-semibold text-slate-600">
                    {pendingFiles.length} file(s) to upload
                  </div>
                  {pendingFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs"
                    >
                      <span className="truncate text-slate-700">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800"
                        onClick={() =>
                          setPendingFiles(
                            pendingFiles.filter((_, i) => i !== index),
                          )
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : activeRequirementId
                    ? "Update obligation"
                    : "Create obligation"}
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Obligation register
              </h2>
              <p className="text-sm text-slate-500">
                Each item includes source, owner, approval status and evidence
                requirements.
              </p>
            </div>
            <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {requirements.length} items
            </div>
          </div>

          <div className="space-y-3">
            {requirements.map((item) => (
              <div
                key={item._id || item.title}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.details}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {item.status === "completed" ? (
                        <FiCheckCircle className="text-emerald-600" />
                      ) : item.status === "blocked" ? (
                        <FiAlertCircle className="text-red-600" />
                      ) : (
                        <FiClock className="text-amber-600" />
                      )}
                      {item.status}
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600"
                      onClick={() => handleDelete(item._id || item.id)}
                    >
                      <FiTrash2 className="inline" /> Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Source
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      {item.source}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Owner
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      {item.owner}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Due
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString()
                        : "Not set"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {item.evidenceRequired?.map((evidence) => (
                    <span
                      key={evidence}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                    >
                      {evidence}
                    </span>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-700">
                      Uploaded evidence files
                    </div>
                    <label className="cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                      <FiUploadCloud className="mb-1 inline" /> Upload file
                      <input
                        type="file"
                        className="hidden"
                        onChange={(event) =>
                          handleFileUpload(
                            item._id || item.id,
                            event.target.files?.[0],
                          )
                        }
                        disabled={uploadingFileId === (item._id || item.id)}
                      />
                    </label>
                  </div>
                  {item.evidenceFiles && item.evidenceFiles.length > 0 ? (
                    <div className="space-y-2">
                      {item.evidenceFiles.map((file) => (
                        <div
                          key={file._id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-slate-700">
                              {file.fileName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {(file.fileSize / 1024).toFixed(2)} KB ·{" "}
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                              onClick={() =>
                                handleDownloadFile(
                                  item._id || item.id,
                                  file._id,
                                  file.fileName,
                                )
                              }
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                              onClick={() =>
                                handleDeleteFile(item._id || item.id, file._id)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      No files uploaded yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FiUploadCloud /> Evidence readiness
            </div>
            <div className="mt-4 text-4xl font-black text-slate-900">
              {summary?.evidenceCount ?? 0}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Evidence items currently mapped to obligations.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FiDatabase /> Recommended next action
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Keep a single evidence register per obligation and attach each
              item to the appropriate report template before sign-off.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
