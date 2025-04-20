import api from "../middleware/api";

export const NotificationService = {
  getNotifications: async (params = {}) => {
    const response = await api.get("/services/notifications", { params });
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.put(
      `/services/notifications/${notificationId}/read`
    );
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(
      `/services/notifications/${notificationId}`
    );
    return response.data;
  },

  getVapidKey: async () => {
    const response = await api.get("/notifications/vapid-public-key");
    return response.data;
  },
};

export default NotificationService;
