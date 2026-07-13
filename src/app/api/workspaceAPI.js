import api from "./axios";
import { userAPI } from "./userAPI";
import { processAPI } from "./processAPI";

const buildWorkspaceOverviewFallback = async () => {
  const workspace =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("workspace") || "{}")
      : {};

  let usersResult      = { success: false, users: [], total: 0 };
  let processesResult  = { success: false, data: [], analytics: {} };
  let activityResult   = { success: false, logs: [] };

  try {
    usersResult = await userAPI.getWorkspaceUsers({ limit: 100, page: 1 });
  } catch (err) {
    console.error("Fallback workspace users fetch failed:", err);
  }

  try {
    processesResult = await processAPI.getWorkspaceProcesses({ limit: 50, page: 1 });
  } catch (err) {
    console.error("Fallback workspace processes fetch failed:", err);
  }

  try {
    // Call the endpoint directly — workspaceAPI object isn't defined yet here
    const activityRes = await api.get("/activity-log/list?page=1&limit=10");
    const d = activityRes.data;
    activityResult = {
      success: true,
      logs: d?.logs || d?.activityLogs || d?.activities || d?.data || [],
    };
  } catch (err) {
    console.error("Fallback activity logs fetch failed:", err);
  }

  const membersTotal =
    usersResult?.success === true
      ? (usersResult.total ??
        (Array.isArray(usersResult.users) ? usersResult.users.length : 0))
      : Array.isArray(workspace?.members)
        ? workspace.members.length
        : 0;

  const processItems = Array.isArray(processesResult?.data) ? processesResult.data : [];
  const analytics    = processesResult?.analytics || {};

  const countByStatus = (statusValues) =>
    processItems.filter((process) =>
      statusValues.includes((process?.status || "").toString().toLowerCase()),
    ).length;

  return {
    success: true,
    members: { total: membersTotal },
    processes: {
      active:    { total: analytics.active?.total    ?? countByStatus(["active", "in-progress", "ongoing"])       },
      pending:   { total: analytics.pending?.total   ?? countByStatus(["pending", "awaiting", "in-review"])        },
      completed: { total: analytics.completed?.total ?? countByStatus(["completed", "done"])                       },
    },
    recentActivities: activityResult.logs || [],
    fallback: true,
  };
};

const workspaceAPI = {
  getWorkspaceOverview: async () => {
    console.info("[workspaceAPI] getWorkspaceOverview start");
    try {
      const response = await api.get("/workspace/overview");
      const data = response.data;
      const denied =
        data?.success === false ||
        data?.isSuccess === false ||
        (typeof data?.message === "string" &&
          data.message.toLowerCase().includes("permission")) ||
        (typeof data?.error === "string" &&
          data.error.toLowerCase().includes("permission"));

      if (denied) {
        console.warn(
          "[workspaceAPI] workspace overview denied by backend, falling back.",
          data,
        );
        return await buildWorkspaceOverviewFallback();
      }

      console.info("[workspaceAPI] workspace overview successful", data);
      return { ...data, success: true };
    } catch (error) {
      console.error("[workspaceAPI] Error fetching workspace overview:", error);
      if (error.response?.status === 403) {
        console.warn(
          "[workspaceAPI] workspace overview returned 403, falling back.",
        );
        return await buildWorkspaceOverviewFallback();
      }
      throw error;
    }
  },

  getActivityLogs: async (page = 1, limit = 20) => {
    try {
      const response = await api.get(
        `/activity-log/list?page=${page}&limit=${limit}`,
      );
      const data = response.data;

      // Normalize — backend may return logs under different keys
      const logs =
        data?.logs ||
        data?.activityLogs ||
        data?.activities ||
        data?.data ||
        [];

      return {
        success: true,
        logs:       Array.isArray(logs) ? logs : [],
        page:       data?.page       ?? page,
        limit:      data?.limit      ?? limit,
        total:      data?.total      ?? data?.totalCount ?? logs.length,
        totalPages: data?.totalPages ?? data?.pages      ?? 1,
      };
    } catch (error) {
      console.error("[workspaceAPI] Error fetching activity logs:", error);
      // Return a normalized failure shape — the page can decide how to render
      return {
        success:    false,
        logs:       [],
        page,
        limit,
        total:      0,
        totalPages: 1,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch activity logs",
        status: error.response?.status,
      };
    }
  },
  deleteWorkspace: async () => {
    try {
      const response = await api.delete("/workspace/deleteWorkspace");
      return response.data;
    } catch (error) {
      console.error("Error deleting workspace:", error);
      throw error;
    }
  },
};

export default workspaceAPI;
