const Offer = require("../models/Offer");
const Promotion = require("../models/Promotion");
const OfferView = require("../models/OfferView");
const OfferContact = require("../models/OfferContact");
const mongoose = require("mongoose");

/**
 * Сервис для аналитики эффективности промоакций
 */
class AnalyticsService {
  /**
   * Записать просмотр объявления
   * @param {string} offerId - ID объявления
   * @param {string} userId - ID пользователя (необязательно)
   * @param {Object} metadata - Дополнительные данные о просмотре
   * @returns {Promise<Object>} - Записанный просмотр
   */
  async recordView(offerId, userId = null, metadata = {}) {
    try {
      const view = new OfferView({
        offerId,
        userId,
        metadata,
        timestamp: new Date(),
      });

      await view.save();
      return view;
    } catch (error) {
      console.error("Error recording view:", error);
      throw error;
    }
  }

  /**
   * Записать контакт с объявлением (клик по телефону, сообщение и т.д.)
   * @param {string} offerId - ID объявления
   * @param {string} userId - ID пользователя (необязательно)
   * @param {string} type - Тип контакта (phone, message, etc.)
   * @param {Object} metadata - Дополнительные данные о контакте
   * @returns {Promise<Object>} - Записанный контакт
   */
  async recordContact(offerId, userId = null, type, metadata = {}) {
    try {
      const contact = new OfferContact({
        offerId,
        userId,
        type,
        metadata,
        timestamp: new Date(),
      });

      await contact.save();
      return contact;
    } catch (error) {
      console.error("Error recording contact:", error);
      throw error;
    }
  }

  /**
   * Получить статистику эффективности промоакции
   * @param {string} promotionId - ID промоакции
   * @returns {Promise<Object>} - Статистика промоакции
   */
  async getPromotionStats(promotionId) {
    try {
      const promotion = await Promotion.findById(promotionId);

      if (!promotion) {
        throw new Error("Promotion not found");
      }

      const offerId = promotion.offerId;
      const startDate = promotion.startDate;
      const endDate = promotion.endDate || new Date();

      // Количество просмотров до промоакции (за аналогичный период)
      const durationMs = endDate - startDate;
      const periodBeforeStart = new Date(startDate.getTime() - durationMs);

      const viewsBeforePromotion = await OfferView.countDocuments({
        offerId,
        timestamp: { $gte: periodBeforeStart, $lt: startDate },
      });

      // Количество просмотров во время промоакции
      const viewsDuringPromotion = await OfferView.countDocuments({
        offerId,
        timestamp: { $gte: startDate, $lte: endDate },
      });

      // Количество контактов до промоакции
      const contactsBeforePromotion = await OfferContact.countDocuments({
        offerId,
        timestamp: { $gte: periodBeforeStart, $lt: startDate },
      });

      // Количество контактов во время промоакции
      const contactsDuringPromotion = await OfferContact.countDocuments({
        offerId,
        timestamp: { $gte: startDate, $lte: endDate },
      });

      // Рассчитываем процентное изменение
      const viewsIncrease =
        viewsBeforePromotion > 0
          ? ((viewsDuringPromotion - viewsBeforePromotion) /
              viewsBeforePromotion) *
            100
          : viewsDuringPromotion > 0
          ? 100
          : 0;

      const contactsIncrease =
        contactsBeforePromotion > 0
          ? ((contactsDuringPromotion - contactsBeforePromotion) /
              contactsBeforePromotion) *
            100
          : contactsDuringPromotion > 0
          ? 100
          : 0;

      // Рассчитываем конверсию контактов
      const conversionBefore =
        viewsBeforePromotion > 0
          ? (contactsBeforePromotion / viewsBeforePromotion) * 100
          : 0;

      const conversionDuring =
        viewsDuringPromotion > 0
          ? (contactsDuringPromotion / viewsDuringPromotion) * 100
          : 0;

      const conversionIncrease =
        conversionBefore > 0
          ? ((conversionDuring - conversionBefore) / conversionBefore) * 100
          : conversionDuring > 0
          ? 100
          : 0;

      return {
        promotionId,
        offerId,
        startDate,
        endDate,
        type: promotion.type,
        price: promotion.price,
        stats: {
          viewsBeforePromotion,
          viewsDuringPromotion,
          viewsIncrease: parseFloat(viewsIncrease.toFixed(2)),
          contactsBeforePromotion,
          contactsDuringPromotion,
          contactsIncrease: parseFloat(contactsIncrease.toFixed(2)),
          conversionBefore: parseFloat(conversionBefore.toFixed(2)),
          conversionDuring: parseFloat(conversionDuring.toFixed(2)),
          conversionIncrease: parseFloat(conversionIncrease.toFixed(2)),
        },
        roi:
          contactsDuringPromotion > 0
            ? parseFloat(
                ((contactsDuringPromotion * 100) / promotion.price).toFixed(2)
              )
            : 0,
      };
    } catch (error) {
      console.error("Error getting promotion stats:", error);
      throw error;
    }
  }

  /**
   * Получить сводную статистику всех промоакций пользователя
   * @param {string} userId - ID пользователя
   * @returns {Promise<Object>} - Статистика промоакций
   */
  async getUserPromotionsStats(userId) {
    try {
      // Получаем все промоакции пользователя
      const promotions = await Promotion.find({ userId });

      if (promotions.length === 0) {
        return {
          userId,
          totalPromotions: 0,
          totalSpent: 0,
          stats: [],
        };
      }

      // Получаем статистику по каждой промоакции
      const promotionStats = await Promise.all(
        promotions.map((promotion) => this.getPromotionStats(promotion._id))
      );

      // Рассчитываем общую эффективность
      const totalSpent = promotionStats.reduce(
        (sum, stat) => sum + stat.price,
        0
      );
      const totalViewsIncrease = promotionStats.reduce((sum, stat) => {
        const increase =
          stat.stats.viewsDuringPromotion - stat.stats.viewsBeforePromotion;
        return sum + (increase > 0 ? increase : 0);
      }, 0);

      const totalContactsIncrease = promotionStats.reduce((sum, stat) => {
        const increase =
          stat.stats.contactsDuringPromotion -
          stat.stats.contactsBeforePromotion;
        return sum + (increase > 0 ? increase : 0);
      }, 0);

      // Сортируем по эффективности (ROI)
      promotionStats.sort((a, b) => b.roi - a.roi);

      return {
        userId,
        totalPromotions: promotions.length,
        totalSpent,
        totalViewsIncrease,
        totalContactsIncrease,
        averageRoi:
          promotionStats.reduce((sum, stat) => sum + stat.roi, 0) /
          promotions.length,
        stats: promotionStats,
      };
    } catch (error) {
      console.error("Error getting user promotions stats:", error);
      throw error;
    }
  }

  /**
   * Получить статистику по типам промоакций
   * @returns {Promise<Object>} - Статистика по типам промоакций
   */
  async getPromotionTypeStats() {
    try {
      const stats = await Promotion.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            totalSpent: { $sum: "$price" },
            avgPrice: { $avg: "$price" },
          },
        },
        {
          $project: {
            type: "$_id",
            count: 1,
            totalSpent: 1,
            avgPrice: { $round: ["$avgPrice", 2] },
            _id: 0,
          },
        },
      ]);

      return stats;
    } catch (error) {
      console.error("Error getting promotion type stats:", error);
      throw error;
    }
  }
}

module.exports = AnalyticsService;
