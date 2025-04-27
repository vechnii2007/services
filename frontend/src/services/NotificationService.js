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

  // Регистрация сервис-воркера для push-уведомлений
  registerServiceWorker: async () => {
    if (!("serviceWorker" in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js"
      );
      return registration;
    } catch (error) {
      console.error(
        "[NotificationService] Service worker registration failed:",
        error
      );
      return null;
    }
  },

  // Настройка push-уведомлений
  setupPushNotifications: async () => {
    try {
      // Проверяем поддержку уведомлений в браузере
      if (!("Notification" in window)) {
        return false;
      }

      // Запрашиваем разрешение на уведомления
      const permission =
        await NotificationService.requestNotificationPermission();
      if (!permission) {
        return false;
      }

      // Регистрируем сервис-воркер
      const registration = await NotificationService.registerServiceWorker();
      if (!registration) {
        return false;
      }

      // Создаем подписку на push-уведомления
      return await NotificationService.createPushSubscription(registration);
    } catch (error) {
      console.error(
        "[NotificationService] Error setting up push notifications:",
        error
      );
      return false;
    }
  },
};

export default NotificationService;
