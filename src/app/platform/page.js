"use client";

/**
 * Platform operator console.
 *
 * Deliberately outside the (dashboard) route group: every page in there assumes
 * a workspace, and an operator belongs to none. This is the only screen that
 * can create one.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiRefreshCw, FiLogOut, FiMail, FiCheck, FiClock, FiX, FiSend } from "react-icons/fi";
import { platformAPI } from "../api/platformAPI";
import { toast } from "../../components/Toast";

const fmtDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
};

const EMPTY_FORM = {
  companyName: "",
  adminName: "",
  adminEmail: "",
  industry: "",
  headquarters: "",
  currency: "",
};

/** Pending vs accepted is the one thing worth seeing at a glance — a pending
 *  invitation means nobody can get into that company yet. */
function InvitationBadge({ administrator }) {
  if (!administrator) {
    return <span className="text-xs text-[var(--color-muted)]">No administrator</span>;
  }

  const accepted = administrator.invitationStatus === "accepted";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        accepted
          ? "bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]"
          : "bg-amber-500/10 text-amber-600"
      }`}
    >
      {accepted ? <FiCheck size={12} /> : <FiClock size={12} />}
      {accepted ? "Active" : "Invitation pending"}
    </span>
  );
}

export default function PlatformConsole() {
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCompanies(await platformAPI.listCompanies());
      setDenied(false);
    } catch (err) {
      // 403 here means a signed-in user who is not an operator. Showing the
      // real reason beats an empty table that looks like a bug.
      if (err.response?.status === 403) {
        setDenied(true);
      } else {
        toast.error(err.response?.data?.message || "Could not load companies.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await platformAPI.createCompany(form);
      // The company is created even when the invitation could not be sent, so
      // this must not read as a clean success — the operator needs to resend.
      if (result.invitationSent === false) {
        toast.error(result.message || "Company created, but the invitation could not be sent.", {
          duration: 8000,
        });
      } else {
        toast.success(result.message || "Company created.");
      }
      setForm(EMPTY_FORM);
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create the company.");
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async (company) => {
    setResendingId(company.id);
    try {
      const result = await platformAPI.resendInvitation(company.id);
      toast.success(result.message || "Invitation sent.");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send the invitation.");
    } finally {
      setResendingId(null);
    }
  };

  const signOut = () => {
    localStorage.clear();
    router.push("/login");
  };

  const pendingCount = useMemo(
    () => companies.filter((c) => c.administrator?.invitationStatus !== "accepted").length,
    [companies]
  );

  if (denied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-black text-[var(--color-text)]">Not available to this account</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            This console is for platform operators. Your account administers a workspace, which you
            can reach from the dashboard.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-5 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg" />
            <div>
              <h1 className="text-base font-black leading-tight text-[var(--color-text)]">
                Client companies
              </h1>
              <p className="text-xs text-[var(--color-muted)]">
                {companies.length} {companies.length === 1 ? "company" : "companies"}
                {pendingCount > 0 && ` · ${pendingCount} awaiting first sign-in`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              title="Refresh"
              className="rounded-lg border border-[var(--color-border)] p-2.5 text-[var(--color-muted)] hover:bg-[var(--color-bg-soft)] disabled:opacity-50"
            >
              <FiRefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setFormOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              <FiPlus size={15} />
              New company
            </button>
            <button
              onClick={signOut}
              title="Sign out"
              className="rounded-lg border border-[var(--color-border)] p-2.5 text-[var(--color-muted)] hover:bg-[var(--color-bg-soft)]"
            >
              <FiLogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 rounded-xl border border-[var(--color-border)] bg-white p-5"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-black text-[var(--color-text)]">Create a client company</h2>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  The administrator receives an invitation and sets their own password. Nobody can
                  sign in to the company until they do.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-bg-soft)]"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { key: "companyName", label: "Company name", required: true, placeholder: "Acme Pty Ltd" },
                { key: "adminEmail", label: "Administrator email", required: true, type: "email", placeholder: "jane@acme.com" },
                { key: "adminName", label: "Administrator name", required: true, placeholder: "Jane Smith" },
                { key: "industry", label: "Industry", placeholder: "Financial Services" },
                { key: "headquarters", label: "Headquarters", placeholder: "Melbourne, Australia" },
                { key: "currency", label: "Currency", placeholder: "AUD" },
              ].map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[var(--color-text)]">
                    {field.label}
                    {field.required && <span className="text-[var(--color-primary)]"> *</span>}
                  </span>
                  <input
                    type={field.type || "text"}
                    required={field.required}
                    value={form[field.key]}
                    placeholder={field.placeholder}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Creating…" : "Create and send invitation"}
              </button>
              <span className="text-xs text-[var(--color-muted)]">
                <FiMail className="mr-1 inline" size={12} />
                The invitation is valid for 7 days.
              </span>
            </div>
          </form>
        )}

        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-soft)] text-left">
                  {["Company", "Administrator", "Status", "Users", "Created", ""].map((h) => (
                    <th
                      key={h || "actions"}
                      className="whitespace-nowrap px-4 py-3 text-xs font-black uppercase tracking-wide text-[var(--color-muted)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--color-muted)]">
                      Loading…
                    </td>
                  </tr>
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-sm font-semibold text-[var(--color-text)]">No companies yet</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        Create one to invite its first administrator.
                      </p>
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr
                      key={company.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-soft)]"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-[var(--color-text)]">{company.companyName}</div>
                        {company.industry && (
                          <div className="text-xs text-[var(--color-muted)]">{company.industry}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {company.administrator ? (
                          <>
                            <div className="text-[var(--color-text)]">{company.administrator.name}</div>
                            <div className="text-xs text-[var(--color-muted)]">
                              {company.administrator.email}
                            </div>
                          </>
                        ) : (
                          <span className="text-[var(--color-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <InvitationBadge administrator={company.administrator} />
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text)]">{company.userCount}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--color-muted)]">
                        {fmtDate(company.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {company.administrator &&
                          company.administrator.invitationStatus !== "accepted" && (
                            <button
                              onClick={() => resend(company)}
                              disabled={resendingId === company.id}
                              title="Send a fresh invitation"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] disabled:opacity-50"
                            >
                              <FiSend size={12} />
                              {resendingId === company.id ? "Sending…" : "Resend"}
                            </button>
                          )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
