const User = require("../models/User");
const Offer = require("../models/Offer");
const OfferPromotion = require("../models/OfferPromotion");
const { ApiError } = require("../utils/errors");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const NotificationService = require("./NotificationService");
const Review = require("../models/Review");

class PromotionService {
  // Длительность поднятия в днях
  static PROMOTION_DURATIONS = {
    DAY: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    WEEK: 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
    MONTH: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  };

  static PROMOTION_PRICES = {
    DAY: 100,
    WEEK: 500,
    MONTH: 1500,
  };

  async promoteOffer(offerId, promotionType, userId) {
    const offer = await Offer.findById(offerId);

    if (!offer) {
      throw new ApiError(404, "Offer not found");
    }

    if (offer.providerId.toString() !== userId) {
      throw new ApiError(403, "You can only promote your own offers");
    }

    if (!PromotionService.PROMOTION_DURATIONS[promotionType]) {
      throw new ApiError(400, "Invalid promotion type");
    }

    const now = new Date();

    // If offer is already promoted, extend from current end date
    const startDate =
      offer.promoted?.promotedUntil && offer.promoted.promotedUntil > now
        ? offer.promoted.promotedUntil
        : now;

    const promotedUntil = new Date(
      startDate.getTime() + PromotionService.PROMOTION_DURATIONS[promotionType]
    );

    offer.promoted = {
      isPromoted: true,
      promotedUntil: promotedUntil,
      lastPromotedAt: now,
      promotionType: promotionType.toLowerCase(),
    };

    await offer.save();

    // Send notification to user
    try {
      await NotificationService.sendNotification(offer.providerId, {
        type: "OFFER_PROMOTED",
        message: `Your offer "${
          offer.title
        }" has been promoted until ${promotedUntil.toLocaleDateString()}`,
        relatedId: offer._id,
      });
      console.log("[PromotionService] Notification sent successfully");
    } catch (notificationError) {
      console.error("[PromotionService] Error sending notification:", {
        error: notificationError.message,
      });
      // Не прерываем обработку если не удалось отправить уведомление
    }

    return {
      success: true,
      promotedUntil,
      price: PromotionService.PROMOTION_PRICES[promotionType],
    };
  }

  async checkPromotionStatus(offerId) {
    console.log(
      `[PromotionService] Checking promotion status for offer: ${offerId}`
    );

    try {
      const offer = await Offer.findById(offerId);

      if (!offer) {
        console.warn(`[PromotionService] Offer not found with ID: ${offerId}`);
        throw new ApiError(404, "Offer not found");
      }

      // Проверяем, есть ли свойство promoted у офера
      if (!offer.promoted) {
        console.log(
          `[PromotionService] Offer ${offerId} has no promotion data`
        );
        return {
          isPromoted: false,
          promotedUntil: null,
          remainingTimeMs: 0,
          remainingDays: 0,
          promotionType: null,
          lastPromotedAt: null,
        };
      }

      const now = new Date();
      const isPromoted =
        offer.promoted.promotedUntil && offer.promoted.promotedUntil > now;
      const remainingTime = isPromoted
        ? offer.promoted.promotedUntil.getTime() - now.getTime()
        : 0;

      const status = {
        isPromoted,
        promotedUntil: offer.promoted.promotedUntil || null,
        remainingTimeMs: remainingTime,
        remainingDays: Math.ceil(remainingTime / (24 * 60 * 60 * 1000)),
        promotionType: offer.promoted.promotionType || null,
        lastPromotedAt: offer.promoted.lastPromotedAt || null,
      };

      console.log(`[PromotionService] Status for offer ${offerId}:`, status);
      return status;
    } catch (error) {
      console.error(`[PromotionService] Error checking promotion status:`, {
        offerId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async getPromotedOffers(limit = 10, skip = 0) {
    console.log("[PromotionService] Getting promoted offers:", { limit, skip });

    try {
      // Преобразуем параметры в числа на случай, если они переданы как строки
      limit = parseInt(limit) || 10;
      skip = parseInt(skip) || 0;

      // Ограничиваем значения в разумных пределах
      limit = Math.min(Math.max(1, limit), 50); // от 1 до 50
      skip = Math.max(0, skip); // не меньше 0

      const now = new Date();
      const query = {
        "promoted.promotedUntil": { $gt: now },
        "promoted.isPromoted": true,
        status: "active", // Only show active offers
      };

      console.log("[PromotionService] Executing query with params:", {
        query,
        limit,
        skip,
        timestamp: now,
      });

      const [offers, total] = await Promise.all([
        Offer.find(query)
          .sort({ "promoted.promotedUntil": -1 })
          .skip(skip)
          .limit(limit)
          .populate("providerId", "name avatar"),
        Offer.countDocuments(query),
      ]);

      // Для каждого оффера получаем рейтинг и количество отзывов
      const offersWithRating = await Promise.all(
        offers.map(async (offer) => {
          const ratingInfo = await Review.getAverageRatingByOffer(offer._id);
          let provider = null;
          if (offer.providerId && typeof offer.providerId === "object") {
            provider = {
              _id: offer.providerId._id,
              name: offer.providerId.name,
              email: offer.providerId.email,
              avatar: offer.providerId.avatar,
              status: offer.providerId.status,
              providerInfo: offer.providerId.providerInfo,
              createdAt: offer.providerId.createdAt,
            };
          }
          return {
            ...offer._doc,
            rating: ratingInfo.rating,
            reviewCount: ratingInfo.count,
            provider,
          };
        })
      );

      console.log("[PromotionService] Query completed successfully:", {
        offersFound: offersWithRating.length,
        totalPromoted: total,
        hasMore: total > skip + limit,
      });

      return {
        offers: offersWithRating,
        total,
        hasMore: total > skip + limit,
      };
    } catch (error) {
      console.error("[PromotionService] Error getting promoted offers:", {
        error: error.message,
        stack: error.stack,
        params: { limit, skip },
      });
      // Пробрасываем ошибку для обработки в маршруте
      throw error;
    }
  }

  async getPromotionPrices() {
    return PromotionService.PROMOTION_PRICES;
  }

  async promoteOfferWithTariff(offerId, tariff, userId) {
    const offer = await Offer.findById(offerId);

    if (!offer) {
      throw new ApiError(404, "Offer not found");
    }

    if (offer.providerId.toString() !== userId) {
      throw new ApiError(403, "You can only promote your own offers");
    }

    const now = new Date();
    const startDate =
      offer.promoted?.promotedUntil && offer.promoted.promotedUntil > now
        ? offer.promoted.promotedUntil
        : now;

    // Продолжительность в днях из тарифа
    const durationMs = (tariff.period || 1) * 24 * 60 * 60 * 1000;
    const promotedUntil = new Date(startDate.getTime() + durationMs);

    offer.promoted = {
      isPromoted: true,
      promotedUntil: promotedUntil,
      lastPromotedAt: now,
      promotionType: tariff.name, // или tariff._id, если нужно
    };

    await offer.save();

    // (уведомления и прочее — по желанию)
    try {
      await NotificationService.sendNotification(offer.providerId, {
        type: "OFFER_PROMOTED",
        message: `Your offer "${
          offer.title
        }" has been promoted until ${promotedUntil.toLocaleDateString()}`,
        relatedId: offer._id,
      });
      console.log("[PromotionService] Notification sent successfully");
    } catch (notificationError) {
      console.error("[PromotionService] Error sending notification:", {
        error: notificationError.message,
      });
    }

    return {
      success: true,
      promotedUntil,
      price: tariff.price,
      tariffId: tariff._id,
    };
  }
}

module.exports = new PromotionService();
