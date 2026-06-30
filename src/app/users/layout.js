"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiHome, FiLayers, FiUser, FiLogOut, FiMenu, FiX, FiBell,
  FiGrid, FiChevronRight,
} from "react-icons/fi";
import { FiBriefcase } from "react-icons/fi";

export default function UserLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted]     = useState(false);
  const [user, setUser]               = useState(null);
  const [role, setRole]               = useState(null);
  const pathname = usePathname();
  const router   = useRouter();

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedUser = localStorage.getItem("user");
      const storedRole = localStorage.getItem("role");
      if (!storedUser || !storedRole) { router.push("/login"); return; }
      const r = storedRole?.toLowerCase();
      if (r === "admin" || r === "superadmin" || r === "editor") {
        router.push("/dashboard"); return;
      }
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
    } catch {
      router.push("/login");
    }
  }, [router]);

  if (!isMounted || !user || !role) return null;

  const navigation = [
    { name: "Dashboard",  href: "/users/dashboardUsers",  icon: FiGrid },
    { name: "Processes",  href: "/users/processesUsers",  icon: FiLayers },
    { name: "My Profile", href: "/users/profile",         icon: FiUser },
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  const handleSignOut = () => {
    ["user","role","workspace","accessToken","refreshToken","userId"].forEach((k) => localStorage.removeItem(k));
    router.push("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--color-primary)] p-2 rounded-lg">
              <FiBriefcase className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-[var(--color-text)]">WorkflowPro</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-bg)] lg:hidden transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-black text-[var(--color-faint)] uppercase tracking-wider">Main Menu</p>
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group ${
                  active
                    ? "bg-blue-50 text-[var(--color-primary)]"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${active ? "text-[var(--color-primary)]" : "text-[var(--color-faint)] group-hover:text-[var(--color-muted)]"}`} />
                  <span className="text-sm font-semibold">{item.name}</span>
                </div>
                {active && <FiChevronRight className="h-3.5 w-3.5 text-[var(--color-primary)]" />}
              </Link>
            );
          })}
        </nav>

        {/* User info + sign out */}
        <div className="border-t border-[var(--color-border)] p-3 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--color-bg-soft)]">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-[var(--color-text)] truncate">{user?.name || "User"}</p>
              <p className="text-xs text-[var(--color-muted)] truncate capitalize">{user?.userType || "member"}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2.5 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-danger)] transition-colors"
          >
            <FiLogOut className="h-4 w-4 mr-3" />
            <span className="text-sm font-semibold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-[var(--color-muted)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-bg)] transition-colors lg:hidden"
            >
              <FiMenu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <FiHome className="h-4 w-4" />
              <FiChevronRight className="h-3.5 w-3.5" />
              <span className="font-semibold text-[var(--color-text)] capitalize">
                {navigation.find((n) => isActive(n.href))?.name || "Dashboard"}
              </span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button className="relative p-2 text-[var(--color-muted)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-bg)] transition-colors">
                <FiBell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--color-danger)] rounded-full" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-black">
                  {initials}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-black text-[var(--color-text)] leading-none">{user?.name || "User"}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5 capitalize">{user?.userType || "member"}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
