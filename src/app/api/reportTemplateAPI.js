import api from "./axios";

export const reportTemplateAPI = {
  listTemplates: async () => {
    try {
      const response = await api.get("/report-templates");
      return { success: true, templates: response.data.templates || [] };
    } catch (error) {
      return { success: false, templates: [], error: error.response?.data?.message || error.message };
    }
  },

  uploadTemplate: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await api.post("/report-templates", formData, {
        headers: { "Content-Type": undefined },
      });
      return { success: true, template: response.data.template };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  deleteTemplate: async (templateId) => {
    try {
      await api.delete(`/report-templates/${templateId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Returns preview data — an editable sheet (xlsx) or read-only HTML (docx) —
  // not a download. The user reviews/edits first, then downloads separately.
  generateFromTemplate: async (templateId, obligationIds) => {
    try {
      const response = await api.post(`/report-templates/${templateId}/generate`, { obligationIds });
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Rebuilds an .xlsx from edited sheet data and returns it as a Blob to download.
  finalizeXlsx: async (fileName, sheets) => {
    try {
      const response = await api.post(
        "/report-templates/finalize-xlsx",
        { fileName, sheets },
        { responseType: "blob" }
      );
      return { success: true, blob: response.data };
    } catch (error) {
      let message = error.message;
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          message = JSON.parse(text)?.message || message;
        } catch {
          // fall through to the generic message
        }
      }
      return { success: false, error: message };
    }
  },
};

export default reportTemplateAPI;
