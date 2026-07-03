"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaBuilding } from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { authAPI } from "../../api/auth";
import {
  COMPANY_TYPES,
  INDUSTRIES,
  EMPLOYEE_RANGES,
  workflowTypes,
} from "./content";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
} from "../../formValidationScheme/authSchema";
import {
  FiBriefcase,
  FiGlobe,
  FiUsers,
  FiMapPin,
  FiHash,
  FiCalendar,
  FiArrowRight,
  FiArrowLeft,
  FiCheck,
  FiHelpCircle,
  FiTrendingUp,
  FiLayers,
  FiShield,
  FiUser,
  FiZap,
  FiAlertCircle,
} from "react-icons/fi";

function CompanySetupContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [verifying, setVerifying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const token = useSearchParams().get("token");
  const schemas = {
    1: step1Schema,
    2: step2Schema,
    3: step3Schema,
    4: step4Schema,
  };
  const totalSteps = 4;
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schemas[currentStep]),
    defaultValues: {
      primaryWorkflowTypes: [],
      automationPriority: "medium",
      foundedYear: "",
      expectedWorkflows: "",
      notificationPreferences: {
        email: true,
        slack: false,
        teams: false,
        inApp: true,
      },
    },
  });

  const primaryWorkflowTypes = watch("primaryWorkflowTypes");
  const automationPriority = watch("automationPriority");
  const notificationPreferences = watch("notificationPreferences");

  useEffect(() => {
    const initializePage = async () => {
      if (token) {
        try {
          setVerifying(true);
          const data = await authAPI.verifyEmail(token);
          toast.success(
            data?.message ||
              "Email verified successfully! Please complete your workspace setup.",
          );
          setVerificationError(null);
          setVerifying(false);
          setIsReady(true);
        } catch (error) {
          console.error("Email verification error:", error);
          setVerificationError(
            error.message || "Email verification failed. Please try again.",
          );
          setVerifying(false);
          setIsReady(false);
          return;
        }
      } else {
        const userData = JSON.parse(sessionStorage.getItem("userData"));
        if (userData) {
          setValue("companyEmail", userData.email);
          setValue("adminEmail", userData.email);
        } else {
          router.push("/signup");
        }
      }
    };

    initializePage();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "radio") {
      setValue(name, value, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue(name, value, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleArrayChange = (arrayName, value) => {
    setWorkflowError("");
    const currentArray = watch(arrayName) || [];

    const updatedArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    setValue(arrayName, updatedArray, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleNotificationChange = (channel) => {
    const currentPrefs = watch("notificationPreferences") || {};
    const updatedPrefs = {
      ...currentPrefs,
      [channel]: !currentPrefs[channel],
    };
    setValue("notificationPreferences", updatedPrefs, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleFormData = async () => {
    const formData = getValues();
    const isStepValid = await trigger();
    setWorkflowError("");

    if (isStepValid) {
      if (currentStep === 3 && (formData.primaryWorkflowTypes || []).length === 0) {
        setWorkflowError("Please select at least one workflow type");
        return;
      }
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Final step - Submit to API
        try {
          setLoading(true);

          // Prepare workspace data for API - exactly as expected (no userName field)
          const workspaceData = {
            companyName: formData.companyName,
            companyEmail: formData.companyEmail,
            companyType: formData.companyType,
            headquarters: formData.headquarters,
            foundedYear: formData.foundedYear,
            industry: formData.industry,
            employeeCount: formData.employeeCount,
            currency: formData.currency,
            automationPriority: formData.automationPriority,
            initialTeamSize: formData.initialTeamSize,
            expectedWorkflows: formData.expectedWorkflows,
            taxId: formData.taxId || "",
            registrationNumber: formData.registrationNumber || "",
            timezone: formData.timezone,
            website: formData.website || "",
            phoneNumber: formData.phoneNumber || "",
            primaryWorkflowTypes: formData.primaryWorkflowTypes,
            notificationPreferences: formData.notificationPreferences,
          };

          console.log("Submitting workspace data:", workspaceData);

          // Call the actual API
          const response = await authAPI.createWorkspace(workspaceData);

          console.log("Workspace creation response:", response);

          setLoading(false);
          toast.success("Workspace created successfully!");
          router.push("/login");

        } catch (err) {
          setLoading(false);
          console.error("Error creating workspace:", err);
          console.error("Error details:", err.response?.data || err.message);

          const errorMessage = err.response?.data?.message || "Failed to create workspace. Please try again.";
          toast.error(errorMessage);
        }
      }
    }
  };
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getStepProgress = () => {
    return `${((currentStep - 1) / (totalSteps - 1)) * 100}%`;
  };

  return verifying ? (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] mx-auto mb-4"></div>
        <h2 className="text-xl font-black text-[var(--color-text)] mb-2">Verifying your email...</h2>
        <p className="text-[var(--color-muted)] font-medium">Please wait while we verify your email address.</p>
      </div>
    </div>
  ) : verificationError ? (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-[var(--shadow-card)] mb-6">
          <FiAlertCircle className="h-12 w-12 text-[var(--color-danger)] mx-auto mb-4" />
          <h2 className="text-xl font-black text-[var(--color-text)] mb-2">Verification Failed</h2>
          <p className="text-[var(--color-muted)] font-medium mb-4">{verificationError}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setVerificationError(null); setVerifying(true);
                authAPI.verifyEmail(token)
                  .then(() => { toast.success("Email verified!"); setVerifying(false); setIsReady(true); })
                  .catch((error) => { setVerificationError(error.response?.data?.message || error.message || "Verification failed again."); setVerifying(false); });
              }}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-2.5 px-4 rounded-lg font-semibold transition-colors"
            >Try Again</button>
            <button onClick={() => router.push("/signup")} className="w-full bg-[var(--color-bg-soft)] text-[var(--color-muted)] py-2.5 px-4 rounded-lg font-semibold hover:bg-[var(--color-border)] transition-colors">
              Back to Signup
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : isReady ? (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster duration={4000} position="top-right" />

      {/* Header */}
      <header className="bg-white border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--color-primary)] p-2 rounded-lg">
                <FiBriefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-[var(--color-text)]">WorkflowPro</h1>
                <p className="text-xs text-[var(--color-muted)] font-medium">Company Setup Wizard</p>
              </div>
            </div>
            <div className="text-sm font-semibold text-[var(--color-muted)]">Step {currentStep} of {totalSteps}</div>
          </div>
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-[var(--color-bg-soft)] rounded-full h-2">
              <div className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-500" style={{ width: getStepProgress() }} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Headers */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-black text-[var(--color-text)] mb-2">
            {currentStep === 1 && "Company Information"}
            {currentStep === 2 && "Company Details"}
            {currentStep === 3 && "Workflow Setup"}
            {currentStep === 4 && "Team Configuration"}
          </h2>
          <p className="text-[var(--color-muted)] font-medium text-sm">
            {currentStep === 1 && "Tell us about your company"}
            {currentStep === 2 && "Complete your company profile"}
            {currentStep === 3 && "Configure your workflow preferences"}
            {currentStep === 4 && "Set up your team and notifications"}
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl shadow-[var(--shadow-card)] border border-[var(--color-border)] p-6 sm:p-8">
          {/* Step 1: Basic Company Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBuilding className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="companyName"
                      {...register("companyName")}
                      className="pl-10 block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  <p className="text-red-500 text-sm mt-2">
                    {errors.companyName?.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Type *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiBriefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="companyType"
                      {...register("companyType")}
                      className="pl-10 block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                      required
                    >
                      <option value="">Select company type</option>
                      {COMPANY_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-red-500 text-sm mt-2">
                    {errors.companyType?.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiTrendingUp className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="industry"
                      {...register("industry")}
                      className="pl-10 block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                      required
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-red-500 text-sm mt-2">
                    {errors.industry?.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiHash className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                       name="companyEmail"
                      {...register("companyEmail")}
                      className="pl-10 block w-full border border-gray-300 rounded-lg py-3 px-4 bg-gray-50"
                      placeholder="contact@company.com"
                      required
                    />
                  </div>
                  <p className="text-red-500 text-sm mt-2">
                    {errors.companyEmail?.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    {...register("phoneNumber")}
                    className="block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                    placeholder="+1 (555) 123-4567"
                  />
                  <p className="text-red-500 text-sm mt-2">
                    {errors.phoneNumber?.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiGlobe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="url"
                      name="website"
                      {...register("website")}
                      className="pl-10 block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                      placeholder="https://company.com"
                    />
                  </div>
                  <p className="text-red-500 text-sm mt-2">
                    {errors.website?.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Founded
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="foundedYear"
                      {...register("foundedYear")}
                      min="1800"
                      max={new Date().getFullYear()}
                      className="pl-10 block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                      placeholder="2020"
                    />
                  </div>
                  <p className="text-red-500 text-sm mt-2">
                    {errors.foundedYear?.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Company Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee Count *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUsers className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="employeeCount"
                      {...register("employeeCount")}
                      className="pl-10 block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                      required
                    >
                      <option value="">Select range</option>
                      {EMPLOYEE_RANGES.map((range) => (
                        <option key={range} value={range}>
                          {range} employees
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-red-500 text-sm mt-2">
                    {errors.employeeCount?.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headquarters Location *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="headquarters"
                      {...register("headquarters")}
                      className="pl-10 block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                      placeholder="City, Country"
                      required
                    />
                  </div>
                  <p className="text-red-500 text-sm mt-2">
                    {errors.headquarters?.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    name="timezone"
                    {...register("timezone")}
                    className="block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                  >
                    {Intl.supportedValuesOf("timeZone").map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                  <p className="text-red-500 text-sm mt-2">
                    {errors.timezone?.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Currency *
                  </label>
                  <select
                    name="currency"
                    {...register("currency")}
                    className="block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                  <p className="text-red-500 text-sm mt-2">
                    {errors.currency?.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID / VAT Number
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    {...register("taxId")}
                    className="block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                    placeholder="Enter tax identification number"
                  />
                  <p className="text-red-500 text-sm mt-2">
                    {errors.taxId?.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Registration Number
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    {...register("registrationNumber")}
                    className="block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                    placeholder="Enter registration number"
                  />
                  <p className="text-red-500 text-sm mt-2">
                    {errors.registrationNumber?.message}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-[var(--color-border)]">
                <div className="flex items-start space-x-3">
                  <FiShield className="h-5 w-5 text-[var(--color-primary)] mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700">
                      Your company information is stored securely with enterprise-grade encryption.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Workflow Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  What types of workflows will you be managing? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {workflowTypes.map((type) => (
                    <div
                      key={type}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        primaryWorkflowTypes?.includes(type)
                          ? "border-[var(--color-primary)] bg-blue-50"
                          : "border-gray-300 hover:border-[var(--color-primary)]"
                      }`}
                      onClick={() =>
                        handleArrayChange("primaryWorkflowTypes", type)
                      }
                    >
                      <div
                        className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                          primaryWorkflowTypes?.includes(type)
                            ? "border-[var(--color-primary)] bg-blue-500"
                            : "border-gray-400"
                        }`}
                      >
                        {primaryWorkflowTypes?.includes(type) && (
                          <FiCheck className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {type}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-red-500 text-sm mt-2">{workflowError}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected number of workflows
                  </label>
                  <select
                    {...register("expectedWorkflows")}
                    className="block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                  >
                    <option value="">Select range</option>
                    <option value="1-10">1-10 workflows</option>
                    <option value="11-50">11-50 workflows</option>
                    <option value="51-200">51-200 workflows</option>
                    <option value="200+">200+ workflows</option>
                  </select>
                  <p className="text-red-500 text-sm mt-2">
                    {errors.expectedWorkflows?.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Automation Priority
                  </label>
                  <div className="flex space-x-4">
                    {['low', 'medium', 'high'].map((level) => (
                      <label key={level} className="flex items-center">
                        <input
                          type="radio"
                          name="automationPriority"
                          value={level}
                          checked={automationPriority === level}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {level}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-linear-to-r from-blue-50 to-blue-50 rounded-lg border border-[var(--color-border)]">
                <div className="flex items-start space-x-3">
                  <FiZap className="h-5 w-5 text-[var(--color-primary)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      AI-Powered Suggestions
                    </p>
                    <p className="text-xs text-gray-600">
                      Based on your selections, our AI will suggest optimal
                      workflow structures and automation opportunities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Team Setup */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Team Size
                  </label>
                  <select
                    name="initialTeamSize"
                    {...register("initialTeamSize")}
                    className="block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200"
                  >
                    <option value="1">Just me (Admin)</option>
                    <option value="2-5">2-5 team members</option>
                    <option value="6-20">6-20 team members</option>
                    <option value="21-50">21-50 team members</option>
                    <option value="50+">50+ team members</option>
                  </select>
                  <p className="text-red-500 text-sm mt-2">
                    {errors.initialTeamSize?.message}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Notification Preferences
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(notificationPreferences || {}).map(
                    ([channel, enabled]) => (
                      <div
                        key={channel}
                        className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-[var(--color-primary)] transition-all duration-200"
                      >
                        <div className="flex items-center">
                          <div
                            className={`p-2 rounded-lg mr-3 ${
                              enabled ? "bg-blue-50" : "bg-gray-100"
                            }`}
                          >
                            <FiLayers
                              className={`h-5 w-5 ${
                                enabled ? "text-[var(--color-primary)]" : "text-gray-400"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 capitalize">
                              {channel}
                            </p>
                            <p className="text-xs text-gray-500">
                              {channel === "email" && "Email notifications"}
                              {channel === "slack" && "Slack notifications"}
                              {channel === "teams" && "Microsoft Teams"}
                              {channel === "inApp" && "In-app notifications"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNotificationChange(channel)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ${
                            enabled ? "bg-[var(--color-primary-hover)]" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start space-x-3">
                  <FiHelpCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700">
                      Don&apos;t worry about getting everything perfect now. You
                      can always invite more team members, change notification
                      settings, and add new workflows from your dashboard later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                currentStep === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <FiArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={handleFormData}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-lg font-medium text-white bg-linear-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] hover:from-[var(--color-primary-hover)] hover:to-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting up...
                </>
              ) : currentStep === totalSteps ? (
                <>
                  Complete Setup
                  <FiCheck className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next Step
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="mt-8">
          <div className="flex justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    step === currentStep
                      ? "bg-blue-500 text-white"
                      : step < currentStep
                        ? "bg-blue-50 text-[var(--color-primary)]"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {step < currentStep ? <FiCheck className="w-5 h-5" /> : step}
                </div>
                <span
                  className={`text-xs font-medium ${
                    step === currentStep ? "text-[var(--color-primary)]" : "text-gray-500"
                  }`}
                >
                  {step === 1 && "Basic Info"}
                  {step === 2 && "Details"}
                  {step === 3 && "Workflows"}
                  {step === 4 && "Team"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            Your data is securely stored with enterprise encryption.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            WorkflowPro • Enterprise Workflow Management Platform
          </p>
        </div>
      </footer>
    </div>
  ) : null;
}

export default function CompanySetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompanySetupContent />
    </Suspense>
  );
}
