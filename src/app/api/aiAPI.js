import api from "./axios";

export const aiAPI = {
  chat: async (contents) => {
    try {
      const response = await api.post("/ai/chat", { contents });
      return { success: true, text: response.data.text || "", functionCall: response.data.functionCall || null };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "AI request failed",
      };
    }
  },
};

export default aiAPI;
