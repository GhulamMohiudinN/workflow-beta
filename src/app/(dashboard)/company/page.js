"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback } from "react";
import { toast, Toaster } from "react-hot-toast";
import {
  FiGlobe, FiUsers, FiMapPin, FiCalendar, FiEdit2, FiSave, FiX,
  FiShield, FiDatabase, FiTrendingUp, FiBriefcase, FiCheck,
  FiAlertCircle, FiHash, FiPhone, FiToggleLeft, FiZap,
} from "react-icons/fi";
import { FaBuilding } from "react-icons/fa";
import { authAPI } from "../../api/auth";
import { userAPI } from "../../api/userAPI";
import { processAPI } from "../../api/processAPI";
import {
  COMPANY_TYPES, INDUSTRIES, EMPLOYEE_RANGES, workflowTypes,
} from "../../(auth)/workspaceCreation/content";
import { Card, CardContent, CardHeader } from "../../../components/Card";
import { Button } from "../../../components/Button";

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR"];
const TIMEZONES =
  typeof Intl !== "undefined" && Intl.supportedValuesOf
    ? Intl.supportedValuesOf("timeZone").sort()
    : ["UTC"];
const INITIAL_TEAM_SIZES = [
  "Just me (Admin)", "2-5 team members", "6-20 team members",
  "21-50 team members", "50+ team members",
];
const EXPECTED_WORKFLOW_RANGES = [
  "1-10 workflows", "11-50 workflows", "51-200 workflows", "200+ workflows",
];
const TABS = { BASIC: "basic", DETAILS: "details", WORKFLOWS: "workflows", NOTIFICATIONS: "notifications" };

// ─── Shared input class ───────────────────────────────────────────────────────

const inputCls = "w-full border border-[var(--color-border)] rounded-lg py-2.5 px-4 text-sm text-[var(--color-text)] bg-[var(--color-bg)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all placeholder:text-[var(--color-faint)]";
const selectCls = inputCls;

// ─── FormField ────────────────────────────────────────────────────────────────

