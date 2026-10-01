import api from "./axios";

export const platformAPI = {
  // Every client company, newest first, each with the state of its administrator.
  listCompanies: async () => {
    const response = await api.get("/platform/companies");
    return response.data?.companies || [];
  },

  // Creates the company and emails its administrator an invitation. The account
  // is not usable until they follow that link and set their own password.
  // Succeeds even if the email could not be sent — check `invitationSent`.
  createCompany: async (payload) => {
    const response = await api.post("/platform/companies", payload);
    return response.data;
  },

  // Issues a fresh invitation. Covers both a send that failed and an
  // invitation that expired before it was used.
  resendInvitation: async (companyId) => {
    const response = await api.post(`/platform/companies/${companyId}/resend-invitation`);
    return response.data;
  },
};

export default platformAPI;
