import api from "./axios";

export const processAPI = {

  createProcess: async (processData) => {
    try {
      const payload = transformFormDataToAPI(processData);
      const response = await api.post("/process/create", payload);
      return {
        success: true,
        data: response.data,
        message: "Process created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create process",
        status: error.response?.status,
      };
    }
  },

 
  getProcesses: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.search)   params.append("search",   filters.search);
      if (filters.status)   params.append("status",   filters.status);
      if (filters.category) params.append("category", filters.category);
      if (filters.page)     params.append("page",     filters.page);
      // Clamp limit to backend-safe maximum of 100
      const limit = filters.limit ? Math.min(Number(filters.limit), 100) : undefined;
      if (limit)            params.append("limit",    limit);

      const response = await api.get(
        `/process/workspace/list${params.toString() ? "?" + params.toString() : ""}`,
      );

      return {
        success: true,
        data: response.data.processes || [],
        analytics: response.data.analytics || null,
        total: response.data.total ?? 0,
        page: response.data.page ?? 1,
        limit: response.data.limit ?? 10,
        totalPages: response.data.totalPages ?? 0,
        message: "Processes fetched successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch processes",
        status: error.response?.status,
      };
    }
  },

 
  getWorkspaceProcesses: async (filters = {}) => {
    return processAPI.getProcesses(filters);
  },

 
  getProcess: async (processId) => {
    try {
      if (!processId) {
        return {
          success: false,
          error: "Process ID is required",
          status: 400,
        };
      }

      const response = await api.get(`/process/${processId}`);

      const processData =
        response.data?.process || response.data?.data || response.data;

      if (!processData || !(processData._id || processData.id)) {
        return {
          success: false,
          error: "Invalid process data returned from server",
          status: 500,
        };
      }

      return {
        success: true,
        data: processData,
        message: "Process fetched successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch process",
        status: error.response?.status,
      };
    }
  },

 
  updateProcess: async (processId, updatedData) => {
    try {
      if (!processId) {
        return { success: false, error: "Process ID is required", status: 400 };
      }

      const payload = transformFormDataToAPI(updatedData);
      const response = await api.patch(`/process/update/${processId}`, payload);

      return {
        success: true,
        data: response.data,
        message: "Process updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update process",
        status: error.response?.status,
      };
    }
  },

  
  deleteProcess: async (processId) => {
    try {
      if (!processId) {
        return { success: false, error: "Process ID is required", status: 400 };
      }

      const response = await api.delete(`/process/delete/${processId}`);

      return {
        success: true,
        data: response.data,
        message: "Process deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete process",
        status: error.response?.status,
      };
    }
  },

  duplicateProcess: async (processId) => {
    try {
      const response = await api.post(`/process/${processId}/duplicate`);
      return {
        success: true,
        data: response.data,
        message: "Process duplicated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to duplicate process",
        status: error.response?.status,
      };
    }
  },

 
  publishProcess: async (processId) => {
    try {
      const response = await api.post(`/process/${processId}/publish`);
      return {
        success: true,
        data: response.data,
        message: "Process published successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to publish process",
        status: error.response?.status,
      };
    }
  },

  
  archiveProcess: async (processId) => {
    try {
      const response = await api.post(`/process/${processId}/archive`);
      return {
        success: true,
        data: response.data,
        message: "Process archived successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to archive process",
        status: error.response?.status,
      };
    }
  },


  getAssignedProcesses: async (filters = {}) => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => value != null && value !== "",
        ),
      );
      const queryString = new URLSearchParams(cleanFilters).toString();

      const response = await api.get(
        `/process/assigned/me${queryString ? "?" + queryString : ""}`,
      );

      return {
        success: true,
        data: response.data.processes || [],
        count: response.data.count ?? 0,
        message: "Assigned processes fetched successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch assigned processes",
        status: error.response?.status,
      };
    }
  },

 
  updateStepSequence: async (stepId, sequenceNo) => {
    try {
      if (!stepId) {
        return { success: false, error: "Step ID is required", status: 400 };
      }

      const response = await api.patch(`/step/update/${stepId}`, {
        sequenceNo,
      });

      return {
        success: true,
        data: response.data,
        message: "Step sequence updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update step sequence",
        status: error.response?.status,
      };
    }
  },

 
  deleteStep: async (stepId) => {
    try {
      const response = await api.delete(`/step/delete/${stepId}`);
      return {
        success: true,
        data: response.data,
        message: "Step deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete step",
        status: error.response?.status,
      };
    }
  },

 
  updateStep: async (stepId, stepData) => {
    try {
      const response = await api.patch(`/step/update/${stepId}`, stepData);
      return {
        success: true,
        data: response.data,
        message: "Step updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update step",
        status: error.response?.status,
      };
    }
  },

  
  completeStep: async (stepId) => {
    try {
      if (!stepId) {
        return { success: false, error: "Step ID is required", status: 400 };
      }

      const response = await api.patch(`/step/complete/${stepId}`);
      return {
        success: true,
        data: response.data,
        message: "Step completed successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to complete step",
        status: error.response?.status,
      };
    }
  },
};


function transformFormDataToAPI(formData) {
  return {
    name: formData.name,
    description: formData.description,
    category: formData.category,
    visibility: formData.visibility,
    status: formData.status,
    settings: {
      notifications: {
        email: formData.notifications?.email ?? true,
        slack: formData.notifications?.slack ?? false,
        inApp: formData.notifications?.inApp ?? true,
      },
      automation: {
        autoAssignTasks: formData.automation?.autoAssign ?? false,
        dueDateReminders: formData.automation?.dueDateReminders ?? true,
        escalateOverdueTasks: formData.automation?.escalation ?? false,
      },
    },
    assignees: (formData.assignees || formData.assignedTo || []).map((a) =>
      typeof a === "string" ? a : a._id || a.id,
    ),
    steps: (formData.steps || []).map((step) => ({
      ...(step._id && !String(step._id).startsWith("step-")
        ? { _id: step._id }
        : step.id && !String(step.id).startsWith("step-")
          ? { _id: step.id }
          : {}),
      title: step.title,
      description: step.description,
      timeEstimate: step.timeEstimate,
      notes: step.notes || "",
      status: step.status || "draft",
      order: step.order,
      sequenceNo: step.sequenceNo || step.order || 0,
      assignee: typeof step.assignee === "string" ? step.assignee : step.assignee?._id || step.assignee?.id || "",
    })),
  };
}


export function transformAPIToFormData(apiData) {
  return {
    name: apiData.name,
    description: apiData.description,
    category: apiData.category,
    visibility: apiData.visibility,
    status: apiData.status,
    assignees: apiData.assignees || apiData.assignedTo || [],
    steps: (apiData.steps || []).map((step, index) => ({
      id: step._id || `step-${index + 1}`,
      _id: step._id || null,
      title: step.title,
      description: step.description,
      timeEstimate: step.timeEstimate,
      notes: step.notes,
      order: step.sequenceNo ?? index + 1,
      sequenceNo: step.sequenceNo ?? index + 1,
      status: step.status,
      assignee: step.assignee || "",
    })),
    notifications: {
      email: apiData.settings?.notifications?.email ?? true,
      slack: apiData.settings?.notifications?.slack ?? false,
      inApp: apiData.settings?.notifications?.inApp ?? true,
    },
    automation: {
      autoAssign: apiData.settings?.automation?.autoAssignTasks ?? false,
      dueDateReminders: apiData.settings?.automation?.dueDateReminders ?? true,
      escalation: apiData.settings?.automation?.escalateOverdueTasks ?? false,
    },
  };
}
