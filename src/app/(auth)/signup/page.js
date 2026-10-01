"use client";

/**
 * Access is by invitation.
 *
 * This route used to host the self-registration form. Companies are now created
 * by a platform operator who invites the administrator, so the form was removed
 * (the backend refuses /users/signup unless ALLOW_PUBLIC_SIGNUP is set — see
 * src/config/config.js there). The route itself is kept rather than deleted so
 * that existing links, bookmarks and the "Request enterprise access" link on
 * the sign-in page explain the situation instead of 404ing.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiMail, FiShield, FiLogIn } from "react-icons/fi";
import AuthPanel from "../AuthPanel";

const CONTACT_EMAIL = "info@reseauxaccess.com";

export default function RequestAccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      {/* ── Left: message ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-start pt-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/logo.png" alt="Iris Monde Workspace" className="h-16 w-16 rounded-[7px] object-contain shadow-md" />
          </div>

          {/* Back */}
          <div className="flex justify-center lg:justify-start mb-6">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] rounded-lg transition-all font-semibold"
            >
              <FiArrowLeft className="w-4 h-4" /> Back to Home
            </button>
          </div>

          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
            <FiShield className="h-6 w-6 text-[var(--color-primary)]" />
          </div>

          <h2 className="text-2xl font-black text-[var(--color-text)]">Access is by invitation</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
            Iris Monde Workspace isn&apos;t open for self-registration. Each company is set up for
            you, and its administrator receives an invitation by email.
          </p>

          <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-black text-[var(--color-text)]">Already been invited?</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-muted)]">
              Open the link in your invitation email to set your password. Once that&apos;s done you
              can sign in normally.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
            >
              <FiLogIn className="h-4 w-4" />
              Go to sign in
            </Link>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-5">
            <h3 className="text-sm font-black text-[var(--color-text)]">Need access for your organisation?</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-muted)]">
              Get in touch and we&apos;ll set up your workspace and invite your administrator.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Iris%20Monde%20Workspace%20access`}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-bold text-[var(--color-text)] transition-all hover:bg-[var(--color-bg-soft)]"
            >
              <FiMail className="h-4 w-4" />
              Request access
            </a>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--color-faint)]">
            Lost your invitation?{" "}
            <Link href="/forgot-password" className="font-bold text-[var(--color-primary)] hover:underline">
              Reset your password
            </Link>{" "}
            or contact your administrator.
          </p>
        </div>
      </div>

      {/* ── Right: shared panel ─────────────────────────────────────────── */}
      <AuthPanel subtitle="Enterprise Workflow Platform" />
    </div>
  );
}
