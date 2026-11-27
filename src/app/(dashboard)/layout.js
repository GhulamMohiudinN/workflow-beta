"use client";
import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { disconnectSocket } from "../utils/socket";
import { canOpenPath, workspaceRoleOf } from "../utils/permissions";
import { buildNavigation } from "../../components/navigation";
import api from "../api/axios";

import {
  FiBarChart2,
  FiBriefcase,
  FiDollarSign,
  FiFileText,
  FiGitBranch,
  FiGrid,
  FiLayout,
  FiList,
  FiSettings,
  FiShield,
  FiTool,
  FiUsers,
} from "react-icons/fi";
import { CgOrganisation } from "react-icons/cg";
import { PiNetworkThin } from "react-icons/pi";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { RiCompassesLine } from "react-icons/ri";
import { CiViewList } from "react-icons/ci";
import { LuChartNoAxesCombined } from "react-icons/lu";

import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import AIAssistant from "../../components/AIAssistant";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const navigation = useMemo(
    () => buildNavigation(pathname, user, role),
    [pathname, user, role]
  );

  // Single initialization effect - runs once on client mount
  useEffect(() => {
    const initId = window.setTimeout(() => {
      setIsMounted(true);

      try {
        const storedUser = localStorage.getItem("user");
        const storedRole = localStorage.getItem("role");
        const storedWorkspace = localStorage.getItem("workspace");

        // Set state from localStorage after the first client paint.
        setUser(storedUser ? JSON.parse(storedUser) : null);
        setRole(storedRole);
        setWorkspace(storedWorkspace ? JSON.parse(storedWorkspace) : null);
      } catch (err) {
        console.error("Error loading user data from storage:", err);
        setUser(null);
        setRole(null);
        setWorkspace(null);
      }
    }, 0);

    return () => window.clearTimeout(initId);
  }, []);

  // Authorization check effect
  useEffect(() => {
    if (!isMounted) return;

    if (!user || !role || !workspace) {
      router.push("/login");
      return;
    }

    if (role !== "admin" && role !== "editor") {
      router.push("/users/dashboardUsers");
      return;
    }

    if (!canOpenPath(user, pathname) && workspaceRoleOf(user) === "editor") {
      router.replace("/dashboard");
      return;
    }

    const readyId = window.setTimeout(() => {
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(readyId);
  }, [isMounted, user, role, workspace, router, pathname]);

  // Render only when mounted on client
  if (!isMounted || loading) {
    return null; // Prevent hydration mismatch and show loading
  }

  const signout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("workspace");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    disconnectSocket();
    setUser(null);
    setRole(null);
    setWorkspace(null);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        currentPath={pathname}
        workspace={workspace}
        onLogout={signout}
      />

      <div className="flex min-h-screen flex-col lg:ml-64">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          workspace={workspace}
          onLogout={signout}
        />

        <main className="flex-1 py-6">
          <div className="px-4 sm:px-6">{children}</div>
        </main>

        <Footer />
      </div>
      <AIAssistant />
    </div>
  );
}
