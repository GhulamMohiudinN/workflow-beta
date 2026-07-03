"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { forgotPasswordSchema } from "../../formValidationScheme/authSchema";
import { authAPI } from "../../api/auth";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { FiMail, FiArrowLeft, FiBriefcase, FiShield, FiCheckCircle } from "react-icons/fi";

export default function ForgotPasswordPage() {
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(forgotPasswordSchema) });

  const onSubmit = async (data) => {
    setLoading(true); setError(null); setSuccessMessage(null);
    try {
      await authAPI.requestPasswordReset(data.email);
      setSuccessMessage("A password reset link has been sent to your email. Please check your inbox.");
      toast.success("Email sent. Reset your password.");
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Could not send reset email. Please try again.";
      setError(message); toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4">
      <Toaster position="top-right" duration={4000} />

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-[var(--shadow-popover)] border border-[var(--color-border)] p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-[var(--color-primary)] p-3 rounded-xl shadow-md">
              <FiBriefcase className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-[var(--color-text)]">Forgot Password</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)] font-medium">
              Enter your registered email to receive password reset instructions.
            </p>
          </div>

          {successMessage ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-100 mb-4">
                <FiCheckCircle className="h-7 w-7 text-[var(--color-success)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--color-text)] mb-6">{successMessage}</p>
              <Link href="/login" className="text-sm font-black text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Email Address</label>
                <div className="relative">
                  <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-faint)]" />
                  <input
                    type="email" autoComplete="email" {...register("email")}
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border ${errors.email ? "border-red-400" : "border-[var(--color-border)]"} rounded-lg text-sm text-[var(--color-text)] placeholder-[var(--color-faint)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs font-medium text-red-500">{errors.email.message}</p>}
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] py-3 text-sm font-black text-white transition-colors disabled:opacity-70 shadow-md"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              {error && <p className="text-sm font-medium text-red-500 text-center">{error}</p>}

              <div className="flex items-center gap-2 justify-center">
                <FiShield className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
                <span className="text-xs text-[var(--color-muted)] font-medium">Secure reset via encrypted email</span>
              </div>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <Link href="/login" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] flex items-center gap-1">
              <FiArrowLeft className="h-4 w-4" /> Back to login
            </Link>
            <span className="text-[var(--color-border-strong)]">·</span>
            <button onClick={() => router.push("/")} className="font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
