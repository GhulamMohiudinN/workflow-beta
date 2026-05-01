import axios from "axios";

// Resolve backend URL from env variables
const backendBase =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5000";

// Create axios instance
const api = axios.create({
  baseURL: `${backendBase.replace(/\/api\/v1$/, "")}/api/v1`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach auth token + log every outgoing request
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach a timestamp so we can compute duration in the response interceptor
    config.metadata = { startTime: Date.now() };

    const method = (config.method || "GET").toUpperCase();
    const url = `${config.baseURL}${config.url}`;
    const payload = config.params || config.data || null;

    console.info("[API ▶] Request", { method, url, payload });
    return config;
  },
  (error) => {
    console.error("[API ▶ ERR] Request setup error:", error.message);
    return Promise.reject(error);
  },
);

// Response interceptor — log every response + handle token refresh on 401
api.interceptors.response.use(
  (response) => {
    const ms = Date.now() - (response.config.metadata?.startTime ?? Date.now());
    const method = (response.config.method || "GET").toUpperCase();
    const url = response.config.url;
    console.info("[API ✔] Response", {
      method,
      url,
      status: response.status,
      durationMs: ms,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};
    const ms =
      Date.now() - (originalRequest?.metadata?.startTime ?? Date.now());
    const method = (originalRequest.method || "GET").toUpperCase();
    const url = originalRequest.url || "unknown";
    const statusCode = error.response?.status ?? "ERR";
    const details = error.response?.data || error.message;

    console.error("[API ✖] Response error", {
      method,
      url,
      status: statusCode,
      durationMs: ms,
      details,
    });

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await api.post("/auth/refresh", { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("[API] Token refresh failed, redirecting to login");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
