"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI } from "../../api/auth";
export const dynamic = "force-dynamic";
import { FiMail, FiCheckCircle, FiClock, FiArrowLeft, FiRefreshCw, FiAlertCircle, FiShield, FiBriefcase } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

function EmailVerificationContent() {
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const [userData,  setUserData]  = useState(null);
  const [verifying, setVerifying] = useState(false);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token");

  const handleVerifyEmail = async (t) => {
    try {
      setVerifying(true);
      const data = await authAPI.verifyEmail(t);
      toast.success(data?.message || "Verified! Setting up your workspace…");
      sessionStorage.removeItem("userData");
      setTimeout(() => router.push(`/workspaceCreation?token=${t}`), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Verification failed. Please try again.");
      setVerifying(false);
    }
  };

  useEffect(() => {
    const data = JSON.parse(sessionStorage.getItem("userData") || "null");
    setUserData(data);
    if (token) handleVerifyEmail(token);
  }, [token]);

  useMemo(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    try {
      setResending(true);
      if (userData?.email) {
        await authAPI.resendVerification(userData.email);
        toast.success("Verification email sent.");
      } else {
        toast.error("Email not found. Sign up to continue.");
        router.push("/signup"); return;
      }
      setCountdown(60); setResending(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend email. Try again.");
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Toaster duration={4000} position="top-right" />

      {/* Back */}
      <div className="absolute top-6 left-6">
        <button onClick={() => router.push("/login")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white rounded-lg transition-all border border-[var(--color-border)] bg-white/70"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Login
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="bg-[var(--color-primary)] p-5 rounded-2xl shadow-lg">
              <FiMail className="h-14 w-14 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-md border border-[var(--color-border)]">
              <FiCheckCircle className="h-5 w-5 text-[var(--color-success)]" />
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 shadow-[var(--shadow-popover)] rounded-xl border border-[var(--color-border)] sm:px-10">
          <div className="text-center">
            <h2 className="text-2xl font-black text-[var(--color-text)] mb-3">Verify Your Email</h2>
            <p className="text-[var(--color-muted)] font-medium text-sm mb-1">We&apos;ve sent a verification link to your email account.</p>
            <p className="text-[var(--color-muted)] text-xs font-medium">Click the link in the email to verify your account and access your workspace.</p>
          </div>

          {/* Info rows */}
          <div className="mt-7 space-y-4">
            {[
              { icon: FiClock,       title: "Link Expires",        desc: "The verification link will expire in 24 hours" },
              { icon: FiAlertCircle, title: "Check Spam Folder",   desc: "If you don't see the email, check your spam or junk folder" },
              { icon: FiShield,      title: "Secure Verification", desc: "This helps us ensure the security of your workspace" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 shrink-0">
                  <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h4 className="font-black text-[var(--color-text)] text-sm">{title}</h4>
                  <p className="text-xs text-[var(--color-muted)] font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Resend button */}
          <div className="mt-7">
            <button
              onClick={handleResendEmail}
              disabled={resending || countdown > 0 || verifying}
              className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-black text-white transition-all ${
                countdown > 0 || resending || verifying
                  ? "bg-[var(--color-faint)] cursor-not-allowed"
                  : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md"
              }`}
            >
              {verifying  ? (<><FiRefreshCw className="animate-spin h-4 w-4 mr-2" />Verifying...</>)
               : resending ? (<><FiRefreshCw className="animate-spin h-4 w-4 mr-2" />Sending...</>)
               : countdown > 0 ? `Resend Email (${countdown}s)`
               : (<><FiMail className="h-4 w-4 mr-2" />Resend Verification Email</>)}
            </button>
          </div>

          {/* Help links */}
          <div className="mt-5 pt-5 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-muted)] font-medium">
            <p className="mb-2">Still having trouble?</p>
            <div className="flex justify-center items-center gap-3">
              <button onClick={() => router.push("/contact")} className="font-black text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">Contact Support</button>
              <span className="text-[var(--color-border-strong)]">·</span>
              <button onClick={() => router.push("/login")} className="font-black text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">Try Different Email</button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-[var(--color-muted)] text-xs font-medium">
            <FiShield className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            All verification emails are encrypted.
          </div>
          <p className="mt-1 text-xs text-[var(--color-faint)] font-medium">WorkflowPro · Enterprise Workflow Management Platform</p>
        </div>
      </div>
    </div>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" /></div>}>
      <EmailVerificationContent />
    </Suspense>
  );
}
