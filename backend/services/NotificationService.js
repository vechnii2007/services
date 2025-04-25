const webpush = require("web-push");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { getIO } = require("../socket");

class NotificationService {
  static async setup() {
    const vapidKeys = webpush.generateVAPIDKeys();

    webpush.setVapidDetails(
      process.env.WEB_PUSH_CONTACT || "mailto:your-email@example.com",
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    return vapidKeys.publicKey;
  }

  static async sendNotification(userId, notification) {
    try {
      // Создаем уведомление в БД
      const newNotification = await Notification.create({
        userId,
        message: notification.message,
        type: notification.type,
        relatedId: notification.relatedId,
      });

      // Отправляем через WebSocket
      try {
        const io = getIO();
        if (io) {
          io.to(userId).emit("notification", {
            ...newNotification.toObject(),
            createdAt: new Date(),
          });
        }
      } catch (socketError) {
        console.error("Error sending socket notification:", socketError);
        // Продолжаем выполнение, не прерывая процесс
      }

      // Если есть push-подписка, отправляем push-уведомление
      try {
        const user = await User.findById(userId).select("pushSubscription");
        if (user && user.pushSubscription) {
          await webpush.sendNotification(
            user.pushSubscription,
            JSON.stringify({
              title: "New Notification",
              body: notification.message,
              icon: "/path/to/icon.png",
              data: {
                url: `/notifications/${newNotification._id}`,
              },
            })
          );
        }
      } catch (pushError) {
        console.error("Error sending push notification:", pushError);
        // Продолжаем выполнение, не прерывая процесс
      }

      return newNotification;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
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
