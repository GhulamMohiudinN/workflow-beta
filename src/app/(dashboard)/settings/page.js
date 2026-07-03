"use client";
import { useState } from "react";
import {
  FiShield, FiSave, FiEye, FiEyeOff, FiAlertCircle, FiTrash2, FiLock,
  FiCheckCircle, FiUsers, FiDatabase, FiZap, FiClock,
} from "react-icons/fi";
import { FiCpu } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { authAPI } from "../../api/auth";
import workspaceAPI from "../../api/workspaceAPI";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "../../../components/Card";
import { Button } from "../../../components/Button";

// ─── Shared input class ───────────────────────────────────────────────────────

const inputCls = "w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg py-2.5 px-4 text-sm text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:bg-white outline-none transition-all placeholder:text-[var(--color-faint)]";

export default function SettingsPage() {
  const router = useRouter();

  // ── Password ────────────────────────────────────────────────────────────
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrentPass,  setShowCurrentPass]  = useState(false);
  const [showNewPass,      setShowNewPass]      = useState(false);
  const [showConfirmPass,  setShowConfirmPass]  = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // ── Delete ──────────────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmName,     setConfirmName]     = useState("");
  const [isDeleting,      setIsDeleting]      = useState(false);

  const workspaceJson  = typeof window !== "undefined" ? localStorage.getItem("workspace") : null;
  const workspace      = workspaceJson ? JSON.parse(workspaceJson) : { companyName: "Workspace" };
  const workspaceName  = workspace.companyName || "Your Workspace";

  // ── Handlers ────────────────────────────────────────────────────────────

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const submitChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) { toast.error("New passwords do not match"); return; }
    if (passwordData.newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setChangingPassword(true);
    try {
      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success("Password updated successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally { setChangingPassword(false); }
  };

  const handleDeleteWorkspace = async () => {
    if (confirmName !== workspaceName) { toast.error("Workspace name does not match"); return; }
    setIsDeleting(true);
    try {
      await workspaceAPI.deleteWorkspace();
      toast.success("Workspace deleted successfully");
      localStorage.clear();
      router.push("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete workspace");
      setIsDeleting(false);
    }
  };

  return (
    <div className="-m-4 min-h-[calc(100vh-9rem)] space-y-6 bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:-m-6 sm:p-6">
      <Toaster position="top-right" />

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-[var(--color-text)]">Security & Workspace</h1>
        <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">Manage your account protection and workspace lifecycle.</p>
      </div>

      <div className="space-y-6">

        {/* ── Section 1: Change Password ────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-primary)]">
                <FiShield size={17} />
              </div>
              <div>
                <h2 className="text-sm font-black text-[var(--color-text)]">Password & Security</h2>
                <p className="text-xs font-medium text-[var(--color-muted)]">Update your credentials to keep your account safe</p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={submitChangePassword} className="space-y-5">
              {/* Current password */}
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-[var(--color-text)] mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"} name="currentPassword"
                    value={passwordData.currentPassword} onChange={handlePasswordChange} required
                    className={inputCls} placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)] hover:text-[var(--color-primary)] transition-colors">
                    {showCurrentPass ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* New password */}
                <div>
                  <label className="block text-xs font-black text-[var(--color-text)] mb-1.5">New Password</label>
                  <div className="relative">
                    <input type={showNewPass ? "text" : "password"} name="newPassword"
                      value={passwordData.newPassword} onChange={handlePasswordChange} required
                      className={inputCls} placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)] hover:text-[var(--color-primary)] transition-colors">
                      {showNewPass ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-black text-[var(--color-text)] mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input type={showConfirmPass ? "text" : "password"} name="confirmPassword"
                      value={passwordData.confirmPassword} onChange={handlePasswordChange} required
                      className={inputCls} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)] hover:text-[var(--color-primary)] transition-colors">
                      {showConfirmPass ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--color-border)] flex justify-end">
                <Button type="submit" icon={FiSave} loading={changingPassword} disabled={changingPassword}>
                  {changingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Section 2: Quick Security Overview ───────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <FiCheckCircle size={17} />
              </div>
              <div>
                <h2 className="text-sm font-black text-[var(--color-text)]">Security Overview</h2>
                <p className="text-xs font-medium text-[var(--color-muted)]">Your workspace security status</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: FiShield,   color: "bg-blue-50 text-blue-600",    label: "Enterprise Encryption", desc: "All data encrypted at rest & in transit" },
                { icon: FiDatabase, color: "bg-indigo-50 text-indigo-600", label: "Secure Backend",        desc: "MongoDB enterprise-grade security" },
                { icon: FiUsers,    color: "bg-teal-50 text-teal-600",     label: "Role-Based Access",     desc: "Fine-grained permission controls" },
              ].map(({ icon: Icon, color, label, desc }) => (
                <div key={label} className="flex items-start gap-3 p-4 bg-[var(--color-bg-soft)] rounded-lg border border-[var(--color-border)]">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[var(--color-text)]">{label}</p>
                    <p className="text-[11px] font-medium text-[var(--color-muted)]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Section 3: Danger Zone ────────────────────────────────────── */}
        <div className="rounded-lg border-2 border-red-200 bg-red-50/40 overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-red-200 bg-red-50/70">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <FiAlertCircle size={17} />
            </div>
            <div>
              <h2 className="text-sm font-black text-red-900">Danger Zone</h2>
              <p className="text-xs font-medium text-red-700/70">Irreversible actions that affect your entire workspace</p>
            </div>
          </div>
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <h3 className="text-sm font-black text-[var(--color-text)]">Delete this workspace</h3>
              <p className="text-xs font-medium text-[var(--color-muted)] max-w-md mt-1 leading-relaxed">
                Once you delete a workspace, there is no going back. All data, users, and processes will be permanently removed.
              </p>
            </div>
            <Button
              variant="danger"
              icon={FiTrash2}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Workspace
            </Button>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-[var(--shadow-popover)] w-full max-w-md overflow-hidden border border-[var(--color-border)]">
            {/* Red header */}
            <div className="bg-red-600 p-6 flex flex-col items-center text-center text-white">
              <div className="bg-white/20 p-3 rounded-full mb-3">
                <FiTrash2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-black">Hold On!</h3>
              <p className="text-red-100 text-sm mt-1 font-medium">This action is irreversible.</p>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm font-medium text-[var(--color-muted)] text-center">
                To confirm, type the workspace name:
                <span className="block mt-1 font-black text-[var(--color-text)] tracking-wide">
                  &ldquo;{workspaceName}&rdquo;
                </span>
              </p>

              <input
                type="text" value={confirmName} onChange={(e) => setConfirmName(e.target.value)}
                placeholder="Type workspace name"
                className="w-full border-2 border-red-100 rounded-lg py-3 px-4 text-sm text-center font-black tracking-wider focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none transition-all"
              />

              <div className="flex flex-col gap-3">
                <button
                  disabled={confirmName !== workspaceName || isDeleting}
                  onClick={handleDeleteWorkspace}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black tracking-wide transition-all shadow-md shadow-red-600/25 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                >
                  {isDeleting ? "Deleting..." : "Confirm Deletion"}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-2.5 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
                >
                  No, Keep it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
