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

export const notificationAPI = {
  list:        () => unwrap(api.get("/notifications")),
  unreadCount: () => unwrap(api.get("/notifications/unread-count")),
  markRead:    (id) => unwrap(api.patch(`/notifications/${id}/read`)),
  markAllRead: () => unwrap(api.patch("/notifications/read-all")),
};

export default notificationAPI;
