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
    const response = await api.get("/services/notifications/vapid-public-key");
    return response.data;
  },

  subscribeToPushNotifications: async (subscription) => {
    const response = await api.post(
      "/services/notifications/subscribe",
      subscription
    );
    return response.data;
  },

  unsubscribeFromPushNotifications: async () => {
    const response = await api.post("/services/notifications/unsubscribe");
    return response.data;
  },

  updateNotificationPreferences: async (preferences) => {
    const response = await api.put(
      "/services/notifications/preferences",
      preferences
    );
    return response.data;
  },

  getNotificationPreferences: async () => {
    const response = await api.get("/services/notifications/preferences");
    return response.data;
  },

  getNotificationStatus: async () => {
    if (!("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  },

  requestNotificationPermission: async () => {
    if (!("Notification" in window)) {
      console.warn("Notifications are not supported in this browser");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  },

  createPushSubscription: async (registration) => {
    try {
      const response = await NotificationService.getVapidKey();
      const vapidPublicKey = response.vapidPublicKey;

      const key = NotificationService.urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });

      await NotificationService.subscribeToPushNotifications(
        subscription.toJSON()
      );

      return true;
    } catch (error) {
      console.error("Error creating push subscription:", error);
      return false;
    }
  },

  removePushSubscription: async (registration) => {
    try {
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return true;

      await NotificationService.unsubscribeFromPushNotifications();

      await subscription.unsubscribe();
      return true;
    } catch (error) {
      console.error("Error removing push subscription:", error);
      return false;
    }
  },

  urlBase64ToUint8Array: (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },
};

export default NotificationService;
