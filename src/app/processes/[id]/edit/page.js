"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBell,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEye,
  FiHelpCircle,
  FiLayers,
  FiPlus,
  FiSave,
  FiSettings,
  FiTrash2,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { processAPI } from "../../../api/processAPI";
import { userAPI } from "../../../api/userAPI";

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-2 block text-xs font-semibold text-slate-700";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)] transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const categories = [
  "Onboarding",
  "HR",
  "Finance",
  "IT",
  "Marketing",
  "Sales",
  "Operations",
  "Customer Support",
  "Legal",
];

const stepsConfig = [
  { number: 1, title: "Basic Info", description: "Process details" },
  { number: 2, title: "Steps", description: "Define workflow steps" },
  { number: 3, title: "Assignments", description: "Assign team members" },
  { number: 4, title: "Settings", description: "Configure options" },
];

const emptyForm = {
  name: "",
  description: "",
  category: "",
  visibility: "private",
  assignedTo: [],
  steps: [],
  notifications: { email: true, slack: false, inApp: true },
  automation: {
    autoAssign: false,
    dueDateReminders: true,
    escalation: false,
  },
};

export default function EditProcessPage() {
  const router = useRouter();
  const { id } = useParams();
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const result = await userAPI.getWorkspaceUsers({ limit: 100 });
        if (result.success) setWorkspaceUsers(result.users || []);
      } catch (err) {
        console.error("Failed to fetch workspace users:", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setError("Missing process id in URL. Unable to load process data.");
      return;
    }

    const loadProcess = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await processAPI.getProcess(id);

        if (!result.success) {
          setError(result.error || "Failed to load process");
          return;
        }

        const process = result.data;
        const stepAssigneeIds = Array.isArray(process.steps)
          ? process.steps
              .map((step) =>
                typeof step.assignee === "object"
                  ? step.assignee?._id
                  : step.assignee,
              )
              .filter(Boolean)
          : [];
        const processAssigneeIds = Array.isArray(process.assignedTo || process.assignees)
          ? (process.assignedTo || process.assignees)
              .map((assignee) =>
                typeof assignee === "string" ? assignee : assignee?._id || assignee?.id,
              )
              .filter(Boolean)
          : [];

        setFormData({
          name: process.name?.toString() || "",
          description: process.description?.toString() || "",
          category: process.category?.toString() || "",
          visibility: process.visibility?.toString() || "private",
          assignedTo: [...new Set([...processAssigneeIds, ...stepAssigneeIds])],
          steps: Array.isArray(process.steps)
            ? process.steps.map((step, index) => ({
                id: step._id || step.id || `step-${index}`,
                _id: step._id || null,
                title: step.title?.toString() || "",
                description: step.description?.toString() || "",
                timeEstimate: step.timeEstimate?.toString() || "1 hour",
                order: index + 1,
                sequenceNo: step.sequenceNo || index + 1,
                notes: step.notes?.toString() || "",
                status:
                  step.status === "pending"
                    ? "draft"
                    : step.status?.toString() || "draft",
                assignee:
                  typeof step.assignee === "object"
                    ? step.assignee?._id || ""
                    : step.assignee || "",
              }))
            : [],
          notifications: {
            email: process.settings?.notifications?.email ?? true,
            slack: process.settings?.notifications?.slack ?? false,
            inApp: process.settings?.notifications?.inApp ?? true,
          },
          automation: {
            autoAssign: process.settings?.automation?.autoAssignTasks ?? false,
            dueDateReminders: process.settings?.automation?.dueDateReminders ?? true,
            escalation: process.settings?.automation?.escalateOverdueTasks ?? false,
          },
        });
      } catch (err) {
        console.error("[Edit] Unexpected error loading process:", err);
        setError("An unexpected error occurred. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProcess();
  }, [id]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStepChange = (stepId, field, value) => {
    setFormData((prev) => {
      const steps = prev.steps.map((step) =>
        step.id === stepId ? { ...step, [field]: value } : step,
      );
      const assignedTo =
        field === "assignee" && value && !prev.assignedTo.includes(value)
          ? [...prev.assignedTo, value]
          : prev.assignedTo;

      return { ...prev, steps, assignedTo };
    });
  };

  const addNewStep = () => {
    setFormData((prev) => {
      const nextOrder = prev.steps.length + 1;
      return {
        ...prev,
        steps: [
          ...prev.steps,
          {
            id: `step-${Date.now()}`,
            _id: null,
            title: `Step ${nextOrder}`,
            description: "Describe this step...",
            assignee: "",
            timeEstimate: "1 hour",
            order: nextOrder,
            sequenceNo: nextOrder,
            notes: "",
            status: "draft",
          },
        ],
      };
    });
  };

  const removeStep = (stepId) => {
    setFormData((prev) => {
      if (prev.steps.length <= 1) return prev;
      return {
        ...prev,
        steps: prev.steps
          .filter((step) => step.id !== stepId)
          .map((step, index) => ({ ...step, order: index + 1, sequenceNo: index + 1 })),
      };
    });
  };

  const moveStep = (index, direction) => {
    setFormData((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.steps.length) return prev;

      const steps = [...prev.steps];
      [steps[index], steps[nextIndex]] = [steps[nextIndex], steps[index]];
      return {
        ...prev,
        steps: steps.map((step, stepIndex) => ({
          ...step,
          order: stepIndex + 1,
          sequenceNo: stepIndex + 1,
        })),
      };
    });
  };

  const validateStep = () => {
    if (activeStep === 1) {
      if (!formData.name.trim()) {
        setError("Process name is required.");
        return false;
      }
      if (!formData.category) {
        setError("Please select a category.");
        return false;
      }
    }

    if (activeStep === 2 && formData.steps.some((step) => !step.title.trim())) {
      setError("All steps must have a title.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep() && activeStep < stepsConfig.length) {
      setActiveStep((current) => current + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep((current) => current - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    if (activeStep !== stepsConfig.length || !validateStep()) {
      setError("Please complete all required information before saving.");
      return;
    }

    setError(null);
    setShowConfirmModal(true);
  };

  const confirmUpdate = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage("");

    try {
      const result = await processAPI.updateProcess(id, formData);

      if (result.success) {
        setSuccessMessage(result.message || "Process updated successfully");
        setShowSuccessModal(true);
        toast.success("Process updated successfully");
      } else {
        setError(result.error || "Failed to update process. Please try again.");
        toast.error("Failed to update process");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await processAPI.deleteProcess(id);
      if (result.success) {
        setSuccessMessage("Process deleted successfully");
        setSuccess(true);
        toast.success("Process deleted successfully");
        window.setTimeout(() => router.push("/processes"), 1200);
      } else {
        setError(result.error || "Failed to delete process. Please try again.");
        toast.error("Failed to delete process");
        setShowDeleteModal(false);
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleAssignment = (memberId) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(memberId)
        ? prev.assignedTo.filter((id) => id !== memberId)
        : [...prev.assignedTo, memberId],
    }));
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-7">
            <SectionIntro
              icon={FiLayers}
              title="Process Definition"
              text="Review the core identity and access model for this workflow."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Process Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => handleInputChange("name", event.target.value)}
                  className={fieldClass}
                  placeholder="e.g. Q4 Financial Audit"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(event) => handleInputChange("category", event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={formData.description}
                onChange={(event) => handleInputChange("description", event.target.value)}
                rows="5"
                className={fieldClass}
                placeholder="Describe the goals and impact of this process..."
              />
            </div>

            <div>
              <label className={labelClass}>Visibility</label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  {
                    value: "private",
                    title: "Private",
                    text: "Only assigned team members can view and manage.",
                  },
                  {
                    value: "public",
                    title: "Public",
                    text: "All workspace members can view this process.",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange("visibility", option.value)}
                    className={`rounded-lg border p-4 text-left transition ${
                      formData.visibility === option.value
                        ? "border-blue-700 bg-blue-50"
                        : "border-slate-300 bg-white hover:border-blue-300"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          formData.visibility === option.value
                            ? "bg-blue-700"
                            : "bg-slate-300"
                        }`}
                      />
                      {option.title}
                    </span>
                    <span className="mt-2 block text-xs font-medium text-slate-500">
                      {option.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <SectionIntro
                icon={FiClock}
                title="Process Steps"
                text="Maintain step order, ownership, timing, and execution status."
              />
              <button type="button" onClick={addNewStep} className={primaryButtonClass}>
                <FiPlus className="h-4 w-4" />
                Add Step
              </button>
            </div>

            <div className="max-h-[560px] space-y-4 overflow-y-auto pr-2">
              {formData.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-md"
                >
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                        Step {step.order}
                      </div>
                      <div className="flex gap-1">
                        <IconButton
                          label="Move step up"
                          disabled={index === 0}
                          onClick={() => moveStep(index, -1)}
                          icon={FiChevronLeft}
                        />
                        <IconButton
                          label="Move step down"
                          disabled={index === formData.steps.length - 1}
                          onClick={() => moveStep(index, 1)}
                          icon={FiChevronRight}
                        />
                      </div>
                    </div>
                    {formData.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(step.id)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <FiTrash2 className="h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>
                        Step Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(event) =>
                          handleStepChange(step.id, "title", event.target.value)
                        }
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Time Estimate</label>
                      <input
                        type="text"
                        value={step.timeEstimate}
                        onChange={(event) =>
                          handleStepChange(step.id, "timeEstimate", event.target.value)
                        }
                        className={fieldClass}
                        placeholder="e.g. 2 hours"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Assignee</label>
                      <select
                        value={step.assignee}
                        onChange={(event) =>
                          handleStepChange(step.id, "assignee", event.target.value)
                        }
                        className={fieldClass}
                        disabled={loadingUsers}
                      >
                        <option value="">Select team member</option>
                        {workspaceUsers.map((member) => (
                          <option key={member._id || member.id} value={member._id || member.id}>
                            {member.name || member.email} ({member.role || "member"})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Status</label>
                      <select
                        value={step.status}
                        onChange={(event) =>
                          handleStepChange(step.id, "status", event.target.value)
                        }
                        className={fieldClass}
                      >
                        <option value="draft">Draft</option>
                        <option value="inprogress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className={labelClass}>Description</label>
                    <textarea
                      value={step.description}
                      onChange={(event) =>
                        handleStepChange(step.id, "description", event.target.value)
                      }
                      rows="3"
                      className={fieldClass}
                    />
                  </div>
                  <div className="mt-4">
                    <label className={labelClass}>Notes</label>
                    <textarea
                      value={step.notes}
                      onChange={(event) =>
                        handleStepChange(step.id, "notes", event.target.value)
                      }
                      rows="2"
                      className={fieldClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <SectionIntro
              icon={FiUsers}
              title="Team Assignments"
              text="Choose the people who can access this process and receive updates."
            />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {loadingUsers ? (
                <div className="col-span-full rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
                  Loading workspace members...
                </div>
              ) : (
                workspaceUsers.map((member) => {
                  const memberId = member._id || member.id;
                  const selected = formData.assignedTo.includes(memberId);

                  return (
                    <button
                      key={memberId}
                      type="button"
                      onClick={() => toggleAssignment(memberId)}
                      className={`flex min-h-[86px] items-center gap-3 rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-700 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-300"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                          selected ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {selected ? <FiCheck /> : (member.name || member.email || "U").charAt(0)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-slate-900">
                          {member.name || "Unnamed member"}
                        </span>
                        <span className="block truncate text-xs font-medium text-slate-500">
                          {member.email}
                        </span>
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">
                        {member.role || "member"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <FiHelpCircle className="mt-0.5 h-5 w-5 text-blue-700" />
                <p className="text-sm font-medium text-slate-700">
                  Step assignees are automatically added here so they keep access to the
                  process they are responsible for.
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-7">
            <SectionIntro
              icon={FiSettings}
              title="Process Settings"
              text="Tune notifications and automation before saving the update."
            />
            <SettingsGroup
              icon={FiBell}
              title="Notifications"
              items={formData.notifications}
              labels={{
                email: ["Email Notifications", "Receive email updates for process activity."],
                slack: ["Slack Notifications", "Send updates into the connected Slack channel."],
                inApp: ["In-app Notifications", "Show updates inside the workspace."],
              }}
              onToggle={(key) =>
                handleInputChange("notifications", {
                  ...formData.notifications,
                  [key]: !formData.notifications[key],
                })
              }
            />
            <SettingsGroup
              icon={FiZap}
              title="Automation Rules"
              items={formData.automation}
              labels={{
                autoAssign: ["Auto-assign Tasks", "Assign tasks to available team members."],
                dueDateReminders: ["Due Date Reminders", "Send reminders before tasks are due."],
                escalation: ["Escalate Overdue Tasks", "Escalate overdue work to managers."],
              }}
              onToggle={(key) =>
                handleInputChange("automation", {
                  ...formData.automation,
                  [key]: !formData.automation[key],
                })
              }
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="-m-4 flex min-h-[calc(100vh-9rem)] items-center justify-center bg-linear-to-br from-blue-50 via-sky-50 to-violet-50 p-6 sm:-m-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-2 border-blue-100 border-t-blue-700" />
          <p className="text-sm font-semibold text-slate-600">Loading process data...</p>
        </div>
      </div>
    );
  }

  if (success) {
    const deleted = successMessage.toLowerCase().includes("deleted");

    return (
      <div className="-m-4 min-h-[calc(100vh-9rem)] bg-linear-to-br from-blue-50 via-sky-50 to-violet-50 p-4 sm:-m-6 sm:p-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-green-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(34,197,94,0.12)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <FiCheck className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-950">
            {deleted ? "Process Deleted" : "Process Updated"}
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {deleted
              ? "The process has been permanently deleted."
              : `${formData.name} has been updated successfully.`}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {!deleted && (
              <Link href={`/processes/${id}`} className={primaryButtonClass}>
                View Process
              </Link>
            )}
            <Link href="/processes" className={secondaryButtonClass}>
              Back to Processes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-4 min-h-[calc(100vh-9rem)] bg-linear-to-br from-blue-50 via-sky-50 to-violet-50 p-4 sm:-m-6 sm:p-6">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link
          href={`/processes/${id}`}
          className="inline-flex items-center text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Back to Process
        </Link>

        <div className="text-center md:absolute md:left-1/2 md:-translate-x-1/2">
          <h1 className="text-2xl font-black text-slate-950">Edit Process</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Refine your high-fidelity enterprise workflow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreview((current) => !current)}
            className={secondaryButtonClass}
          >
            <FiEye className="h-4 w-4" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <FiTrash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <ProcessStepper
        steps={stepsConfig}
        activeStep={activeStep}
        onStepClick={(stepNumber) => stepNumber < activeStep && setActiveStep(stepNumber)}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className={showPreview ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
            <form onSubmit={(event) => event.preventDefault()} className="p-8">
              {renderStepContent()}

              <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
                {activeStep === 1 ? (
                  <Link
                    href={`/processes/${id}`}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                  >
                    <span className="text-lg leading-none">x</span>
                    Cancel
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                )}

                {activeStep === stepsConfig.length ? (
                  <button type="button" onClick={handleSubmit} disabled={isSubmitting} className={primaryButtonClass}>
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Updating Process...
                      </>
                    ) : (
                      <>
                        <FiSave className="h-4 w-4" />
                        Update Process
                      </>
                    )}
                  </button>
                ) : (
                  <button type="button" onClick={handleNext} className={primaryButtonClass}>
                    Save & Continue
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {showPreview && <PreviewPanel formData={formData} />}
      </div>

      {showDeleteModal && (
        <DeleteProcessModal
          name={formData.name}
          loading={isDeleting}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <FiAlertCircle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-950">Confirm process update</h3>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Are you sure you want to save these changes to this process?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmUpdate}
                disabled={isSubmitting}
                className={primaryButtonClass}
              >
                {isSubmitting ? "Saving..." : "Confirm Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-green-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
              <FiCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-slate-950">Process updated</h3>
            <p className="mt-2 text-sm font-medium text-slate-600">
              {successMessage || "Your changes have been saved successfully."}
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className={secondaryButtonClass}
              >
                Continue Editing
              </button>
              <Link href={`/processes/${id}`} className={primaryButtonClass}>
                View Process
              </Link>
              <Link href="/processes" className={secondaryButtonClass}>
                Back to Processes
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProcessStepper({ steps, activeStep, onStepClick }) {
  return (
    <div className="mx-auto mb-7 max-w-3xl px-4">
      <div className="relative flex items-start justify-between">
        <div className="absolute left-8 right-8 top-4 h-px bg-blue-100" />
        {steps.map((step) => {
          const isActive = step.number === activeStep;
          const isComplete = step.number < activeStep;

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => onStepClick(step.number)}
              className="relative flex min-w-0 flex-col items-center gap-2"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black shadow-sm transition ${
                  isActive
                    ? "bg-blue-700 text-white shadow-blue-200"
                    : isComplete
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {isComplete ? <FiCheck className="h-4 w-4" /> : step.number}
              </span>
              <span
                className={`max-w-24 truncate text-center text-[10px] font-black ${
                  isActive ? "text-blue-700" : "text-slate-500"
                }`}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionIntro({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-xs font-medium text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function IconButton({ label, icon: Icon, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function SettingsGroup({ icon: Icon, title, items, labels, onToggle }) {
  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-900">
        <Icon className="h-4 w-4 text-blue-700" />
        {title}
      </h3>
      <div className="space-y-3">
        {Object.entries(items).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div>
              <p className="text-sm font-bold text-slate-900">{labels[key][0]}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{labels[key][1]}</p>
            </div>
            <button
              type="button"
              onClick={() => onToggle(key)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                value ? "bg-blue-700" : "bg-slate-300"
              }`}
              aria-pressed={value}
            >
              <span
                className={`inline-block h-6 w-6 rounded-full bg-white shadow transition ${
                  value ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewPanel({ formData }) {
  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
        <div className="border-b border-slate-200 bg-blue-50/70 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-black text-slate-950">
            <FiEye className="h-4 w-4 text-blue-700" />
            Live Preview
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            See how your process will look
          </p>
        </div>
        <div className="space-y-5 p-5">
          <PreviewRows
            title="Basic Info"
            rows={[
              ["Name", formData.name || "Not set"],
              ["Category", formData.category || "Not set"],
              ["Visibility", formData.visibility],
            ]}
          />
          <PreviewRows
            title="Workflow"
            rows={[
              ["Total Steps", formData.steps.length],
              ["Assigned Members", formData.assignedTo.length],
            ]}
          />
          <div className="border-t border-slate-200 pt-3">
            <h3 className="mb-3 text-xs font-black uppercase text-slate-900">
              Steps Preview
            </h3>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {formData.steps.slice(0, 4).map((step) => (
                <div
                  key={step.id}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {step.order}
                  </div>
                  <span className="flex-1 truncate text-slate-700">{step.title}</span>
                  <FiClock className="h-3 w-3 text-slate-400" />
                  <span className="text-xs text-slate-500">{step.timeEstimate}</span>
                </div>
              ))}
              {formData.steps.length > 4 && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  +{formData.steps.length - 4} more steps
                </p>
              )}
            </div>
          </div>
          <div className="border-t border-slate-200 pt-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FiZap className="h-5 w-5 text-blue-700" />
                <p className="text-sm font-bold text-slate-900">AI Ready</p>
              </div>
              <p className="text-xs text-slate-600">
                After saving, AI can analyze the workflow and suggest optimizations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewRows({ title, rows }) {
  return (
    <div className="border-t border-slate-200 pt-3 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-xs font-black uppercase text-slate-900">{title}</h3>
      <div className="space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <span className="text-slate-500">{label}:</span>
            <span className="max-w-[180px] truncate font-bold capitalize text-slate-900">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorAlert({ message, onDismiss }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div className="flex-1">
        <h3 className="text-sm font-black text-red-900">Error</h3>
        <p className="mt-1 text-sm font-medium text-red-700">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md px-2 text-lg leading-none text-red-500 hover:bg-red-100"
        aria-label="Dismiss error"
      >
        x
      </button>
    </div>
  );
}

function DeleteProcessModal({ name, loading, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close delete dialog"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <FiAlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-black text-slate-950">Delete Process?</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-slate-600">
          Are you sure you want to delete{" "}
          <span className="font-bold text-slate-950">{name || "this process"}</span>?
          This action cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={secondaryButtonClass}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <FiTrash2 className="h-4 w-4" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
