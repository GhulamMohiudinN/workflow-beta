"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FiCheckCircle, FiFileText, FiAlertCircle, FiShield, FiEye, FiDownload } from "react-icons/fi";
import { toast, Toaster } from "../../../components/Toast";
import { contractAPI, openContractDocument } from "../../api/contractAPI";

const formatBytes = (n = 0) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

/**
 * The attached document, for the signer. Links are requested at the moment of
 * the click rather than with the page, because they expire after a few minutes
 * and a careful reader may spend longer than that on the terms.
 */
function SignerDocument({ token, document: doc, onOpened }) {
  const open = async (mode) => {
    const result = await openContractDocument(() => contractAPI.publicDocumentLinks(token), mode);
    if (!result.ok) toast.error(result.error);
    else onOpened?.();
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <FiFileText size={18} className="shrink-0 text-red-500" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">{doc.fileName}</p>
          <p className="text-xs text-[var(--color-muted)]">{formatBytes(doc.fileSize)}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button type="button" onClick={() => open("view")}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)]">
          <FiEye size={13} /> Read
        </button>
        <button type="button" onClick={() => open("download")} title="Download a copy"
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--color-text)] hover:bg-[var(--color-bg-soft)]">
          <FiDownload size={13} />
        </button>
      </div>
    </div>
  );
}
import SignaturePad from "../../../components/SignaturePad";

function SignContent() {
  const token = useSearchParams().get("token");
  const padRef = useRef(null);

  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [contract, setContract]   = useState(null);
  const [signerName, setSignerName] = useState("");
  const [agreed, setAgreed]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);
  const [openedDocument, setOpenedDocument] = useState(false);

  useEffect(() => {
    if (!token) { setError("No signing link token found."); setLoading(false); return; }
    (async () => {
      const res = await contractAPI.getPublic(token);
      if (res.success) setContract(res.contract);
      else setError(res.error || "This link is invalid or has expired.");
      setLoading(false);
    })();
  }, [token]);

  const handleSubmit = async () => {
    if (!signerName.trim()) return toast.error("Enter your full name");
    if (!agreed) return toast.error("Please confirm you agree to the terms above");
    if (!padRef.current || padRef.current.isEmpty()) return toast.error("Please draw your signature");

    setSubmitting(true);
    const res = await contractAPI.sign(token, {
      signerName: signerName.trim(),
      signature: padRef.current.toDataUrl(),
    });
    setSubmitting(false);

    if (res.success) {
      setDone(true);
      toast.success("Signed successfully!");
    } else {
      toast.error(res.error || "Failed to submit signature");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-white p-8 text-center shadow-[var(--shadow-card)]">
          <FiAlertCircle className="mx-auto mb-4 h-11 w-11 text-red-500" />
          <h2 className="text-lg font-black text-[var(--color-text)]">Can&apos;t open this contract</h2>
          <p className="mt-2 text-sm font-medium text-[var(--color-muted)]">{error}</p>
        </div>
      </div>
    );
  }

  if (contract.status === "signed" || done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-white p-8 text-center shadow-[var(--shadow-card)]">
          <FiCheckCircle className="mx-auto mb-4 h-11 w-11 text-[var(--color-success)]" />
          <h2 className="text-lg font-black text-[var(--color-text)]">
            {done ? "Signed successfully" : "Already signed"}
          </h2>
          <p className="mt-2 text-sm font-medium text-[var(--color-muted)]">
            {done
              ? `Thanks, ${signerName.trim()}. A confirmation has been sent to ${contract.ownerName || "the sender"}.`
              : `This document was signed by ${contract.signerName} on ${new Date(contract.signedAt).toLocaleDateString()}.`}
          </p>
          {contract.document && (
            <div className="mt-5 text-left">
              <p className="mb-2 text-xs font-semibold text-[var(--color-muted)]">Keep a copy of what was signed:</p>
              <SignerDocument token={token} document={contract.document} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-10 px-4">
      <Toaster />
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.png" alt="Iris Monde" className="h-9 w-9 rounded-[7px] object-contain" />
          <div>
            <p className="text-sm font-black text-[var(--color-text)]">Iris Monde</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Document Signing</p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
          <div className="border-b border-[var(--color-border)] p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-primary)]">
                <FiFileText size={16} />
              </div>
              <div>
                <h1 className="text-lg font-black text-[var(--color-text)]">{contract.title}</h1>
                <p className="text-xs font-medium text-[var(--color-muted)]">
                  Sent by {contract.ownerName || "Iris Monde"} · For {contract.recipientName}
                </p>
              </div>
            </div>
          </div>

          {contract.document && (
            <div className="border-b border-[var(--color-border)] p-6">
              <p className="mb-2 text-xs font-semibold text-[var(--color-muted)]">
                Please read the attached document before signing.
              </p>
              <SignerDocument token={token} document={contract.document} onOpened={() => setOpenedDocument(true)} />
            </div>
          )}

          {contract.content && (
            <div className="max-h-80 overflow-y-auto p-6">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">{contract.content}</p>
            </div>
          )}

          <div className="space-y-5 border-t border-[var(--color-border)] p-6">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-text)]">Your Full Name</label>
              <input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Type your full legal name"
                className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-text)]">Signature</label>
              <SignaturePad ref={padRef} />
            </div>

            <label className="flex items-start gap-2.5 text-xs font-medium text-[var(--color-muted)]">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]" />
              I have read this document and agree to be bound by its terms.
            </label>

            {contract.document && !openedDocument && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                You haven&apos;t opened the attached document yet. Please read it before signing.
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] py-3 text-sm font-black text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (<><div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />Submitting...</>) : "Sign Document"}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-[var(--color-faint)]">
              <FiShield size={12} /> This link is unique to you and cannot be reused after signing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" /></div>}>
      <SignContent />
    </Suspense>
  );
}
