import api from "./axios";

export const irisReportingAPI = {
  getOverview: async () => {
    try {
      const response = await api.get("/iris-reporting/overview");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load IRIS overview",
      };
    }
  },

  getReportPack: async () => {
    try {
      const response = await api.get("/iris-reporting/report-pack");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load report pack",
      };
    }
  },

  createRequirement: async (payload) => {
    try {
      const response = await api.post("/iris-reporting/requirements", payload);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create requirement",
      };
    }
  },

  updateRequirement: async (requirementId, payload) => {
    try {
      const response = await api.patch(
        `/iris-reporting/requirements/${requirementId}`,
        payload,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update requirement",
      };
    }
  },

  deleteRequirement: async (requirementId) => {
    try {
      const response = await api.delete(
        `/iris-reporting/requirements/${requirementId}`,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete requirement",
      };
    }
  },

  uploadEvidenceFile: async (requirementId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post(
        `/iris-reporting/requirements/${requirementId}/files`,
        formData,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to upload evidence file",
      };
    }
  },

  downloadEvidenceFile: async (requirementId, fileId, fileName) => {
    try {
      const response = await api.get(
        `/iris-reporting/requirements/${requirementId}/files/${fileId}`,
      );
      if (!response.data || !response.data.file || !response.data.file.url) {
        return { success: false, error: "Missing file URL" };
      }
      const url = response.data.file.url;
      // Open Cloudinary URL in a new tab (user can download/view)
      window.open(url, "_blank");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to download evidence file",
      };
    }
  },

  deleteEvidenceFile: async (requirementId, fileId) => {
    try {
      const response = await api.delete(
        `/iris-reporting/requirements/${requirementId}/files/${fileId}`,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete evidence file",
      };
    }
  },
};
