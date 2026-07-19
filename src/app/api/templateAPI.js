import api from "./axios";

export const templateAPI = {
  /**
   * POST /template/create
   */
  createTemplate: async (templateData) => {
    try {
      const payload = {
        name: templateData.name,
        description: templateData.description || "",
        category: templateData.category || "",
        status: templateData.status || "draft",
        settings: {
          notifications: {
            email: templateData.notifications?.email ?? true,
            slack: templateData.notifications?.slack ?? false,
            inApp: templateData.notifications?.inApp ?? true,
          },
          automation: {
            autoAssignTasks: templateData.automation?.autoAssign ?? false,
            dueDateReminders: templateData.automation?.dueDateReminders ?? true,
            escalateOverdueTasks: templateData.automation?.escalation ?? false,
          },
        },
        steps: (templateData.steps || []).map((step, index) => ({
          title: step.title,
          description: step.description || "",
          timeEstimate: step.timeEstimate || "1d",
          notes: step.notes || "",
          status: step.status || "draft",
          coordinates: step.coordinates || { x: (index + 1) * 200, y: 200 },
          sequence: step.sequence || step.order || index + 1,
        })),
      };

      const response = await api.post("/template/create", payload);
      return {
        success: true,
        data: response.data?.template || response.data,
        message: response.data?.message || "Template created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create template",
        status: error.response?.status,
      };
    }
  },

  /**
   * PATCH /template/update/:templateId
   */
  updateTemplate: async (templateId, updatedData) => {
    try {
      if (!templateId) return { success: false, error: "Template ID required" };

      const payload = {};
      if (updatedData.name !== undefined) payload.name = updatedData.name;
      if (updatedData.description !== undefined)
        payload.description = updatedData.description;
      if (updatedData.category !== undefined)
        payload.category = updatedData.category;
      if (updatedData.status !== undefined) payload.status = updatedData.status;
      if (updatedData.steps !== undefined) {
        payload.steps = updatedData.steps.map((step, index) => ({
          ...(step._id ? { _id: step._id } : {}),
          title: step.title,
          description: step.description || "",
          timeEstimate: step.timeEstimate || "1d",
          notes: step.notes || "",
          status: step.status || "draft",
          coordinates: step.coordinates || { x: (index + 1) * 200, y: 200 },
          sequence: step.sequence || step.order || index + 1,
        }));
      }

      const response = await api.patch(
        `/template/update/${templateId}`,
        payload,
      );
      return {
        success: true,
        data: response.data?.template || response.data,
        message: response.data?.message || "Template updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update template",
        status: error.response?.status,
      };
    }
  },

  /**
   * DELETE /template/delete/:templateId
   */
  deleteTemplate: async (templateId) => {
    try {
      if (!templateId) return { success: false, error: "Template ID required" };
      const response = await api.delete(`/template/delete/${templateId}`);
      return {
        success: true,
        message: response.data?.message || "Template deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete template",
        status: error.response?.status,
      };
    }
  },

  /**
   * GET /template/list?page=1&limit=10&status=draft&search=compliance
   */
  listTemplates: async ({ page = 1, limit = 20, status = "", search = "" } = {}) => {
    try {
      // Clamp limit to backend-safe maximum of 100
      const safeLimit = Math.min(Number(limit) || 20, 100);
      const params = new URLSearchParams({ page, limit: safeLimit });
      if (status && status !== "all") params.append("status", status);
      if (search) params.append("search", search);

      const response = await api.get(`/template/list?${params.toString()}`);
      return {
        success: true,
        data: response.data?.templates || response.data?.data || [],
        total: response.data?.total ?? 0,
        page: response.data?.page ?? 1,
        limit: response.data?.limit ?? limit,
        totalPages: response.data?.totalPages ?? 0,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch templates",
        status: error.response?.status,
      };
    }
  },

  /**
   * GET /template/:templateId
   */
  getTemplate: async (templateId) => {
    try {
      if (!templateId) return { success: false, error: "Template ID required" };
      const response = await api.get(`/template/${templateId}`);
      const templateData =
        response.data?.template || response.data?.data || response.data;
      return {
        success: true,
        data: templateData,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch template",
        status: error.response?.status,
      };
    }
  },
};

export default templateAPI;
