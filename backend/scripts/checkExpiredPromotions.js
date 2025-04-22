const mongoose = require("mongoose");
const Promotion = require("../models/Promotion");
const Offer = require("../models/Offer");
const NotificationService = require("../services/NotificationService");
require("dotenv").config();

// Подключаемся к MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

/**
 * Проверяет промоакции и отправляет уведомления
 * @param {number} daysThreshold - за сколько дней до окончания отправлять уведомления
 */
const checkPromotionsAndNotify = async (daysThreshold = 1) => {
  try {
    console.log(`Checking promotions expiring in ${daysThreshold} days...`);

    // Рассчитываем дату для проверки
    const today = new Date();
    const thresholdDate = new Date(today);
    thresholdDate.setDate(today.getDate() + daysThreshold);

    const startOfDay = new Date(thresholdDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(thresholdDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Находим промоакции, которые истекают в ближайшие дни
    const expiringPromotions = await Promotion.find({
      endDate: { $gte: startOfDay, $lte: endOfDay },
    }).populate({
      path: "offerId",
      select: "title providerId",
    });

    console.log(`Found ${expiringPromotions.length} promotions expiring soon`);

    // Отправляем уведомления для каждой промоакции
    for (const promotion of expiringPromotions) {
      if (!promotion.offerId) {
        console.log(`Skipping promotion ${promotion._id} - offer not found`);
        continue;
      }

      // Отправляем уведомление о скором истечении срока промоакции
      const notificationService = new NotificationService();
      await notificationService.createPromotionExpirationNotification(
        promotion.userId,
        promotion.offerId._id,
        promotion.offerId.title,
        promotion.type,
        promotion.endDate
      );

      console.log(
        `Sent notification for offer "${promotion.offerId.title}" (${promotion.type})`
      );
    }

    console.log("Notification process completed");

    // Также находим и деактивируем промоакции, которые уже истекли
    const expiredPromotions = await Promotion.find({
      endDate: { $lt: today },
    });

    for (const promotion of expiredPromotions) {
      // Обновляем объявление, удаляя информацию о промоакции
      const offer = await Offer.findById(promotion.offerId);

      if (offer && offer.promotion && offer.promotion.type === promotion.type) {
        offer.promotion.active = false;
        await offer.save();
        console.log(`Deactivated promotion for offer ID: ${promotion.offerId}`);

        // Отправляем уведомление об истечении срока
        const notificationService = new NotificationService();
        await notificationService.createPromotionExpiredNotification(
          promotion.userId,
          promotion.offerId,
          offer.title,
          promotion.type
        );
      }
    }

    console.log("Deactivation process completed");
  } catch (error) {
    console.error("Error in checkPromotionsAndNotify:", error);
  }
};

// Выполняем скрипт
(async () => {
  await connectDB();

  // Проверяем промоакции, которые истекают завтра
  await checkPromotionsAndNotify(1);

  // Также можно проверить промоакции, которые истекают через 3 дня
  await checkPromotionsAndNotify(3);

  // Закрываем соединение с MongoDB
  await mongoose.connection.close();
  console.log("MongoDB connection closed");

  process.exit(0);
})();
