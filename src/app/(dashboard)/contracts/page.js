"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiFileText, FiSend, FiTrash2, FiChevronDown, FiChevronUp,
  FiDownload, FiClock, FiCheckCircle, FiPaperclip, FiEye, FiX,
} from "react-icons/fi";
import { toast } from "../../../components/Toast";
import { contractAPI, openContractDocument } from "../../api/contractAPI";

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ACCEPTED_DOCUMENTS = ".pdf,.doc,.docx";

const formatBytes = (n = 0) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

/** The attached document's name with View and Download. */
function DocumentRow({ document: doc, fetchLinks }) {
  const open = async (mode) => {
    const result = await openContractDocument(fetchLinks, mode);
    if (!result.ok) toast.error(result.error);
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <FiFileText size={16} className="shrink-0 text-red-500" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-800">{doc.fileName}</p>
          <p className="text-[11px] text-slate-400">{formatBytes(doc.fileSize)}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <button type="button" onClick={() => open("view")}
          className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100">
          <FiEye size={11} /> View
        </button>
        <button type="button" onClick={() => open("download")} title="Download"
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50">
          <FiDownload size={11} />
        </button>
      </div>
    </div>
  );
}

const EMPTY_FORM = { title: "", recipientName: "", recipientEmail: "", content: "" };

const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none";

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "signed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
        <FiCheckCircle size={11} /> Signed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
      <FiClock size={11} /> Awaiting signature
    </span>
  );
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [sending, setSending]     = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [file, setFile]           = useState(null);
  const fileInputRef              = useRef(null);

  const pickFile = (picked) => {
    if (!picked) return;
    const ext = picked.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext)) return toast.error("Attach a PDF or Word document");
    if (picked.size > MAX_DOCUMENT_BYTES) return toast.error("Documents must be 10 MB or smaller");
    setFile(picked);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const load = async () => {
    setLoading(true);
    const res = await contractAPI.list();
    if (res.success) setContracts(res.contracts || []);
    else toast.error(res.error || "Failed to load contracts");
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSend = async () => {
    if (!form.title.trim()) return toast.error("Contract title is required");
    if (!form.recipientName.trim()) return toast.error("Recipient name is required");
    if (!form.recipientEmail.trim()) return toast.error("Recipient email is required");
    if (!form.content.trim() && !file) return toast.error("Write the contract terms, attach a document, or both");

    setSending(true);
    const res = await contractAPI.create(form, file);
    setSending(false);

    if (res.success) {
      toast.success(`Sent to ${form.recipientEmail} — they'll get a link to review and sign`);
      setForm(EMPTY_FORM);
      clearFile();
      load();
    } else {
      toast.error(res.error || "Failed to send contract");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this contract? The signing link will stop working.")) return;
    const res = await contractAPI.remove(id);
    if (res.success) { toast.success("Contract cancelled"); load(); }
    else toast.error(res.error || "Failed to cancel");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div>
        <h1 className="text-xl font-black text-slate-900">Contracts</h1>
        <p className="mt-1 text-sm text-slate-500">
          Send a contract by email — the recipient reviews and signs from anywhere, no account needed. You&apos;re notified the moment it&apos;s signed.
        </p>
      </div>

      {/* ── New contract form ───────────────────────────────────────────── */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Send a New Contract</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contract Title">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Freelance Services Agreement" className={inputCls} />
          </Field>
          <Field label="Recipient Name">
            <input value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
              placeholder="Full name" className={inputCls} />
          </Field>
        </div>

        <Field label="Recipient Email">
          <input value={form.recipientEmail} onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
            placeholder="name@example.com" type="email" className={inputCls} />
        </Field>

        <Field label="Contract Document (PDF or Word)">
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <FiPaperclip size={14} className="shrink-0 text-blue-600" />
                <span className="truncate text-sm font-semibold text-slate-800">{file.name}</span>
                <span className="shrink-0 text-xs text-slate-500">{formatBytes(file.size)}</span>
              </div>
              <button type="button" onClick={clearFile} title="Remove"
                className="rounded p-1 text-slate-500 hover:bg-white hover:text-red-600">
                <FiX size={14} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-3 py-4 text-sm font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-700">
              <FiPaperclip size={14} /> Attach a PDF or Word document
            </button>
          )}
          <input ref={fileInputRef} type="file" accept={ACCEPTED_DOCUMENTS} className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])} />
          <p className="mt-1 text-[11px] text-slate-400">
            The recipient can view and download it before signing. Up to 10 MB.
          </p>
        </Field>

        <Field label={file ? "Contract Text or Covering Note (optional)" : "Contract Text"}>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={file ? 4 : 8}
            placeholder={file
              ? "Optional: a short note shown above the attached document..."
              : "Paste or write the full contract text the recipient will read and sign, or attach a document above..."}
            className={inputCls} />
        </Field>

        <button type="button" onClick={handleSend} disabled={sending}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
          <FiSend size={14} /> {sending ? "Sending…" : "Send for Signature"}
        </button>
      </div>

      {/* ── List ─────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
          {loading ? "Loading…" : `${contracts.length} contract${contracts.length === 1 ? "" : "s"}`}
        </p>

        {!loading && contracts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
            <FiFileText size={28} className="mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-400">No contracts sent yet</p>
          </div>
        )}

        {contracts.map((c) => {
          const expanded = expandedId === c._id;
          return (
            <div key={c._id} className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black text-slate-900">{c.title}</p>
                    <StatusBadge status={c.status} />
                    {c.document && (
                      <span title={c.document.fileName} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        <FiPaperclip size={10} /> Document
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    To {c.recipientName} ({c.recipientEmail})
                    {c.status === "signed" && c.signedAt && ` · Signed ${new Date(c.signedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => setExpandedId(expanded ? null : c._id)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
                    {expanded ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />} View
                  </button>
                  {c.status === "pending" && (
                    <button type="button" onClick={() => handleCancel(c._id)}
                      className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100">
                      <FiTrash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {expanded && (
                <div className="iris-print-area border-t border-slate-100 p-5">
                  {c.document && (
                    <div className="iris-no-print mb-4">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Attached Document</p>
                      <DocumentRow document={c.document} fetchLinks={() => contractAPI.documentLinks(c._id)} />
                      {c.document.sha256 && (
                        <p className="mt-1.5 break-all font-mono text-[10px] text-slate-400" title="SHA-256 fingerprint taken at upload">
                          Fingerprint {c.document.sha256}
                        </p>
                      )}
                    </div>
                  )}
                  {c.content && (
                    <>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {c.document ? "Covering Note" : "Contract Text"}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{c.content}</p>
                    </>
                  )}

                  {c.status === "signed" && (
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Signature</p>
                      <div className="mt-2 flex items-center gap-4">
                        {c.signature && (
                          <img src={c.signature} alt="Signature" className="h-16 rounded-lg border border-slate-200 bg-white p-2" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-900">{c.signerName}</p>
                          <p className="text-xs text-slate-500">Signed {new Date(c.signedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => window.print()}
                        className="iris-no-print mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                        <FiDownload size={12} /> Print / Save as PDF
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
