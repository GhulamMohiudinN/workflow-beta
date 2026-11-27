/**
 * What each workspace role may see in the app.
 *
 * Mirrors effectiveRole and requireRole on the server, which is what actually
 * enforces access — this file only keeps the interface from offering things
 * the server will refuse. The roles are as the invite screen describes them:
 *
 *   Admin  — everything in the workspace
 *   Editor — create and edit processes, templates and steps; no users,
 *            company settings, IRIS, invoices, contracts or activity logs
 *   Viewer — read-only view of all processes (the member area)
 */

/** 'admin' | 'editor' | 'viewer' | 'owner' (platform operator) | null */
export function workspaceRoleOf(user) {
  if (!user) return null;
  if (user.userType === "owner") return "owner";
  if (user.userType === "admin") return "admin";
  if (user.userType === "member" && ["admin", "editor", "viewer"].includes(user.role)) return user.role;
  return null;
}

/** Areas of the main app that only admins may open. */
export const ADMIN_ONLY_PATHS = [
  "/iris-reporting",
  "/invoicing",
  "/contracts",
  "/users",
  "/company",
  "/activity-logs",
];

export function canOpenPath(user, path) {
  const role = workspaceRoleOf(user);
  if (role === "admin") return true;
  if (role === "editor") return !ADMIN_ONLY_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  return false;
}

export const can = {
  editProcesses:   (user) => ["admin", "editor"].includes(workspaceRoleOf(user)),
  deleteProcesses: (user) => workspaceRoleOf(user) === "admin",
  manageUsers:     (user) => workspaceRoleOf(user) === "admin",
  // Only the person who owns the workspace, not an admin they invited.
  deleteWorkspace: (user) => user?.userType === "admin",
};

/**
 * Where a notification should take this user, or null if they cannot open it.
 * Process links point at the main app; viewers read processes in the member
 * area instead, so the link is translated for them.
 */
export function notificationLinkFor(user, link) {
  if (!link) return null;
  const role = workspaceRoleOf(user);
  const processMatch = link.match(/^\/processes\/([^/?#]+)/);
  if (processMatch) {
    if (role === "admin" || role === "editor") return link;
    if (role === "viewer") return `/users/processesUsers/${processMatch[1]}`;
    return null;
  }
  return canOpenPath(user, link) ? link : null;
}
