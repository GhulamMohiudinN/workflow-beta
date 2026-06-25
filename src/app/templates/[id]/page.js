"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { templateAPI } from "../../api/templateAPI";
import {
  FiArrowLeft,
  FiEdit2,
  FiCopy,
  FiTrash2,
  FiLayers,
  FiClock,
  FiTag,
  FiMapPin,
  FiCheckCircle,
  FiSettings,
  FiAlignLeft,
  FiAlertCircle,
  FiX
} from "react-icons/fi";

export default function TemplateDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const result = await templateAPI.getTemplate(id);
        if (result.success) {
          setTemplate(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message || "Failed to load template details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-700 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading Template details...</p>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto">
          <FiAlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Template</h2>
          <p className="text-red-700 mb-6">{error || "Template not found"}</p>
          <Link href="/templates" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium">
            <FiArrowLeft /> Back to Templates
          </Link>
        </div>
      </div>
    );
  }

  // Formatting helpers
  const categoryColor = getCategoryColor(template.category);

  return (
    <div className="-m-4 min-h-[calc(100vh-9rem)] bg-linear-to-br from-slate-50 via-cyan-50 to-emerald-50 p-4 sm:-m-6 sm:p-6">
      {/* Header Section */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/templates"
          className="flex items-center text-sm font-medium text-gray-500 hover:text-cyan-700 transition-colors"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Link>
        
        <div className="flex gap-2">
          <Link
            href={`/templates/${template._id || template.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors font-medium shadow-sm"
          >
            <FiEdit2 className="h-4 w-4" />
            Edit Template
          </Link>
          <Link
            href={`/processes/new?templateId=${template._id || template.id}`}
            className="flex items-center gap-2 px-5 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 transition-all font-bold shadow-md shadow-cyan-700/20"
          >
            <FiCopy className="h-5 w-5" />
            Use Template
          </Link>
        </div>
      </div>

      {/* Main Title Card */}
      <div className="bg-white/90 rounded-xl border border-cyan-100 shadow-sm overflow-hidden mb-6 relative">
        <div className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-cyan-50 text-cyan-700">
                  {template.category || "Uncategorized"}
                </span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  template.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {template.status?.toUpperCase() || "DRAFT"}
                </span>
              </div>
              
              <h1 className="text-3xl font-extrabold text-gray-900 mb-3">{template.name}</h1>
              
              <p className="text-gray-600 text-lg max-w-3xl leading-relaxed">
                {template.description || "No description provided for this template framework."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Steps */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/90 rounded-xl border border-cyan-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiLayers className="text-cyan-700" /> Predefined Flow ({template.steps?.length || 0} Steps)
              </h2>
            </div>

            <div className="space-y-4">
              {(template.steps || []).map((step, index) => (
                <div key={step._id || index} className="flex bg-slate-50 rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-200 group-hover:bg-cyan-600 transition-colors"></div>
                  
                  <div className="w-10 flex-shrink-0 flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-white border-2 border-cyan-300 flex items-center justify-center font-bold text-cyan-700 text-sm shadow-sm z-10">
                      {step.sequence || step.order || index + 1}
                    </div>
                    {index !== template.steps.length - 1 && (
                      <div className="w-px h-full bg-cyan-100 mt-2"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 ml-4 pt-0.5">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{step.title}</h3>
                    {step.description && (
                      <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                        <FiClock className="text-cyan-700" /> 
                        <span>Est: <span className="text-gray-800">{step.timeEstimate || "1d"}</span></span>
                      </div>
                      
                      {step.coordinates && (
                        <div className="flex items-center gap-1.5 opacity-60">
                          <FiMapPin /> 
                          <span>[X: {step.coordinates.x}, Y: {step.coordinates.y}]</span>
                        </div>
                      )}
                    </div>
                    
                    {step.notes && (
                      <div className="mt-3 bg-white p-3 rounded-lg border border-cyan-100 text-sm italic text-gray-600 flex items-start gap-2">
                         <FiAlignLeft className="shrink-0 mt-0.5 text-cyan-700" />
                         <span>{step.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {(!template.steps || template.steps.length === 0) && (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <FiLayers className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No steps configured yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Settings & Meta */}
        <div className="space-y-6">
          <div className="bg-white/90 rounded-xl border border-cyan-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <FiSettings className="text-cyan-700" />
              <h2 className="font-bold text-gray-900">Default Configuration</h2>
            </div>
            
            <div className="p-6 space-y-6 text-sm">
              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-500 mb-3">Notifications</h3>
                <div className="space-y-2">
                  <SettingRow label="Email Alerts" active={template.settings?.notifications?.email} />
                  <SettingRow label="Slack/Teams" active={template.settings?.notifications?.slack} />
                  <SettingRow label="In-App Updates" active={template.settings?.notifications?.inApp} />
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-500 mb-3">Automation</h3>
                <div className="space-y-2">
                  <SettingRow label="Auto-Assign Tasks" active={template.settings?.automation?.autoAssignTasks} />
                  <SettingRow label="Due Date Reminders" active={template.settings?.automation?.dueDateReminders} />
                  <SettingRow label="Escalate Overdue" active={template.settings?.automation?.escalateOverdueTasks} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 rounded-xl border border-cyan-100 shadow-sm p-6 text-sm text-gray-500">
            <p className="flex justify-between py-2 border-b border-gray-50">
              <span>Created:</span>
              <span className="font-medium text-gray-900">{new Date(template.createdAt).toLocaleDateString() || "Unknown"}</span>
            </p>
            <p className="flex justify-between py-2 border-b border-gray-50">
              <span>Last Modified:</span>
              <span className="font-medium text-gray-900">{new Date(template.updatedAt).toLocaleDateString() || "Unknown"}</span>
            </p>
            <p className="flex justify-between py-2">
              <span>Template ID:</span>
              <span className="font-mono text-xs mt-0.5">{template._id || template.id}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents
function SettingRow({ label, active }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      {active ? (
           <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold">
           <FiCheckCircle /> ON
         </div>
      ) : (
         <div className="flex items-center gap-1 text-gray-400 bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">
           <FiX /> OFF
         </div>
      )}
    </div>
  );
}

function getCategoryColor(category) {
  const colors = {
    Onboarding: "bg-cyan-600",
    HR: "bg-violet-500",
    Finance: "bg-emerald-500",
    IT: "bg-sky-600",
    Marketing: "bg-pink-500",
    Sales: "bg-indigo-500",
    Operations: "bg-teal-600",
    "Customer Support": "bg-red-500",
    Legal: "bg-slate-500",
  };
  return colors[category] || "bg-gray-500";
}
