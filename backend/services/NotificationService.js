const webpush = require("web-push");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { getIO } = require("../socket");

class NotificationService {
  static async setup() {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      const vapidKeys = webpush.generateVAPIDKeys();
      // console.log("Generated VAPID keys:", {
      //   publicKey: vapidKeys.publicKey,
      //   privateKey: vapidKeys.privateKey,
      // });
      process.env.VAPID_PUBLIC_KEY = vapidKeys.publicKey;
      process.env.VAPID_PRIVATE_KEY = vapidKeys.privateKey;
    }

    webpush.setVapidDetails(
      process.env.WEB_PUSH_CONTACT || "mailto:your-email@example.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    return process.env.VAPID_PUBLIC_KEY;
  }

  static async sendNotification(userId, notification) {
    try {
      const newNotification = await Notification.create({
        userId,
        message: notification.message,
        type: notification.type,
        relatedId: notification.relatedId,
        requestId: notification.requestId || null,
        refModel: this._getRefModel(notification.type, notification.relatedId),
      });

      // Отправляем через WebSocket
      try {
        const io = getIO();
        if (io) {
          io.to(userId).emit("notification", newNotification.toObject());
        }
      } catch (socketError) {}

      // Если есть push-подписка, отправляем push-уведомление
      try {
        const user = await User.findById(userId).select("pushSubscription");
        if (user?.pushSubscription) {
          await webpush.sendNotification(
            user.pushSubscription,
            JSON.stringify({
              title: this._getNotificationTitle(notification.type),
              body: notification.message,
              icon: "/path/to/icon.png", // TODO: Добавить иконку
              data: {
                url: this._getNotificationUrl(notification),
              },
            })
          );
        }
      } catch (pushError) {}

      return newNotification;
    } catch (error) {
      throw error;
    }
  }

  static _getRefModel(type, relatedId) {
    if (!relatedId) return null;

    switch (type) {
      case "message":
        return "Message";
      case "request":
        return "ServiceRequest";
      case "offer":
      case "OFFER_PROMOTED":
        return "Offer";
      default:
        return null;
    }
  }

  static _getNotificationTitle(type) {
    switch (type) {
      case "message":
        return "Новое сообщение";
      case "request":
        return "Новый запрос";
      case "offer":
        return "Новое предложение";
      case "OFFER_PROMOTED":
        return "Оффер продвинут";
      case "system":
        return "Системное уведомление";
      default:
        return "Уведомление";
    }
  }

  static _getNotificationUrl(notification) {
    switch (notification.type) {
      case "message":
        return `/chat/${notification.relatedId}`;
      case "request":
        return `/requests/${notification.relatedId}`;
      case "offer":
      case "OFFER_PROMOTED":
        return `/offers/${notification.relatedId}`;
      default:
        return "/notifications";
    }
  }

  static async markAsRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  }

  static async getUserNotifications(userId, options = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = options;

    const query = { userId };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  static async savePushSubscription(userId, subscription) {
    await User.findByIdAndUpdate(userId, {
      pushSubscription: subscription,
    });
  }
}

module.exports = NotificationService;
