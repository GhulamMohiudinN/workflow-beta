"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { signupSchema } from "../../formValidationScheme/authSchema";
import { useDispatch, useSelector } from "react-redux";
import { signupUser } from "../../store/slices/authSlice";
import { FiEye, FiEyeOff, FiLock, FiMail, FiShield, FiArrowLeft, FiUserPlus, FiUser, FiGlobe, FiBriefcase } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import AuthPanel from "../AuthPanel";

export default function SignupPage() {
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted,       setTermsAccepted]       = useState(false);
  const router   = useRouter();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(signupSchema) });

  const onSubmit = async (formData) => {
    try {
      const result = await dispatch(signupUser(formData)).unwrap();
      if (result?.user) sessionStorage.setItem("userData", JSON.stringify(result.user));
      toast.success("Account created. Verify your email to continue", { duration: 4000 });
      router.push("/emailVerfication");
    } catch (error) {
      toast.error(error || "Signup failed. Please try again.");
    }
  };

  const inputCls = "appearance-none block w-full pl-10 pr-3 py-3 border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder-[var(--color-faint)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all text-sm";

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      <Toaster position="top-center" />

      {/* ── Left: form ────────────────────────────────────────────────── */}
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
            <button onClick={() => router.push("/")} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] rounded-lg transition-all font-semibold">
              <FiArrowLeft className="w-4 h-4" /> Back to Home
            </button>
          </div>

          {/* Heading */}
          <div className="text-center lg:text-left mb-8">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                <FiUserPlus className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <h2 className="text-2xl font-black text-[var(--color-text)]">Create Account</h2>
            </div>
            <p className="text-sm text-[var(--color-muted)] font-medium">Start your enterprise workflow management journey</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Full Name</label>
              <div className="relative">
                <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-faint)]" />
                <input type="text" {...register("name")} className={inputCls} placeholder="John Doe" />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Email Address</label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-faint)]" />
                <input type="email" {...register("email")} className={inputCls} placeholder="john@example.com" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Create Password</label>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-faint)]" />
                <input {...register("password")} type={showPassword ? "text" : "password"} className={`${inputCls} pr-10`} placeholder="Minimum 8 characters" />
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
                <input type={showConfirmPassword ? "text" : "password"} {...register("confirmPassword")} className={`${inputCls} pr-10`} placeholder="Re-enter your password" />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <FiEyeOff className="h-4 w-4 text-[var(--color-faint)]" /> : <FiEye className="h-4 w-4 text-[var(--color-faint)]" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword.message}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input id="terms" type="checkbox" {...register("terms")} checked={termsAccepted} required
                onChange={(e) => setTermsAccepted(e.target.checked)}
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
              <span className="text-xs text-[var(--color-muted)] font-medium">Your data is encrypted and stored securely with MongoDB Atlas</span>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-black text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Creating Account...</>) : "Create Workspace"}
            </button>

            <p className="text-center text-xs text-[var(--color-muted)] font-medium">
              Already have an account?{" "}
              <Link href="/login" className="font-black text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">Sign in to your workspace</Link>
            </p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--color-border)]" /></div>
              <div className="relative flex justify-center text-xs"><span className="px-2 bg-[var(--color-bg)] text-[var(--color-muted)] font-medium">For enterprise clients</span></div>
            </div>

            <div className="text-center">
              <button type="button" onClick={() => router.push("/contact")} className="inline-flex items-center text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
                <FiGlobe className="mr-2 h-4 w-4" /> Need custom enterprise solution? Contact sales
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Right: panel ──────────────────────────────────────────────── */}
      <AuthPanel subtitle="Enterprise Workflow Platform" />
    </div>
  );
}
