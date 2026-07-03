"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { resetPasswordSchema } from "../../formValidationScheme/authSchema";
import { authAPI } from "../../api/auth";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { FiEye, FiEyeOff, FiLock, FiBriefcase, FiCheckCircle } from "react-icons/fi";

export default function ResetPasswordClient({ token }) {
  const [loading,             setLoading]             = useState(false);
  const [error,               setError]               = useState(null);
  const [success,             setSuccess]             = useState(null);
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data) => {
    if (!token) { setError("Reset token is missing. Please use the link from your email."); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      await authAPI.resetPassword(token, data.password, data.confirmPassword);
      setSuccess("Password reset successfully. Redirecting to login...");
      toast.success("Password reset successful!");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Unable to reset password. Please try again.";
      setError(message); toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fieldCls = (hasError) =>
    `mt-1 block w-full rounded-lg border px-3 py-3 text-sm text-[var(--color-text)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all ${hasError ? "border-red-400" : "border-[var(--color-border)]"}`;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4">
      <Toaster position="top-right" duration={4000} />

      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-[var(--shadow-popover)] border border-[var(--color-border)] p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-[var(--color-primary)] p-3 rounded-xl shadow-md">
              <FiBriefcase className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-[var(--color-text)]">Reset Password</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)] font-medium">Create a new password for your account.</p>
          </div>

          {success ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-100 mb-4">
                <FiCheckCircle className="h-7 w-7 text-[var(--color-success)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--color-success)] mb-2">{success}</p>
            </div>
          ) : token ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* New password */}
              <div className="relative">
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">
                  <FiLock className="inline mr-1.5 h-4 w-4" />New Password
                </label>
                <input id="password" type={showPassword ? "text" : "password"} {...register("password")} className={fieldCls(!!errors.password)} placeholder="Minimum 8 characters" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-10 text-[var(--color-faint)] hover:text-[var(--color-muted)]">
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
                {errors.password && <p className="mt-1 text-xs font-medium text-red-500">{errors.password.message}</p>}
              </div>

              {/* Confirm password */}
              <div className="relative">
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">
                  <FiLock className="inline mr-1.5 h-4 w-4" />Confirm Password
                </label>
                <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} {...register("confirmPassword")} className={fieldCls(!!errors.confirmPassword)} placeholder="Re-enter your password" />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-10 text-[var(--color-faint)] hover:text-[var(--color-muted)]">
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
                {errors.confirmPassword && <p className="mt-1 text-xs font-medium text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] py-3 text-sm font-black text-white transition-colors disabled:opacity-70 shadow-md"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              {error  && <p className="text-sm font-medium text-red-500 text-center">{error}</p>}
            </form>
          ) : (
            <div className="text-sm font-medium text-red-500 text-center">
              Reset token missing. Please use the link from your email.
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
