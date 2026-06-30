"use client";
import { useState } from "react";
import Link from "next/link";
import {
  FiMail, FiShield, FiCheck, FiSend, FiHelpCircle, FiUser,
  FiArrowLeft, FiEdit2, FiEye, FiDollarSign,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import adminAPI from "../../../api/admin";
import { Card, CardContent, CardHeader } from "../../../../components/Card";
import { Button } from "../../../../components/Button";
import { Badge } from "../../../../components/Badge";

const ROLE_CONFIG = {
  admin: {
    variant: "danger",
    description: "Full system access — manages users, settings & all processes.",
    permissions: ["Create processes", "Edit processes", "Delete processes", "Manage users", "View analytics"],
  },
  editor: {
    variant: "primary",
    description: "Can create & edit processes but cannot manage users.",
    permissions: ["Create processes", "Edit processes", "View analytics"],
  },
  viewer: {
    variant: "success",
    description: "Read-only access to view processes and analytics.",
    permissions: ["View processes", "View analytics"],
  },
};

export default function AddUserPage() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError]     = useState("");
  const [success, setSuccess]           = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", role: "editor", price: "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError(""); setIsSubmitting(true);
    if (!formData.name.trim()) {
      toast.error("Please enter the member's name"); setIsSubmitting(false); return;
    }
    if (!formData.email || !emailRegex.test(formData.email)) {
      setEmailError("Invalid email address"); setIsSubmitting(false); return;
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      toast.error("Please enter a valid rate"); setIsSubmitting(false); return;
    }
    try {
      await adminAPI.inviteTeamMember({
        name: formData.name, email: formData.email,
        role: formData.role, rate: parseFloat(formData.price),
      });
      toast.success("Invitation sent successfully!");
      setSuccess(true);
      setFormData({ name: "", email: "", role: "editor", price: "" });
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to send invitation. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cfg = ROLE_CONFIG[formData.role];

  return (
    <div className="-m-4 min-h-[calc(100vh-9rem)] space-y-6 bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:-m-6 sm:p-6">
      <Toaster duration={4000} position="top-right" />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)]">Add Team Member</h1>
          <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
            Invite a new member to your workspace via email.
          </p>
        </div>
        <Link href="/users">
          <Button variant="outline" icon={FiArrowLeft}>Back to Members</Button>
        </Link>
      </div>

      {success ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 border-2 border-green-100">
              <FiCheck className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-[var(--color-text)] mb-2">Invitation Sent!</h2>
            <p className="text-[var(--color-muted)] text-sm mb-6 max-w-sm">
              An invitation email has been dispatched. Once they accept, they will be added to your workspace.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setSuccess(false)}
              >
                Invite Another
              </Button>
              <Link href="/users">
                <Button icon={FiUser}>View Members</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* ── Left: Form ─────────────────────────────────────────────── */}
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <h2 className="text-sm font-black text-[var(--color-text)]">Member Details</h2>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">
                      Full Name <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <div className="relative">
                      <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" size={16} />
                      <input
                        type="text" name="name" value={formData.name} onChange={handleInputChange}
                        required disabled={isSubmitting}
                        className="app-focus h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] disabled:opacity-60"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">
                      Email Address <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <div className="relative">
                      <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" size={16} />
                      <input
                        type="email" name="email" value={formData.email} onChange={handleInputChange}
                        required disabled={isSubmitting}
                        className="app-focus h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] disabled:opacity-60"
                        placeholder="team.member@company.com"
                      />
                    </div>
                    {emailError && <p className="mt-1.5 text-xs font-semibold text-[var(--color-danger)]">{emailError}</p>}
                  </div>

                  {/* Rate */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">
                      Rate ($/hr) <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <div className="relative">
                      <FiDollarSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" size={16} />
                      <input
                        type="number" name="price" value={formData.price} onChange={handleInputChange}
                        required disabled={isSubmitting} step="0.01" min="0"
                        className="app-focus h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] disabled:opacity-60"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Role selection */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                      Role <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {Object.entries(ROLE_CONFIG).map(([r, rcfg]) => {
                        const icons = { admin: FiShield, editor: FiEdit2, viewer: FiEye };
                        const RoleIcon = icons[r];
                        return (
                          <button
                            key={r} type="button"
                            onClick={() => !isSubmitting && setFormData((p) => ({ ...p, role: r }))}
                            disabled={isSubmitting}
                            className={`rounded-lg border-2 p-4 text-left transition-all ${
                              formData.role === r
                                ? "border-[var(--color-primary)] bg-blue-50"
                                : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-blue-50/30"
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <RoleIcon size={15} className={formData.role === r ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"} />
                              <span className="font-black text-sm capitalize text-[var(--color-text)]">{r}</span>
                            </div>
                            <p className="text-xs text-[var(--color-muted)]">{rcfg.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex justify-end">
                <Button type="submit" loading={isSubmitting} icon={FiSend} size="lg">
                  Send Invitation
                </Button>
              </div>
            </div>

            {/* ── Right: Role Info ────────────────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-5">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-black text-[var(--color-text)]">Role Permissions</h2>
                      <Badge variant={cfg.variant} size="sm" className="capitalize">{formData.role}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-[var(--color-muted)]">{cfg.description}</p>
                    <ul className="space-y-2">
                      {cfg.permissions.map((permission) => (
                        <li key={permission} className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                          <FiCheck className="h-4 w-4 text-[var(--color-success)] flex-shrink-0" />
                          {permission}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-primary)]">
                        <FiHelpCircle size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[var(--color-text)]">Invitation Process</p>
                        <ul className="mt-2 space-y-1 text-xs text-[var(--color-muted)]">
                          <li>• User receives an email invitation</li>
                          <li>• They create their account via the link</li>
                          <li>• Automatically added to your workspace</li>
                          <li>• Access granted based on assigned role</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                        <FiShield size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[var(--color-text)]">Security Note</p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          Each user gets their own secure login. You can modify permissions or revoke access at any time from the Members page.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
