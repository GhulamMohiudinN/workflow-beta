"use client";
/**
 * Shared right-side panel used by all auth pages.
 * Matches the blue design system (var(--color-primary)).
 */
import { FiBriefcase, FiCheckCircle, FiUsers, FiLayers, FiZap, FiShield, FiCpu } from "react-icons/fi";

const BENEFITS = [
  { icon: FiCheckCircle, title: "Get Started in Minutes",   desc: "Set up your company workspace instantly" },
  { icon: FiUsers,       title: "Unlimited Team Members",   desc: "Add your entire team with role-based access" },
  { icon: FiLayers,      title: "Unlimited Workflows",      desc: "Create as many processes as you need" },
  { icon: FiZap,         title: "AI-Powered Insights",      desc: "Get smart suggestions to optimize workflows" },
];

export default function AuthPanel({ subtitle = "Enterprise Workflow Platform" }) {
  return (
    <div className="hidden lg:flex flex-1 bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex flex-col items-center justify-center w-full p-8">
        <div className="max-w-sm w-full space-y-5">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-3">
            <div className="bg-[var(--color-primary)] p-3 rounded-xl shadow-lg">
              <FiBriefcase className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-[var(--color-text)]">WorkflowPro</h1>
              <p className="text-[var(--color-primary)] font-semibold text-sm mt-1">{subtitle}</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 space-y-4 border border-[var(--color-border)] shadow-sm">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-lg shrink-0 border border-blue-100">
                  <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h4 className="font-black text-[var(--color-text)] text-sm">{title}</h4>
                  <p className="text-xs text-[var(--color-muted)] font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Security row */}
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted)]">
              <FiShield className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              SOC 2 Type II
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted)]">
              <FiCpu className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              MongoDB Encrypted
            </div>
          </div>
          <div className="text-xs">
            Each company gets a completely isolated, secure workspace


          </div>
        </div>
      </div>
    </div>
  );
}
