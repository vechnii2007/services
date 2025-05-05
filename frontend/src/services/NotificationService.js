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

  markAllAsRead: async () => {
    const response = await api.put(`/services/notifications/mark-all-read`);
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(
      `/services/notifications/${notificationId}`
    );
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

  // Обработка уведомлений через WebSocket
  setupWebSocketNotifications: (socket, onNotification) => {
    // Проверка входящих параметров
    if (!socket) {
      console.error("[NotificationService] Socket is not available");
      return () => {};
    }

    if (typeof onNotification !== "function") {
      console.error(
        "[NotificationService] onNotification callback is not a function"
      );
      return () => {};
    }

    // Обработчик для получения уведомлений через веб-сокет
    const handleNotification = (notification) => {
      // Если доступен браузерный API уведомлений и есть разрешение, показываем нативное уведомление
      if (
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.visibilityState !== "visible"
      ) {
        try {
          const title = notification.title || "Новое уведомление";
          const options = {
            body: notification.message,
            icon: "/logo192.png",
            data: {
              notificationId: notification._id,
              url: notification.url || "/notifications",
            },
          };

          const nativeNotification = new Notification(title, options);

          nativeNotification.onclick = () => {
            window.focus();
            if (notification.url) {
              window.location.href = notification.url;
            }
            // Автоматически помечаем уведомление как прочитанное при клике
            NotificationService.markAsRead(notification._id);
          };
        } catch (error) {
          console.error(
            "[NotificationService] Error showing native notification:",
            error
          );
        }
      }

      // Вызываем колбэк для обновления UI
      try {
        onNotification(notification);
      } catch (error) {
        console.error(
          "[NotificationService] Error in notification callback:",
          error
        );
      }
    };

    // Подписываемся на событие уведомления
    try {
      socket.on("notification", handleNotification);
    } catch (error) {
      console.error(
        "[NotificationService] Error subscribing to socket event:",
        error
      );
      return () => {};
    }

    // Возвращаем функцию для отписки от событий
    return () => {
      try {
        socket.off("notification", handleNotification);
      } catch (error) {
        console.error("[NotificationService] Error during cleanup:", error);
      }
    };
  },
};

export default NotificationService;
