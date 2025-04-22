const webpush = require("web-push");
const Notification = require("../models/Notification");
const { getIO } = require("../socket");
const User = require("../models/User");
const { sendEmail } = require("../utils/emailSender");

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
      const io = getIO();
      io.to(userId).emit("notification", {
        ...newNotification.toObject(),
        createdAt: new Date(),
      });

      // Если есть push-подписка, отправляем push-уведомление
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

  async createNotification(userId, type, title, message, data = {}) {
    try {
      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        data,
        read: false,
        createdAt: new Date(),
      });

      await notification.save();

      // Отправляем уведомление через сокет, если пользователь онлайн
      const io = getIO();
      if (io) {
        io.to(userId).emit("notification", notification);
      }

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Создать уведомление о скором истечении срока промоакции
   * @param {string} userId - ID пользователя
   * @param {string} offerId - ID объявления
   * @param {string} offerTitle - Название объявления
   * @param {string} promotionType - Тип промоакции
   * @param {Date} endDate - Дата окончания промоакции
   * @returns {Promise<Object>} - Созданное уведомление
   */
  async createPromotionExpirationNotification(
    userId,
    offerId,
    offerTitle,
    promotionType,
    endDate
  ) {
    const promotionTypes = {
      TOP: "поднятие в топ",
      HIGHLIGHT: "выделение",
      URGENT: "срочная продажа",
    };

    const promotionName = promotionTypes[promotionType] || promotionType;
    const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

    let message;
    if (daysLeft <= 0) {
      message = `Промоакция "${promotionName}" для объявления "${offerTitle}" закончилась.`;
    } else if (daysLeft === 1) {
      message = `Промоакция "${promotionName}" для объявления "${offerTitle}" закончится завтра.`;
    } else {
      message = `Промоакция "${promotionName}" для объявления "${offerTitle}" закончится через ${daysLeft} дней.`;
    }

    return this.createNotification(
      userId,
      "PROMOTION_EXPIRY",
      "Окончание срока промоакции",
      message,
      {
        offerId,
        promotionType,
        endDate,
        daysLeft,
      }
    );
  }

  /**
   * Создать уведомление об истекшей промоакции
   * @param {string} userId - ID пользователя
   * @param {string} offerId - ID объявления
   * @param {string} offerTitle - Название объявления
   * @param {string} promotionType - Тип промоакции
   * @returns {Promise<Object>} - Созданное уведомление
   */
  async createPromotionExpiredNotification(
    userId,
    offerId,
    offerTitle,
    promotionType
  ) {
    const promotionTypes = {
      TOP: "поднятие в топ",
      HIGHLIGHT: "выделение",
      URGENT: "срочная продажа",
    };

    const promotionName = promotionTypes[promotionType] || promotionType;

    const message = `Промоакция "${promotionName}" для объявления "${offerTitle}" завершена. Продлите ее, чтобы получить больше просмотров.`;

    return this.createNotification(
      userId,
      "PROMOTION_EXPIRED",
      "Промоакция завершена",
      message,
      {
        offerId,
        promotionType,
        actionType: "renew",
      }
    );
  }

  async getUserNotifications(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments({ user: userId });

      return {
        notifications,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        user: userId,
        read: false,
      });
      return count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { user: userId, read: false },
        { read: true }
      );
      return { success: true };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }
}

/**
 * Создать новое уведомление для пользователя
 * @param {string} userId - ID пользователя
 * @param {string} type - Тип уведомления
 * @param {string} title - Заголовок уведомления
 * @param {string} message - Текст уведомления
 * @param {Object} data - Дополнительные данные
 * @param {boolean} sendEmail - Отправлять ли email
 * @returns {Promise<Object>} - Созданное уведомление
 */
const createNotification = async (
  userId,
  type,
  title,
  message,
  data = {},
  sendEmailNotif = false
) => {
  try {
    const newNotification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
    });

    if (sendEmailNotif) {
      const user = await User.findById(userId);
      if (user && user.email) {
        await sendEmail(user.email, title, message);
      }
    }

    return newNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Создать уведомление о скором истечении срока промоакции
 * @param {string} userId - ID пользователя
 * @param {string} offerId - ID объявления
 * @param {string} offerTitle - Название объявления
 * @param {string} promotionType - Тип промоакции
 * @param {Date} endDate - Дата окончания промоакции
 * @param {boolean} sendEmail - Отправлять ли email
 * @returns {Promise<Object>} - Созданное уведомление
 */
const createPromotionExpiryNotification = async (
  userId,
  offerId,
  offerTitle,
  promotionType,
  endDate,
  sendEmailNotif = true
) => {
  const promotionTypes = {
    TOP: "поднятие в топ",
    HIGHLIGHT: "выделение",
    URGENT: "срочная продажа",
  };

  const promotionName = promotionTypes[promotionType] || promotionType;
  const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

  let message;
  if (daysLeft <= 0) {
    message = `Промоакция "${promotionName}" для объявления "${offerTitle}" закончилась.`;
  } else if (daysLeft === 1) {
    message = `Промоакция "${promotionName}" для объявления "${offerTitle}" закончится завтра.`;
  } else {
    message = `Промоакция "${promotionName}" для объявления "${offerTitle}" закончится через ${daysLeft} дней.`;
  }

  return createNotification(
    userId,
    "PROMOTION_EXPIRY",
    "Окончание срока промоакции",
    message,
    {
      offerId,
      promotionType,
      endDate,
      daysLeft,
    },
    sendEmailNotif
  );
};

/**
 * Получить все непрочитанные уведомления пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} - Массив уведомлений
 */
const getUserUnreadNotifications = async (userId) => {
  return Notification.find({ user: userId, read: false })
    .sort({ createdAt: -1 })
    .limit(100);
};

/**
 * Получить все уведомления пользователя
 * @param {string} userId - ID пользователя
 * @param {number} page - Номер страницы
 * @param {number} limit - Кол-во элементов на странице
 * @returns {Promise<Object>} - Объект с уведомлениями и метаданными
 */
const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ user: userId }),
  ]);

  return {
    notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Отметить уведомление как прочитанное
 * @param {string} notificationId - ID уведомления
 * @param {string} userId - ID пользователя
 * @returns {Promise<Object>} - Обновленное уведомление
 */
const markNotificationAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  );
};

/**
 * Отметить все уведомления пользователя как прочитанные
 * @param {string} userId - ID пользователя
 * @returns {Promise<Object>} - Результат операции
 */
const markAllNotificationsAsRead = async (userId) => {
  return Notification.updateMany({ user: userId, read: false }, { read: true });
};

module.exports = {
  createNotification,
  createPromotionExpiryNotification,
  getUserUnreadNotifications,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