function FormField({ label, value, isEditing, onChange, type = "text", placeholder = "", options = [] }) {
  if (!isEditing) {
    return (
      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-faint)] mb-1.5">{label}</label>
        <p className="text-sm font-semibold text-[var(--color-text)]">{value || <span className="text-[var(--color-faint)]">—</span>}</p>
      </div>
    );
  }
  if (type === "select") {
    return (
      <div>
        <label className="block text-xs font-black text-[var(--color-text)] mb-1.5">{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }
  if (type === "textarea") {
    return (
      <div>
        <label className="block text-xs font-black text-[var(--color-text)] mb-1.5">{label}</label>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows="3"
          className={inputCls} />
      </div>
    );
  }
  return (
    <div>
      <label className="block text-xs font-black text-[var(--color-text)] mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  );
}

// ─── TabButton ────────────────────────────────────────────────────────────────

function TabButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
        active
          ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-blue-50/60"
          : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompanyPage() {
  const [isSaving,   setIsSaving]   = useState(false);
  const [activeTab,  setActiveTab]  = useState(TABS.BASIC);
  const [isEditing,  setIsEditing]  = useState(false);
  const [statsData,  setStatsData]  = useState({
    totalMembers:    null,
    activeProcesses: null,
    daysActive:      null,
  });

  const initData = () => ({
    name: "", email: "", website: "", industry: "", foundedYear: "",
    headquarters: "", phoneNumber: "", companyType: "", employeeCount: "",
    currency: "USD", timezone: "", taxId: "", registrationNumber: "",
    automationPriority: "medium", initialTeamSize: "", expectedWorkflows: "",
    primaryWorkflowTypes: [],
    notificationPreferences: { email: true, slack: false, teams: false, inApp: true },
  });

  const [company, setCompany] = useState(initData);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("workspace") : null;
    if (!raw) return;
    try {
      const p = JSON.parse(raw);
      setCompany((prev) => ({
        ...prev,
        name:                 p.companyName            || "",
        email:                p.companyEmail           || "",
        companyType:          p.companyType            || "",
        headquarters:         p.headquarters           || "",
        foundedYear:          p.foundedYear            || "",
        industry:             p.industry               || "",
        employeeCount:        p.employeeCount          || "",
        currency:             p.currency               || "USD",
        automationPriority:   p.automationPriority     || "medium",
        initialTeamSize:      p.initialTeamSize        || "",
        expectedWorkflows:    p.expectedWorkflows      || "",
        taxId:                p.taxId                  || "",
        registrationNumber:   p.registrationNumber     || "",
        timezone:             p.timezone               || "",
        website:              p.website                || "",
        phoneNumber:          p.phoneNumber            || "",
        primaryWorkflowTypes: p.primaryWorkflowTypes   || [],
        notificationPreferences: p.notificationPreferences || { email: true, slack: false, teams: false, inApp: true },
      }));
    } catch (e) { console.error("Error parsing workspace:", e); }
  }, []);

  // ── Fetch live stats for the 4 metric cards ───────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        // Workspace createdAt → days active (no API needed)
        let daysActive = null;
        try {
          const raw = localStorage.getItem("workspace");
          const ws  = raw ? JSON.parse(raw) : {};
          const createdAt = ws.createdAt;
          if (createdAt) {
            const diffMs = Date.now() - new Date(createdAt).getTime();
            daysActive = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          }
        } catch { /* ignore */ }

        // Parallel: users total + process analytics
        const [userRes, procRes] = await Promise.all([
          userAPI.getWorkspaceUsers({ limit: 1 }),
          processAPI.getWorkspaceProcesses({ limit: 1 }),
        ]);

        if (cancelled) return;

        const totalMembers    = userRes.success  ? (userRes.total  ?? userRes.users?.length  ?? null) : null;
        const activeProcesses = procRes.success
          ? (procRes.analytics?.active?.total
              ?? procRes.analytics?.active
              ?? (Array.isArray(procRes.data)
                  ? procRes.data.filter((p) =>
                      ["active", "in-progress", "inprogress", "ongoing"].includes(
                        (p.status || "").toLowerCase()
                      )
                    ).length
                  : null))
          : null;

        setStatsData({ totalMembers, activeProcesses, daysActive });
      } catch (err) {
        console.error("[CompanyPage] stats fetch error:", err);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  const handleInputChange = useCallback((field, value) => setCompany((prev) => ({ ...prev, [field]: value })), []);
  const toggleWorkflowType = useCallback((type) => {
    setCompany((prev) => {
      const exists = prev.primaryWorkflowTypes.includes(type);
      return { ...prev, primaryWorkflowTypes: exists ? prev.primaryWorkflowTypes.filter((i) => i !== type) : [...prev.primaryWorkflowTypes, type] };
    });
  }, []);
  const toggleNotifPref = useCallback((key) => {
    setCompany((prev) => ({ ...prev, notificationPreferences: { ...prev.notificationPreferences, [key]: !prev.notificationPreferences[key] } }));
  }, []);

  const handleSave = async () => {
    if (!company.name || !company.email) { toast.error("Company name and email are required"); return; }
    setIsSaving(true);
    try {
      const payload = {
        companyName: company.name, companyEmail: company.email, companyType: company.companyType,
        headquarters: company.headquarters, foundedYear: company.foundedYear, industry: company.industry,
        employeeCount: company.employeeCount, currency: company.currency, automationPriority: company.automationPriority,
        initialTeamSize: company.initialTeamSize, expectedWorkflows: company.expectedWorkflows,
        taxId: company.taxId, registrationNumber: company.registrationNumber, timezone: company.timezone,
        website: company.website, phoneNumber: company.phoneNumber,
        primaryWorkflowTypes: company.primaryWorkflowTypes, notificationPreferences: company.notificationPreferences,
      };
      const data = await authAPI.updateWorkspace(payload);
      toast.success("Workspace updated successfully!");
      if (data.workspace) localStorage.setItem("workspace", JSON.stringify(data.workspace));
      setIsEditing(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update workspace. Please try again.");
    } finally { setIsSaving(false); }
  };

  // ── Build stats from live data (show skeleton "—" while loading) ─────────
  const fmt = (v) => (v === null ? "—" : String(v));
  const stats = [
    { label: "Total Members",    value: fmt(statsData.totalMembers),    icon: FiUsers,      toneClass: "bg-blue-50 text-blue-600"    },
    { label: "Active Processes", value: fmt(statsData.activeProcesses), icon: FiTrendingUp, toneClass: "bg-emerald-50 text-emerald-600" },
    { label: "Storage Used",     value: "—",                            icon: FiDatabase,   toneClass: "bg-indigo-50 text-indigo-600"  },
    { label: "Days Active",      value: fmt(statsData.daysActive),      icon: FiCalendar,   toneClass: "bg-teal-50 text-teal-600"    },
  ];

  return (
    <div className="-m-4 min-h-[calc(100vh-9rem)] space-y-6 bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:-m-6 sm:p-6">
      <Toaster position="top-right" />

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)]">Company Profile</h1>
          <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
            {isEditing ? "Edit your company information" : "View and manage your workspace settings"}
          </p>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" icon={FiX} onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
              <Button icon={FiSave} onClick={handleSave} loading={isSaving} disabled={isSaving}>Save Changes</Button>
            </>
          ) : (
            <Button icon={FiEdit2} onClick={() => setIsEditing(true)}>Edit Information</Button>
          )}
        </div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="min-h-[100px]">
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-[var(--color-muted)]">{s.label}</p>
                  <p className="mt-3 text-2xl font-black text-[var(--color-text)]">{s.value}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${s.toneClass}`}><s.icon size={17} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tab Nav + Content ────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
        {/* Tab bar */}
        <div className="border-b border-[var(--color-border)] px-5 flex flex-wrap gap-0 overflow-x-auto bg-[var(--color-surface-hover)]">
          <TabButton active={activeTab === TABS.BASIC}          label="Basic Information" onClick={() => setActiveTab(TABS.BASIC)} />
          <TabButton active={activeTab === TABS.DETAILS}        label="Company Details"   onClick={() => setActiveTab(TABS.DETAILS)} />
          <TabButton active={activeTab === TABS.WORKFLOWS}      label="Workflows"         onClick={() => setActiveTab(TABS.WORKFLOWS)} />
          <TabButton active={activeTab === TABS.NOTIFICATIONS}  label="Notifications"     onClick={() => setActiveTab(TABS.NOTIFICATIONS)} />
        </div>

        {/* Tab content */}
        <div className="p-6">

          {/* ── Basic Information ──────────────────────────────────────── */}
          {activeTab === TABS.BASIC && (
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-black text-[var(--color-text)] mb-5">Company Basics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Company Name"  value={company.name}        isEditing={isEditing} onChange={(v) => handleInputChange("name", v)}        placeholder="Enter company name" />
                  <FormField label="Company Email" value={company.email}       isEditing={isEditing} onChange={(v) => handleInputChange("email", v)}       type="email" placeholder="contact@company.com" />
                  <FormField label="Industry"      value={company.industry}    isEditing={isEditing} onChange={(v) => handleInputChange("industry", v)}    type="select" options={INDUSTRIES} />
                  <FormField label="Founded Year"  value={company.foundedYear} isEditing={isEditing} onChange={(v) => handleInputChange("foundedYear", v)} type="number" placeholder="2020" />
                </div>
              </div>
              <div className="border-t border-[var(--color-border)] pt-6">
                <h3 className="text-sm font-black text-[var(--color-text)] mb-5">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Website"      value={company.website}      isEditing={isEditing} onChange={(v) => handleInputChange("website", v)}      type="url" placeholder="https://company.com" />
                  <FormField label="Phone Number" value={company.phoneNumber}  isEditing={isEditing} onChange={(v) => handleInputChange("phoneNumber", v)}  type="tel" placeholder="+1 (555) 123-4567" />
                  <FormField label="Headquarters" value={company.headquarters} isEditing={isEditing} onChange={(v) => handleInputChange("headquarters", v)} placeholder="City, Country" />
                  <FormField label="Company Type" value={company.companyType}  isEditing={isEditing} onChange={(v) => handleInputChange("companyType", v)}  type="select" options={COMPANY_TYPES} />
                </div>
              </div>
            </div>
          )}

          {/* ── Company Details ────────────────────────────────────────── */}
          {activeTab === TABS.DETAILS && (
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-black text-[var(--color-text)] mb-5">Compliance & Legal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Registration Number" value={company.registrationNumber} isEditing={isEditing} onChange={(v) => handleInputChange("registrationNumber", v)} placeholder="e.g., REG-ACME-001" />
                  <FormField label="Tax ID / VAT Number"  value={company.taxId}              isEditing={isEditing} onChange={(v) => handleInputChange("taxId", v)}              placeholder="e.g., TAX-ACME-2026" />
                </div>
              </div>
              <div className="border-t border-[var(--color-border)] pt-6">
                <h3 className="text-sm font-black text-[var(--color-text)] mb-5">Business Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Employee Count"       value={company.employeeCount}      isEditing={isEditing} onChange={(v) => handleInputChange("employeeCount", v)}      type="select" options={EMPLOYEE_RANGES} />
                  <FormField label="Primary Currency"     value={company.currency}           isEditing={isEditing} onChange={(v) => handleInputChange("currency", v)}           type="select" options={CURRENCIES} />
                  <FormField label="Timezone"             value={company.timezone}           isEditing={isEditing} onChange={(v) => handleInputChange("timezone", v)}           type="select" options={TIMEZONES} />
                  <FormField label="Automation Priority"  value={company.automationPriority} isEditing={isEditing} onChange={(v) => handleInputChange("automationPriority", v)} type="select" options={["low", "medium", "high"]} />
                </div>
              </div>
              <div className="border-t border-[var(--color-border)] pt-6">
                <h3 className="text-sm font-black text-[var(--color-text)] mb-5">Team Setup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Initial Team Size"    value={company.initialTeamSize}    isEditing={isEditing} onChange={(v) => handleInputChange("initialTeamSize", v)}    type="select" options={INITIAL_TEAM_SIZES} />
                  <FormField label="Expected Workflows"   value={company.expectedWorkflows}  isEditing={isEditing} onChange={(v) => handleInputChange("expectedWorkflows", v)}  type="select" options={EXPECTED_WORKFLOW_RANGES} />
                </div>
              </div>
            </div>
          )}

          {/* ── Workflows ──────────────────────────────────────────────── */}
          {activeTab === TABS.WORKFLOWS && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-[var(--color-text)] mb-1">Primary Workflow Types</h3>
                <p className="text-xs font-medium text-[var(--color-muted)] mb-5">Select the types of workflows your organisation will manage.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {workflowTypes.map((type) => {
                    const selected = company.primaryWorkflowTypes.includes(type);
                    return (
                      <button
                        key={type} type="button"
                        onClick={() => toggleWorkflowType(type)} disabled={!isEditing}
                        className={`p-3 rounded-lg border-2 text-xs font-semibold transition-all flex items-center gap-2 ${
                          selected
                            ? "border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]"
                            : "border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        } ${!isEditing ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                      >
                        {selected && <FiCheck className="h-3.5 w-3.5 shrink-0" />}
                        <span className="capitalize">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-[var(--color-border)] pt-6">
                <h3 className="text-sm font-black text-[var(--color-text)] mb-5">Workflow Details</h3>
                <FormField
                  label="Expected Workflows Description" value={company.expectedWorkflows} isEditing={isEditing}
                  onChange={(v) => handleInputChange("expectedWorkflows", v)} type="textarea"
                  placeholder="Describe the workflows you plan to automate"
                />
              </div>
            </div>
          )}

          {/* ── Notifications ──────────────────────────────────────────── */}
          {activeTab === TABS.NOTIFICATIONS && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-[var(--color-text)] mb-1">Notification Channels</h3>
                <p className="text-xs font-medium text-[var(--color-muted)] mb-5">Choose how you would like to receive workspace notifications.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(company.notificationPreferences).map(([channel, enabled]) => (
                    <div key={channel} className={`border-2 rounded-lg p-4 transition-all ${enabled ? "border-[var(--color-primary)] bg-blue-50/40" : "border-[var(--color-border)] bg-white"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${enabled ? "bg-blue-50" : "bg-[var(--color-bg-soft)]"}`}>
                            <FiToggleLeft className={`h-4 w-4 ${enabled ? "text-[var(--color-primary)]" : "text-[var(--color-faint)]"}`} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[var(--color-text)] capitalize">{channel === "inApp" ? "In-App" : channel}</p>
                            <p className="text-xs text-[var(--color-muted)] font-medium">
                              {channel === "email"  && "Email notifications"}
                              {channel === "slack"  && "Slack notifications"}
                              {channel === "teams"  && "Microsoft Teams"}
                              {channel === "inApp"  && "In-app notifications"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button" onClick={() => toggleNotifPref(channel)} disabled={!isEditing}
                          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${enabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-border-strong)]"} ${!isEditing ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4">
                <FiAlertCircle className="h-4 w-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-[var(--color-muted)]">
                  These notification preferences apply workspace-wide. Individual settings can be configured in your user profile.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Panels ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-black text-[var(--color-text)] flex items-center gap-2">
              <FiBriefcase size={15} className="text-[var(--color-primary)]" /> Subscription Status
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[var(--color-bg-soft)] rounded-lg">
              <span className="text-sm font-semibold text-[var(--color-muted)]">Current Plan</span>
              <span className="text-sm font-black text-[var(--color-text)]">Enterprise</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[var(--color-bg-soft)] rounded-lg">
              <span className="text-sm font-semibold text-[var(--color-muted)]">Status</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
                <FiCheck size={11} /> Active
              </span>
            </div>
            <Button fullWidth className="mt-2">Upgrade Plan</Button>
          </CardContent>
        </Card>

        {/* Security Features */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-black text-[var(--color-text)] flex items-center gap-2">
              <FiShield size={15} className="text-[var(--color-primary)]" /> Security Features
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: FiShield,   color: "text-[var(--color-primary)]", title: "Enterprise Encryption",  desc: "All data encrypted at rest and in transit" },
              { icon: FiDatabase, color: "text-indigo-600",              title: "Secure Backend",         desc: "MongoDB with enterprise-grade security" },
              { icon: FiUsers,    color: "text-emerald-600",             title: "Role-Based Access",      desc: "Fine-grained permission controls" },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3 bg-[var(--color-bg-soft)] rounded-lg">
                <Icon className={`h-4 w-4 ${color} shrink-0 mt-0.5`} />
                <div>
                  <p className="text-xs font-black text-[var(--color-text)]">{title}</p>
                  <p className="text-xs text-[var(--color-muted)] font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
