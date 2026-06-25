"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { processAPI } from "../../api/processAPI";
import { userAPI } from "../../api/userAPI";
import { templateAPI } from "../../api/templateAPI";
import {
  FiLayers,
  FiPlus,
  FiArrowLeft,
  FiSave,
  FiUsers,
  FiClock,
  FiAlertCircle,
  FiCheck,
  FiChevronRight,
  FiChevronLeft,
  FiTrash2,
  FiHelpCircle,
  FiZap,
  FiUpload,
  FiBell,
  FiSettings,
  FiEye,
  FiCopy,
} from "react-icons/fi";

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-2 block text-xs font-semibold text-slate-700";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)] transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700";

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

export default function NewProcessPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveOptions, setSaveOptions] = useState({ process: true, template: false });
  const [saveProgress, setSaveProgress] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    priority: "High",
    estimatedDuration: "",
    visibility: "private",
    assignedTo: [],
    steps: [
      {
        id: 1,
        title: "Initial Review",
        description: "Review initial requirements",
        assignee: "",
        timeEstimate: "2 hours",
        order: 1,
        notes: "",
      },
      {
        id: 2,
        title: "Approval",
        description: "Get manager approval",
        assignee: "",
        timeEstimate: "1 day",
        order: 2,
        notes: "",
      },
    ],
    notifications: { email: true, slack: false, inApp: true },
    automation: {
      autoAssign: false,
      dueDateReminders: true,
      escalation: false,
    },
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

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


  const steps = [
    { number: 1, title: "Basic Info", description: "Process details" },
    { number: 2, title: "Steps", description: "Define workflow steps" },
    { number: 3, title: "Assignments", description: "Assign team members" },
    { number: 4, title: "Settings", description: "Configure options" },
  ];

  // ── Fetch Workspace Users ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const result = await userAPI.getWorkspaceUsers({ limit: 100 });
        if (result.success) {
          setWorkspaceUsers(result.users || []);
        }
      } catch (err) {
        console.error("Failed to fetch workspace users:", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // ── Template Auto-Fill ─────────────────────────────────────────────────────
  useEffect(() => {
    const fillFromTemplate = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const templateId = urlParams.get("templateId");
        
        if (templateId) {
          const result = await templateAPI.getTemplate(templateId);
          if (result.success && result.data) {
            const t = result.data;
            setFormData(prev => ({
              ...prev,
              name: t.name || "",
              description: t.description || "",
              category: t.category || "",
              notifications: t.settings?.notifications || prev.notifications,
              automation: t.settings?.automation || prev.automation,
              steps: (t.steps && t.steps.length > 0) ? t.steps.map((s, i) => ({
                id: Math.random().toString(36).substr(2, 9),
                title: s.title || `Step ${i + 1}`,
                description: s.description || "",
                timeEstimate: s.timeEstimate || "1d",
                order: s.sequence || s.order || i + 1,
                notes: s.notes || "",
                assignee: ""
              })) : prev.steps
            }));
            
            // By default, if using a template, select "Process Only" for saving
            setSaveOptions({ process: true, template: false });
          }
        }
      } catch (err) {
        console.error("Failed to load template:", err);
      }
    };
    fillFromTemplate();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStepChange = (stepId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId ? { ...step, [field]: value } : step,
      ),
    }));
  };

  const addNewStep = () => {
    const newStepId = formData.steps.length + 1;
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          id: newStepId,
          title: `Step ${newStepId}`,
          description: "Describe this step...",
          assignee: "",
          timeEstimate: "1 hour",
          order: newStepId,
          notes: "",
        },
      ],
    }));
  };

  const removeStep = (stepId) => {
    if (formData.steps.length > 1) {
      setFormData((prev) => ({
        ...prev,
        steps: prev.steps.filter((step) => step.id !== stepId),
      }));
    }
  };

  const moveStepUp = (index) => {
    if (index > 0) {
      const newSteps = [...formData.steps];
      [newSteps[index], newSteps[index - 1]] = [
        newSteps[index - 1],
        newSteps[index],
      ];
      newSteps.forEach((step, idx) => {
        step.order = idx + 1;
      });
      setFormData((prev) => ({ ...prev, steps: newSteps }));
    }
  };

  const moveStepDown = (index) => {
    if (index < formData.steps.length - 1) {
      const newSteps = [...formData.steps];
      [newSteps[index], newSteps[index + 1]] = [
        newSteps[index + 1],
        newSteps[index],
      ];
      newSteps.forEach((step, idx) => {
        step.order = idx + 1;
      });
      setFormData((prev) => ({ ...prev, steps: newSteps }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (activeStep !== steps.length) {
      setError("Please complete all steps before submitting.");
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      setError("Process name is required.");
      return;
    }
    if (!formData.category) {
      setError("Please select a category.");
      return;
    }
    if (formData.steps.some((step) => !step.title.trim())) {
      setError("All steps must have a title.");
      return;
    }

    setShowSaveModal(true);
  };

  const executeSave = async () => {
    if (!saveOptions.process && !saveOptions.template) {
      setError("Please select at least one option.");
      return;
    }

    setIsSubmitting(true);
    setSaveProgress(true);
    setError(null);
    setSuccessMessage("");

    try {
      const promises = [];
      if (saveOptions.process) {
        promises.push(processAPI.createProcess(formData));
      }
      if (saveOptions.template) {
        promises.push(templateAPI.createTemplate(formData));
      }

      const results = await Promise.all(promises);
      const errors = results.filter((r) => !r.success);

      if (errors.length > 0) {
        setError(errors[0].error || "Failed to save selected options.");
        console.error("Errors during save:", errors);
      } else {
        setSuccessMessage("Successfully saved!");
        setSuccess(true);
        setShowSaveModal(false);

        // Redirect after delay based on selection
        setTimeout(() => {
          if (saveOptions.process && !saveOptions.template) router.push("/processes");
          else if (saveOptions.template && !saveOptions.process) router.push("/templates");
          else router.push("/processes");
        }, 2000);
      }
    } catch (err) {
      const errorMessage =
        err.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      console.error("Unexpected error:", err);
    } finally {
      setIsSubmitting(false);
      setSaveProgress(false);
    }
  };

  const validateStep = () => {
    switch (activeStep) {
      case 1:
        if (formData.name.trim() === "") {
          alert("Please enter a process name");
          return false;
        }
        if (formData.category === "") {
          alert("Please select a category");
          return false;
        }
        return true;
      case 2:
        const invalidSteps = formData.steps.filter(
          (step) => step.title.trim() === "",
        );
        if (invalidSteps.length > 0) {
          alert(
            `Please enter titles for all steps (Step ${invalidSteps[0].order} is empty)`,
          );
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep() && activeStep < steps.length) {
      setActiveStep(activeStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-7">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <FiLayers className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-950">
                  Process Definition
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Establish the core identity and objective of this operational workflow.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Process Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
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
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows="5"
                className={fieldClass}
                placeholder="Describe the goals and impact of this process..."
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {["High", "Medium", "Low"].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => handleInputChange("priority", priority)}
                      className={`h-9 rounded-md border text-xs font-bold transition ${
                        formData.priority === priority
                          ? "border-blue-700 bg-blue-50 text-blue-700"
                          : "border-slate-300 bg-white text-slate-600 hover:border-blue-300"
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Estimated Duration</label>
                <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                  <input
                    type="number"
                    min="1"
                    value={formData.estimatedDuration}
                    onChange={(e) =>
                      handleInputChange("estimatedDuration", e.target.value)
                    }
                    className="min-w-0 flex-1 px-4 py-3 text-sm outline-none"
                    placeholder="e.g. 14"
                  />
                  <span className="flex items-center border-l border-slate-200 px-4 text-xs font-bold text-slate-600">
                    Days
                  </span>
                </div>
              </div>
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Process Steps
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Define each step in your workflow (minimum 2 steps)
                </p>
              </div>
              <button
                type="button"
                onClick={addNewStep}
                className={primaryButtonClass}
              >
                <FiPlus className="mr-2 h-4 w-4" />
                Add Step
              </button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {formData.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border-2 border-blue-100 bg-blue-50 px-4 py-2 shadow-sm">
                        <span className="font-bold text-blue-700">
                          Step {step.order}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveStepUp(index)}
                          disabled={index === 0}
                          className="p-1.5 text-gray-400 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move Up"
                        >
                          <FiChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => moveStepDown(index)}
                          disabled={index === formData.steps.length - 1}
                          className="p-1.5 text-gray-400 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move Down"
                        >
                          <FiChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    {formData.steps.length > 1 && (
                      <button
                        onClick={() => removeStep(step.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove Step"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Step Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) =>
                          handleStepChange(step.id, "title", e.target.value)
                        }
                        className={fieldClass}
                        placeholder="Enter step title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Estimate
                      </label>
                      <select
                        value={step.timeEstimate}
                        onChange={(e) =>
                          handleStepChange(
                            step.id,
                            "timeEstimate",
                            e.target.value,
                          )
                        }
                        className={fieldClass}
                      >
                        <option value="15 min">15 minutes</option>
                        <option value="30 min">30 minutes</option>
                        <option value="1 hour">1 hour</option>
                        <option value="2 hours">2 hours</option>
                        <option value="4 hours">4 hours</option>
                        <option value="1 day">1 day</option>
                        <option value="2 days">2 days</option>
                        <option value="1 week">1 week</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={step.description}
                      onChange={(e) =>
                        handleStepChange(step.id, "description", e.target.value)
                      }
                      rows="2"
                      className={fieldClass}
                      placeholder="Describe what happens in this step"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign To (Optional)
                    </label>
                    <select
                      value={step.assignee}
                      onChange={(e) =>
                        handleStepChange(step.id, "assignee", e.target.value)
                      }
                      className={fieldClass}
                    >
                      <option value="">Select team member</option>
                      {workspaceUsers
                        .filter(
                          (member) =>
                            (member.role !== "admin" && member.role !== "superadmin") ||
                            member._id === (typeof step.assignee === "object" ? step.assignee._id : step.assignee)
                        )
                        .map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <FiHelpCircle className="h-5 w-5 text-blue-700 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Pro Tips</p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>
                      • Keep each step focused on a single task or decision
                    </li>
                    <li>• Use decision blocks for branching workflows</li>
                    <li>
                      • Add notes to provide helpful context for team members
                    </li>
                    <li>• Drag steps to reorder them as needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Assign Team Members
              </h3>
              <p className="text-gray-600 mb-6">
                Select team members who can view and participate in this process
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {loadingUsers ? (
                  <div className="col-span-2 py-12 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-700"></div>
                    <p className="text-sm text-gray-500">Fetching workspace members...</p>
                  </div>
                ) : workspaceUsers.length === 0 ? (
                  <div className="col-span-2 py-12 text-center bg-gray-50 rounded-2xl">
                    <FiUsers className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No team members found</p>
                  </div>
                ) : (
                  workspaceUsers
                    .filter(
                      (member) =>
                        (member.role !== "admin" && member.role !== "superadmin") ||
                        formData.assignedTo.includes(member._id) ||
                        (member.email && formData.assignedTo.includes(member.email))
                    )
                    .map((member) => (
                    <div
                      key={member._id}
                      className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 ${
                        formData.assignedTo.includes(member._id)
                          ? "border-blue-700 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                      }`}
                      onClick={() => {
                        const newAssigned = formData.assignedTo.includes(member._id)
                          ? formData.assignedTo.filter(id => id !== member._id)
                          : [...formData.assignedTo, member._id];
                        handleInputChange("assignedTo", newAssigned);
                      }}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          formData.assignedTo.includes(member._id)
                            ? "bg-blue-700 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {formData.assignedTo.includes(member._id) ? (
                          <FiCheck className="h-5 w-5" />
                        ) : (
                          <span className="font-semibold">{member.name?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${
                          member.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : member.role === "editor"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="flex items-start gap-3">
                <FiUsers className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Assignment Notes</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Assigned members will receive notifications about process
                    updates. You can also assign specific team members to
                    individual steps in the previous section.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Process Settings
              </h3>

              <div className="space-y-6">
                {/* Notifications Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FiBell className="h-4 w-4 text-blue-700" />
                    Notification Settings
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(formData.notifications).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                        >
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {key} Notifications
                            </p>
                            <p className="text-sm text-gray-500">
                              {key === "email" &&
                                "Receive email notifications for process updates and assignments"}
                              {key === "slack" &&
                                "Get notified in Slack channel when tasks are assigned or completed"}
                              {key === "inApp" &&
                                "Show real-time notifications within the application"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleInputChange("notifications", {
                                ...formData.notifications,
                                [key]: !value,
                              })
                            }
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              value ? "bg-blue-700" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                value ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Automation Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FiZap className="h-4 w-4 text-blue-700" />
                    Automation Rules
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(formData.automation).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {key === "autoAssign"
                              ? "Auto-assign Tasks"
                              : key === "dueDateReminders"
                                ? "Due Date Reminders"
                                : "Escalate Overdue Tasks"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {key === "autoAssign" &&
                              "Automatically assign tasks to available team members based on workload"}
                            {key === "dueDateReminders" &&
                              "Send automatic reminders 24 hours before tasks are due"}
                            {key === "escalation" &&
                              "Escalate overdue tasks to managers and notify stakeholders"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleInputChange("automation", {
                              ...formData.automation,
                              [key]: !value,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            value ? "bg-blue-700" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              value ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attachments Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Attachments (Optional)
                  </h4>
                  <div className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-blue-300">
                    <FiUpload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports PDF, DOC, XLS, PNG, JPG up to 10MB each
                    </p>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      onClick={() =>
                        alert("File upload dialog would open here")
                      }
                    >
                      Browse Files
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Upload process documentation, guidelines, templates, or
                    training materials
                  </p>
                </div>

                {/* Review Summary */}
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-5">
                  <div className="flex items-start gap-3">
                    <FiSettings className="h-5 w-5 text-blue-700 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        Ready to Create?
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        You`re about to create{" "}
                        <strong className="text-blue-700">
                          {formData.name || "your process"}
                        </strong>{" "}
                        with
                        <strong> {formData.steps.length} steps</strong> assigned
                        to
                        <strong>
                          {" "}
                          {formData.assignedTo.length} team members
                        </strong>
                        .
                        {formData.automation.dueDateReminders &&
                          " Automation rules will be applied automatically."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.automation.autoAssign && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            Auto-assign ON
                          </span>
                        )}
                        {formData.automation.dueDateReminders && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            Reminders ON
                          </span>
                        )}
                        {formData.automation.escalation && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            Escalation ON
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <div className="py-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-center">
          <div className="bg-green-100 rounded-full p-4 w-fit mx-auto mb-4">
            <FiCheck className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Process Created Successfully!
          </h2>
          <p className="text-gray-600 mb-2">{successMessage}</p>
          <p className="text-gray-500 mb-6">
            {formData.name} has been created with {formData.steps.length} steps
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Redirecting to processes list...
          </p>
          <div className="flex space-x-3 justify-center">
            <Link
              href="/processes"
              className={primaryButtonClass}
            >
              View All Processes
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setActiveStep(1);
                setError(null);
                setSuccessMessage("");
                setFormData({
                  name: "",
                  description: "",
                  category: "",
                  priority: "High",
                  estimatedDuration: "",
                  visibility: "private",
                  assignedTo: [],
                  steps: [
                    {
                      id: 1,
                      title: "Initial Review",
                      description: "Review initial requirements",
                      assignee: "",
                      timeEstimate: "2 hours",
                      order: 1,
                      notes: "",
                    },
                    {
                      id: 2,
                      title: "Approval",
                      description: "Get manager approval",
                      assignee: "",
                      timeEstimate: "1 day",
                      order: 2,
                      notes: "",
                    },
                  ],
                  notifications: { email: true, slack: false, inApp: true },
                  automation: {
                    autoAssign: false,
                    dueDateReminders: true,
                    escalation: false,
                  },
                });
              }}
              className={secondaryButtonClass}
            >
              Create Another Process
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-4 min-h-[calc(100vh-9rem)] bg-linear-to-br from-blue-50 via-sky-50 to-violet-50 p-4 sm:-m-6 sm:p-6">
      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/processes"
            className="inline-flex items-center text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Back to Processes
          </Link>
        </div>

        <div className="text-center md:absolute md:left-1/2 md:-translate-x-1/2">
          <h1 className="text-2xl font-black text-slate-950">
            Create New Process
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Configure your high-fidelity enterprise workflow.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={secondaryButtonClass}
        >
          <FiEye className="h-4 w-4" />
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      <ProcessStepper
        steps={steps}
        activeStep={activeStep}
        onStepClick={(stepNumber) =>
          stepNumber < activeStep && setActiveStep(stepNumber)
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Form */}
        <div className={`${showPreview ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
            <div className="p-8">
              <form>
                {renderStepContent()}

                {/* Navigation Buttons */}
                <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
                  {activeStep === 1 ? (
                    <Link
                      href="/processes"
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
                      <FiChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                  )}

                  {activeStep === steps.length ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={primaryButtonClass}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Process...
                        </>
                      ) : (
                        <>
                          <FiSave className="w-4 h-4" />
                          Create Process
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      className={primaryButtonClass}
                    >
                      Save & Continue
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Preview Sidebar */}
        {showPreview && (
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
              <div className="p-5 space-y-5">
                <div>
                  <h3 className="mb-3 text-xs font-black uppercase text-slate-900">
                    Basic Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="max-w-[180px] truncate font-bold text-slate-900">
                        {formData.name || "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Category:</span>
                      <span className="font-bold text-slate-900">
                        {formData.category || "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Visibility:</span>
                      <span className="font-bold capitalize text-slate-900">
                        {formData.visibility}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <h3 className="mb-3 text-xs font-black uppercase text-slate-900">
                    Workflow
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Steps:</span>
                      <span className="font-bold text-slate-900">
                        {formData.steps.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Assigned Members:</span>
                      <span className="font-bold text-slate-900">
                        {formData.assignedTo.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <h3 className="mb-3 text-xs font-black uppercase text-slate-900">
                    Steps Preview
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {formData.steps.slice(0, 4).map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {step.order}
                        </div>
                        <span className="flex-1 truncate text-slate-700">
                          {step.title}
                        </span>
                        <FiClock className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {step.timeEstimate}
                        </span>
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
                    <div className="flex items-center gap-2 mb-2">
                      <FiZap className="h-5 w-5 text-blue-700" />
                      <p className="text-sm font-bold text-slate-900">
                        AI Ready
                      </p>
                    </div>
                    <p className="text-xs text-slate-600">
                      After creation, AI will analyze your workflow and suggest:
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-600">
                      <li>Optimization opportunities</li>
                      <li>Automation suggestions</li>
                      <li>Bottleneck detection</li>
                      <li>Cost reduction ideas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SAVE OPTIONS MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm shadow-inner" onClick={() => !saveProgress && setShowSaveModal(false)}></div>
          <div className="relative w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between bg-blue-700 px-6 py-5">
              <div>
                <h2 className="text-white font-bold text-xl">Save Options</h2>
                <p className="mt-1 text-sm text-blue-100">How would you like to save this configuration?</p>
              </div>
              <button 
                onClick={() => !saveProgress && setShowSaveModal(false)}
                className="text-white/75 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                disabled={saveProgress}
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Option 1: Active Process */}
                <label className={`relative block cursor-pointer rounded-xl border-2 p-5 transition-all ${saveOptions.process ? 'border-blue-700 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input 
                        type="checkbox" 
                        className="h-5 w-5 rounded border-gray-300 text-blue-700 focus:ring-blue-500" 
                        checked={saveOptions.process}
                        onChange={(e) => setSaveOptions({...saveOptions, process: e.target.checked})}
                        disabled={saveProgress}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-2">
                        <FiLayers className={`h-5 w-5 ${saveOptions.process ? 'text-blue-700' : 'text-gray-400'}`} />
                        <span className={`block text-lg font-semibold ${saveOptions.process ? 'text-blue-950' : 'text-gray-900'}`}>
                          Save as Active Process
                        </span>
                      </div>
                      <span className="block text-sm text-gray-500 mt-1">
                        Creates a live process instance. Assigned members will be notified, and progress tracking will begin immediately.
                      </span>
                    </div>
                  </div>
                </label>

                {/* Option 2: Reusable Template */}
                <label className={`relative block cursor-pointer rounded-xl border-2 p-5 transition-all ${saveOptions.template ? 'border-blue-700 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input 
                        type="checkbox" 
                        className="h-5 w-5 rounded border-gray-300 text-blue-700 focus:ring-blue-500" 
                        checked={saveOptions.template}
                        onChange={(e) => setSaveOptions({...saveOptions, template: e.target.checked})}
                        disabled={saveProgress}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-2">
                        <FiCopy className={`h-5 w-5 ${saveOptions.template ? 'text-blue-700' : 'text-gray-400'}`} />
                        <span className={`block text-lg font-semibold ${saveOptions.template ? 'text-blue-950' : 'text-gray-900'}`}>
                          Save as Reusable Template
                        </span>
                      </div>
                      <span className="block text-sm text-gray-500 mt-1">
                        Adds this framework to the Templates library. It does not notify assignees, but serves as a blueprint for future processes.
                      </span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  disabled={saveProgress}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeSave}
                  disabled={saveProgress || (!saveOptions.process && !saveOptions.template)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-medium text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 disabled:opacity-50 disabled:shadow-none"
                >
                  {saveProgress ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheck className="h-5 w-5" />
                      Confirm & Create
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper component for Bell icon
// function FiBell(props) {
//   return (
//     <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//     </svg>
//   );
// }
