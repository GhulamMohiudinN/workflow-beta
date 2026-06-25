"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CiViewList } from "react-icons/ci";
import { CgOrganisation } from "react-icons/cg";
import { FiGrid, FiSettings, FiUsers } from "react-icons/fi";
import { LuChartNoAxesCombined } from "react-icons/lu";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { PiNetworkThin } from "react-icons/pi";
import { RiCompassesLine } from "react-icons/ri";
import { socket } from "../utils/socket";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

export const dynamic = "force-dynamic";

export default function ProcessesLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const navigation = useMemo(() => {
    const items = [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: FiGrid,
        current: pathname.includes("/dashboard"),
      },
      {
        name: "Company",
        href: "/company",
        icon: CgOrganisation,
        current: pathname.includes("/company"),
      },
      {
        name: "Processes",
        href: "/processes",
        icon: PiNetworkThin,
        current: pathname.includes("/processes"),
      },
      {
        name: "Templates",
        href: "/templates",
        icon: MdOutlineDashboardCustomize,
        current: pathname.includes("/templates"),
      },
      {
        name: "Process Builder",
        href: "/builder",
        icon: RiCompassesLine,
        current: pathname.includes("/builder"),
      },
    ];

    if (role === "admin" || role === "superadmin" || role === "editor") {
      items.push({
        name: "Users",
        href: "/users",
        icon: FiUsers,
        current: pathname.includes("/users"),
      });
    }

    items.push(
      {
        name: "Settings",
        href: "/settings",
        icon: FiSettings,
        current: pathname.includes("/settings"),
      },
      {
        name: "Activity Logs",
        href: "/activity-logs",
        icon: CiViewList,
        current: pathname.includes("/activity-logs"),
      },
      {
        name: "Reports",
        href: "/dashboard",
        icon: LuChartNoAxesCombined,
        current: false,
      },
    );

    return items;
  }, [pathname, role]);

  useEffect(() => {
    const initId = window.setTimeout(() => {
      setIsMounted(true);

      try {
        const storedUser = localStorage.getItem("user");
        const storedRole = localStorage.getItem("role");
        const storedWorkspace = localStorage.getItem("workspace");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        let normalizedRole = storedRole?.toLowerCase();

        if (normalizedRole === "member" && parsedUser?.role) {
          normalizedRole = parsedUser.role.toLowerCase();
          localStorage.setItem("role", normalizedRole);
        }

        setUser(parsedUser);
        setRole(normalizedRole);
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

  useEffect(() => {
    if (!isMounted) return;

    if (!user || !role || !workspace) {
      router.push("/login");
      return;
    }

    const readyId = window.setTimeout(() => setLoading(false), 0);
    return () => window.clearTimeout(readyId);
  }, [isMounted, role, router, user, workspace]);

  useEffect(() => {
    if (!isMounted) return;

    const userId = localStorage.getItem("userId");
    if (userId) socket.emit("register", userId);
  }, [isMounted]);

  if (!isMounted || loading) return null;

  const signout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("workspace");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    setUser(null);
    setRole(null);
    setWorkspace(null);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
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
          notifications={[]}
        />

        <main className="flex-1 py-6">
          <div className="px-4 sm:px-6">{children}</div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
