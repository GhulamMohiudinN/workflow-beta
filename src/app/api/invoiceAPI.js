import api from "./axios";

export const invoiceAPI = {
  sendInvoice: async ({ to, invoice }) => {
    try {
      const response = await api.post("/invoices/send", { to, invoice });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to send invoice",
        status: error.response?.status,
      };
    }
  },
};

export default invoiceAPI;
