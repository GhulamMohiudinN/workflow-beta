import { FiDollarSign, FiFileText, FiGrid, FiSettings, FiShield, FiUsers } from "react-icons/fi";
import { CgOrganisation } from "react-icons/cg";
import { PiNetworkThin } from "react-icons/pi";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { RiCompassesLine } from "react-icons/ri";
import { CiViewList } from "react-icons/ci";
import { LuChartNoAxesCombined } from "react-icons/lu";
import { ADMIN_ONLY_PATHS, workspaceRoleOf } from "../app/utils/permissions";

const ITEMS = [
  { name: "Dashboard",       href: "/dashboard",      icon: FiGrid },
  { name: "Company",         href: "/company",        icon: CgOrganisation },
  { name: "Processes",       href: "/processes",      icon: PiNetworkThin },
  { name: "Templates",       href: "/templates",      icon: MdOutlineDashboardCustomize },
  { name: "Process Builder", href: "/builder",        icon: RiCompassesLine },
  { name: "Users",           href: "/users",          icon: FiUsers },
  { name: "Settings",        href: "/settings",       icon: FiSettings },
  { name: "Activity Logs",   href: "/activity-logs",  icon: CiViewList },
  { name: "Reports",         href: "/reports",        icon: LuChartNoAxesCombined },
  { name: "IRIS Reporting",  href: "/iris-reporting", icon: FiShield },
  { name: "Invoicing",       href: "/invoicing",      icon: FiDollarSign },
  { name: "Contracts",       href: "/contracts",      icon: FiFileText },
];

/**
 * The main-app sidebar for this user.
 *
 * Shared by every layout that shows it. There used to be two copies — one in
 * the dashboard layout, one in the processes layout — and they had drifted:
 * the processes copy showed IRIS Reporting to everyone and had no Contracts
 * link even for admins. Admin-only areas are hidden from everyone else; the
 * server is what refuses them, this just stops offering them.
 */
export function buildNavigation(pathname, user, storedRole) {
  const role = workspaceRoleOf(user) || storedRole;
  const items = role === "admin" ? ITEMS : ITEMS.filter((item) => !ADMIN_ONLY_PATHS.includes(item.href));
  return items.map((item) => ({ ...item, current: pathname.includes(item.href) }));
}
