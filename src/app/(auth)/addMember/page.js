"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { addMemberSchema } from "../../formValidationScheme/authSchema";
import authAPI from "../../api/auth";
export const dynamic = "force-dynamic";
import { FiEye, FiEyeOff, FiLock, FiShield, FiArrowLeft, FiUserPlus } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import FullScreenLoader from "../../(component)/FullScreenLoader";
import AuthPanel from "../AuthPanel";

function AddMemberContent() {
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading,             setLoading]             = useState(false);
  const [screenLoader,        setScreenLoader]        = useState(false);
  const token  = useSearchParams().get("token");
  const router = useRouter();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ resolver: yupResolver(addMemberSchema) });

  useEffect(() => {
    if (!token) { toast.error("No invitation token found"); router.push("/"); return; }
    setScreenLoader(true);
    setValue("email", "Email will be verified from invitation");
    setScreenLoader(false);
  }, [token, router, setValue]);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const response = await authAPI.acceptInvitation({ token, password: formData.password, confirmPassword: formData.confirmPassword });
      toast.success("Successfully joined the workspace!");
      if (response.token) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("refreshToken", response.refreshToken);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("role", response.user?.userType || "admin");
      }
      const acceptedRole = response.user?.userType || "admin";
      router.push(acceptedRole === "member" ? "/users/dashboardUsers" : "/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept invitation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "appearance-none block w-full pl-10 pr-10 py-3 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] placeholder-[var(--color-faint)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all";

  return (
    <React.Fragment>
      <FullScreenLoader loading={screenLoader} />
      <div className="min-h-screen flex bg-[var(--color-bg)]">
        <Toaster position="top-right" duration={6000} />

        {/* ── Left: form ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-start pt-12 px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="bg-[var(--color-primary)] p-4 rounded-xl shadow-md">
                <FiUserPlus className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Back */}
            <div className="flex justify-center lg:justify-start mb-6">
              <button onClick={() => router.push("/")} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] rounded-lg transition-all">
                <FiArrowLeft className="w-4 h-4" /> Back to Home
              </button>
            </div>

            {/* Heading */}
            <div className="text-center lg:text-left mb-8">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                  <FiUserPlus className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <h2 className="text-2xl font-black text-[var(--color-text)]">Join Workspace</h2>
              </div>
              <p className="text-sm text-[var(--color-muted)] font-medium">Set your password to join the workspace</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Create Password</label>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-faint)]" />
                  <input {...register("password")} type={showPassword ? "text" : "password"} className={inputCls} placeholder="Minimum 8 characters" />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff className="h-4 w-4 text-[var(--color-faint)]" /> : <FiEye className="h-4 w-4 text-[var(--color-faint)]" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[var(--color-faint)] font-medium">Must contain at least 1 letter and 1 number</p>
                {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Confirm Password</label>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-faint)]" />
                  <input type={showConfirmPassword ? "text" : "password"} {...register("confirmPassword")} className={inputCls} placeholder="Re-enter your password" />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <FiEyeOff className="h-4 w-4 text-[var(--color-faint)]" /> : <FiEye className="h-4 w-4 text-[var(--color-faint)]" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword.message}</p>}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input id="terms" type="checkbox" {...register("terms")}
                  className="h-4 w-4 mt-0.5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                <label htmlFor="terms" className="text-xs text-[var(--color-muted)] font-medium">
                  I agree to the{" "}
                  <a href="#" className="font-black text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="font-black text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">Privacy Policy</a>
                </label>
              </div>

              {/* Security note */}
              <div className="flex items-center gap-2">
                <FiShield className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
                <span className="text-xs text-[var(--color-muted)] font-medium">Your data is encrypted and stored securely</span>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-black text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Joining Workspace...</>) : "Join Workspace"}
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: panel ────────────────────────────────────────────── */}
        <AuthPanel subtitle="Enterprise Workflow Platform" />
      </div>
    </React.Fragment>
  );
}

export default function AddMemberPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" /></div>}>
      <AddMemberContent />
    </Suspense>
  );
}
