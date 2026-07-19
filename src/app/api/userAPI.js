import api from "./axios";

export const userAPI = {
  /**
   * GET /users/workspace-users
   * Response: { success, analytics, total, page, limit, totalPages, users }
   */
  getWorkspaceUsers: async ({ page = 1, limit = 50, role = "", search = "" } = {}) => {
    try {
      // Clamp limit to backend-safe maximum of 100
      const safeLimit = Math.min(Number(limit) || 50, 100);
      const params = new URLSearchParams({ page, limit: safeLimit });
      if (role && role !== "all") params.append("role", role);
      if (search) params.append("search", search);

      const response = await api.get(`/users/workspace-users?${params.toString()}`);
      return {
        success: true,
        users: response.data.users || [],
        analytics: response.data.analytics || null,
        total: response.data.total ?? 0,
        page: response.data.page ?? 1,
        limit: response.data.limit ?? limit,
        totalPages: response.data.totalPages ?? 0,
      };
    } catch (error) {
      return {
        success: false,
        users: [],
        error: error.response?.data?.message || error.message || "Failed to fetch users",
        status: error.response?.status,
      };
    }
  },

  /**
   * PATCH /users/update-user
   * Body: { name, role }
   * Response: { success, user }
   */
  updateUser: async (payload) => {
    try {
      const body = {};
      if (payload.name !== undefined) body.name = payload.name;
      if (payload.role !== undefined) body.role = payload.role;
      const response = await api.patch("/users/update-user", body);
      return {
        success: true,
        user: response.data.user,
        message: response.data.message || "User updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to update user",
        status: error.response?.status,
      };
    }
  },

  /**
   * DELETE /users/delete-user/:userId
   * Superadmin only.
   */
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/delete-user/${userId}`);
      return {
        success: true,
        message: response.data.message || "User deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to delete user",
        status: error.response?.status,
      };
    }
  },
};

export default userAPI;
