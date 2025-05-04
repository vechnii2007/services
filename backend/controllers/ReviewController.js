const Review = require("../models/Review");
const User = require("../models/User");
const Offer = require("../models/Offer");
const ServiceOffer = require("../models/ServiceOffer");
const mongoose = require("mongoose");

/**
 * Создание нового отзыва
 */
exports.createReview = async (req, res) => {
  try {
    const { offerId, offerType, rating, comment } = req.body;
    const userId = req.user._id;

    // Проверяем существование предложения
    let offer;
    let Model = offerType === "Offer" ? Offer : ServiceOffer;

    try {
      offer = await Model.findById(offerId);
      if (!offer) {
        return res.status(404).json({ error: "Предложение не найдено" });
      }
    } catch (err) {
      return res.status(404).json({ error: "Предложение не найдено" });
    }

    // Проверяем, что пользователь не оценивает свое собственное предложение
    if (offer.providerId.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ error: "Вы не можете оценить свое собственное предложение" });
    }

    // Проверяем, оставлял ли пользователь уже отзыв
    const existingReview = await Review.findOne({ userId, offerId });
    if (existingReview) {
      return res
        .status(400)
        .json({ error: "Вы уже оставили отзыв к этому предложению" });
    }

    // Создаем новый отзыв
    const review = new Review({
      userId,
      offerId,
      offerType,
      rating,
      comment,
      providerId: offer.providerId,
    });

    await review.save();

    // Обновляем средний рейтинг поставщика
    const providerStats = await Review.getAverageRatingByProvider(
      offer.providerId
    );
    await User.findByIdAndUpdate(offer.providerId, {
      "providerInfo.rating": providerStats.rating,
      "providerInfo.reviewCount": providerStats.count,
    });

    return res.status(201).json({
      message: "Отзыв успешно добавлен",
      review,
    });
  } catch (error) {
    console.error("Error in createReview:", error);
    return res.status(500).json({
      error: "Ошибка сервера при создании отзыва",
      details: error.message,
    });
  }
};

/**
 * Получение всех отзывов по ID предложения
 */
exports.getReviewsByOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const reviews = await Review.find({ offerId, status: "approved" })
      .populate("userId", "name avatar")
      .sort({ createdAt: -1 });

    const stats = await Review.getAverageRatingByOffer(offerId);

    return res.status(200).json({
      reviews,
      stats,
    });
  } catch (error) {
    console.error("Error in getReviewsByOffer:", error);
    return res.status(500).json({
      error: "Ошибка сервера при получении отзывов",
      details: error.message,
    });
  }
};

/**
 * Получение всех отзывов по ID поставщика
 */
exports.getReviewsByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    const reviews = await Review.find({ providerId, status: "approved" })
      .populate("userId", "name avatar")
      .populate("offerId", "title")
      .sort({ createdAt: -1 });

    const stats = await Review.getAverageRatingByProvider(providerId);

    return res.status(200).json({
      reviews,
      stats,
    });
  } catch (error) {
    console.error("Error in getReviewsByProvider:", error);
    return res.status(500).json({
      error: "Ошибка сервера при получении отзывов",
      details: error.message,
    });
  }
};

/**
 * Получение отзыва по ID
 */
exports.getReviewById = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate("userId", "name avatar")
      .populate("offerId", "title");

    if (!review) {
      return res.status(404).json({ error: "Отзыв не найден" });
    }

    return res.status(200).json(review);
  } catch (error) {
    console.error("Error in getReviewById:", error);
    return res.status(500).json({
      error: "Ошибка сервера при получении отзыва",
      details: error.message,
    });
  }
};

/**
 * Обновление отзыва
 */
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // Проверяем существование отзыва
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Отзыв не найден" });
    }

    // Проверяем, что отзыв принадлежит текущему пользователю
    if (review.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "У вас нет прав для редактирования этого отзыва" });
    }

    // Обновляем отзыв
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    await review.save();

    // Обновляем средний рейтинг поставщика
    const providerStats = await Review.getAverageRatingByProvider(
      review.providerId
    );
    await User.findByIdAndUpdate(review.providerId, {
      "providerInfo.rating": providerStats.rating,
      "providerInfo.reviewCount": providerStats.count,
    });

    return res.status(200).json({
      message: "Отзыв успешно обновлен",
      review,
    });
  } catch (error) {
    console.error("Error in updateReview:", error);
    return res.status(500).json({
      error: "Ошибка сервера при обновлении отзыва",
      details: error.message,
    });
  }
};

/**
 * Удаление отзыва
 */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    // Проверяем существование отзыва
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Отзыв не найден" });
    }

    // Проверяем, что отзыв принадлежит текущему пользователю или пользователь является администратором
    if (
      review.userId.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "У вас нет прав для удаления этого отзыва" });
    }

    // Сохраняем providerId перед удалением
    const providerId = review.providerId;

    // Удаляем отзыв
    await Review.findByIdAndDelete(reviewId);

    // Обновляем средний рейтинг поставщика
    const providerStats = await Review.getAverageRatingByProvider(providerId);
    await User.findByIdAndUpdate(providerId, {
      "providerInfo.rating": providerStats.rating,
      "providerInfo.reviewCount": providerStats.count,
    });

    return res.status(200).json({
      message: "Отзыв успешно удален",
    });
  } catch (error) {
    console.error("Error in deleteReview:", error);
    return res.status(500).json({
      error: "Ошибка сервера при удалении отзыва",
      details: error.message,
    });
  }
};

/**
 * Получение всех отзывов, оставленных пользователем (userId)
 */
exports.getReviewsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ userId, status: "approved" })
      .populate("offerId", "title")
      .sort({ createdAt: -1 });
    // Можно добавить stats, если потребуется
    return res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error in getReviewsByUser:", error);
    return res.status(500).json({
      error: "Ошибка сервера при получении отзывов пользователя",
      details: error.message,
    });
  }
};
