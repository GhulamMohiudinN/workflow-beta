import api from "./axios";

const unwrap = async (promise) => {
  try {
    const response = await promise;
    return { success: true, ...response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Something went wrong",
      status: error.response?.status,
    };
  }
};

export const contractAPI = {
  create:      (payload) => unwrap(api.post("/contracts", payload)),
  list:        () => unwrap(api.get("/contracts")),
  get:         (id) => unwrap(api.get(`/contracts/${id}`)),
  remove:      (id) => unwrap(api.delete(`/contracts/${id}`)),

  // Public — no auth token needed, the link's token is the authorization
  getPublic:   (token) => unwrap(api.get(`/contracts/public/${token}`)),
  sign:        (token, payload) => unwrap(api.post(`/contracts/public/${token}/sign`, payload)),
};

export default contractAPI;
