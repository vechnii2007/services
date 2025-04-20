import axios from "../utils/axiosConfig";

const PushNotificationService = {
  async getNotificationStatus() {
    if (!("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  },

  async requestNotificationPermission() {
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

  async subscribeToPushNotifications(registration) {
    try {
      const response = await axios.get("/api/notifications/vapid-public-key");
      const vapidPublicKey = response.data.vapidPublicKey;

      const subscription = await this.createPushSubscription(
        registration,
        vapidPublicKey
      );
      if (!subscription) return false;

      // Отправляем подписку на сервер
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ subscription }),
      });

      return true;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return false;
    }
  },

  async unsubscribeFromPushNotifications(registration) {
    try {
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return true;

      // Отправляем запрос на отмену подписки
      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      await subscription.unsubscribe();
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    }
  },

  async createPushSubscription(registration, applicationServerKey) {
    try {
      // Преобразуем base64 строку в массив байтов
      const key = this.urlBase64ToUint8Array(applicationServerKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
      return subscription.toJSON();
    } catch (error) {
      console.error("Error creating push subscription:", error);
      return null;
    }
  },

  urlBase64ToUint8Array(base64String) {
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

export default PushNotificationService;
