import api from "./axios";

export const authAPI = {
  // Login user
  login: async (credentials) => {
    const response = await api.post("/users/signin", credentials);
    const data = response.data;
    console.log("Full response data:", data);
    // Store user data in localStorage
    // If not provided in response, set defaults for demo
    localStorage.setItem(
      "user",
      JSON.stringify(
        data.user || {
          _id: "user-id",
          name: "Demo User",
          email: credentials.email,
        },
      ),
    );
    // Ensure role comes from API workspace assignment (role) or fallback to global userType
    const userRole = data.user?.role || data.role || data.user?.userType || "admin";
    localStorage.setItem("role", userRole.toLowerCase());
    if (data.workspace) {
      localStorage.setItem("workspace", JSON.stringify(data.workspace));
    } else {
      localStorage.removeItem("workspace");
    }
    if (data.token) localStorage.setItem("token", data.token);
    if (data.refreshToken)
      localStorage.setItem("refreshToken", data.refreshToken);
    if (data.userId) localStorage.setItem("userId", data.userId);

    return data;
  },

  // Signup user
  signup: async (userData) => {
    const response = await api.post("/users/signup", userData);
    return response.data;
  },

  // Create workspace
  createWorkspace: async (workspaceData) => {
    const response = await api.post(
      "/workspace/createWorkspace",
      workspaceData,
    );
    const data = response.data;

    // Store workspace data in localStorage
    if (data.workspace) {
      localStorage.setItem("workspace", JSON.stringify(data.workspace));
    }

    // Keep user updated with workspaceId
    if (data.user) {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = {
        ...currentUser,
        ...data.user,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (data.user.workspaceId) {
        updatedUser.workspaceId = data.user.workspaceId;
      }
    }

    return data;
  },

  // Logout user
  logout: async () => {
    const response = await api.post("/users/logout");
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post("/users/refresh-token", { refreshToken });
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get("/users/profile");
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.put("/users/profile", userData);
    return response.data;
  },

  // Update workspace
  updateWorkspace: async (workspaceData) => {
    const response = await api.patch(
      "/workspace/updateWorkspace",
      workspaceData,
    );
    const data = response.data;

    if (data.workspace) {
      localStorage.setItem("workspace", JSON.stringify(data.workspace));
    }

    return data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.post(`/users/verify-email/${token}`);
    const data = response.data;

    if (data?.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", (data.user?.role || data.role || data.user.userType || "admin").toLowerCase());
      localStorage.setItem("userId", data.user.id);
    }

    if (data?.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("accessToken", data.token);
    }

    if (data?.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    if (data?.workspace) {
      localStorage.setItem("workspace", JSON.stringify(data.workspace));
    }

    return data;
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await api.post("/users/resend-verification", { email });
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    const response = await api.post("/users/forgot-password", { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, password, confirmPassword) => {
    const response = await api.post(`/users/reset-password/${token}`, {
      password,
      confirmPassword,
    });
    return response.data;
  },

  // Accept invitation
acceptInvitation: async (data) => {
  const response = await api.post("/users/accept-invitation", data);
  return response.data;
},

  // Change password for logged-in user
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post("/users/change-password", {
      oldPassword,
      newPassword,
      confirmPassword: newPassword,
    });
    return response.data;
  },
};




export default authAPI;
