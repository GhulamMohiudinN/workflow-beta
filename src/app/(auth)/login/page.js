"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "../../formValidationScheme/authSchema";
import authAPI from "../../api/auth";
import toast, { Toaster } from "react-hot-toast";
import { FiEye, FiEyeOff, FiLock, FiMail, FiShield, FiArrowLeft, FiBriefcase } from "react-icons/fi";
import AuthPanel from "../AuthPanel";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(loginSchema) });

  const handleLogin = async (formData) => {
    setLoading(true); setError(null);
    try {
      const data = await authAPI.login(formData);
      toast.success("Login successful!");
      const role = data.user?.userType || data.role || localStorage.getItem("role");
      router.push(role === "member" ? "/users/dashboardUsers" : "/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      toast.error(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── shared input class ── */
  const inputCls = "appearance-none block w-full pl-10 pr-3 py-3 border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder-[var(--color-faint)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all text-sm";

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      <Toaster position="top-right" duration={4000} />

      {/* ── Left: form ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-start pt-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-[var(--color-primary)] p-4 rounded-xl shadow-md">
              <FiBriefcase className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Back */}
          <div className="flex justify-center lg:justify-start mb-6">
            <button onClick={() => router.push("/")} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] rounded-lg transition-all font-semibold">
              <FiArrowLeft className="w-4 h-4" /> Back to Home
            </button>
          </div>

          {/* Heading */}
          <div className="text-center lg:text-left mb-8">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                <FiBriefcase className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <h2 className="text-2xl font-black text-[var(--color-text)]">WorkflowPro</h2>
            </div>
            <p className="text-sm text-[var(--color-muted)] font-medium">Enterprise Workflow Management Platform</p>
          </div>

          <form className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Work Email Address</label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-faint)]" />
                <input type="email" {...register("email")} className={inputCls} placeholder="your@company.com" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-faint)]" />
                <input {...register("password")} type={showPassword ? "text" : "password"} autoComplete="current-password" className={`${inputCls} pr-10`} placeholder="Enter your password" />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff className="h-4 w-4 text-[var(--color-faint)] hover:text-[var(--color-muted)]" /> : <FiEye className="h-4 w-4 text-[var(--color-faint)] hover:text-[var(--color-muted)]" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>

            {/* Remember / forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
                Forgot password?
              </Link>
            </div>

            {/* Security hint */}
            <div className="flex items-center gap-2">
              <FiShield className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
              <span className="text-xs text-[var(--color-muted)] font-medium">Enterprise-grade security with MongoDB encryption</span>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit(handleLogin)}
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-black text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Signing in...</>) : "Access Workspace"}
            </button>

            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

            <p className="text-center text-xs text-[var(--color-muted)] font-medium">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-black text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">Request enterprise access</Link>
            </p>
          </form>
        </div>
      </div>

      {/* ── Right: panel ────────────────────────────────────────────────── */}
      <AuthPanel subtitle="Enterprise Workflow Management" />
    </div>
  );
}
