/**
 * Where an account belongs once signed in.
 *
 * Shared by the login page and the /app launcher the installed desktop app
 * opens on, so the two can never disagree about where someone lands.
 */
export function homeRouteFor(user, workspace) {
  if (!user) return "/login";

  // A platform operator has no workspace by design, so they must be caught
  // before the no-workspace branch below sends them into the setup wizard.
  if (user.userType === "owner") return "/platform";

  // Editors and viewers get the member area. A member invited as Admin falls
  // through to the full dashboard: sending every member here regardless of
  // role is why an invited admin could never reach invoices, contracts or
  // IRIS evidence.
  if (user.userType === "member" && user.role !== "admin") return "/users/dashboardUsers";

  // Verified but never finished the workspace-setup wizard: resume it rather
  // than dropping them on a dashboard with no workspace.
  if (!workspace) return "/workspaceCreation";

  return "/dashboard";
}
