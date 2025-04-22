const Rating = require("../models/Rating");
const Offer = require("../models/Offer");
const mongoose = require("mongoose");

// Добавить или обновить рейтинг
exports.addRating = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // Проверяем существование оффера
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: "Предложение не найдено" });
    }

    // Создаем или обновляем рейтинг
    const ratingDoc = await Rating.findOneAndUpdate(
      { offerId, userId },
      { rating, comment },
      { upsert: true, new: true }
    );

    // Пересчитываем средний рейтинг
    const { averageRating, totalRatings } = await Rating.calculateAverageRating(
      offerId
    );

    // Обновляем оффер
    await Offer.findByIdAndUpdate(offerId, {
      rating: averageRating,
      ratingCount: totalRatings,
    });

    res.status(200).json(ratingDoc);
  } catch (error) {
    console.error("Error in addRating:", error);
    res.status(500).json({ message: "Ошибка при добавлении рейтинга" });
  }
};

// Получить рейтинги для предложения
exports.getRatings = async (req, res) => {
  try {
    const { offerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const ratings = await Rating.find({ offerId })
      .populate("userId", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Rating.countDocuments({ offerId });
    const { averageRating } = await Rating.calculateAverageRating(offerId);

    res.status(200).json({
      ratings,
      total,
      pages: Math.ceil(total / limit),
      averageRating,
    });
  } catch (error) {
    console.error("Error in getRatings:", error);
    res.status(500).json({ message: "Ошибка при получении рейтингов" });
  }
};

// Удалить рейтинг
exports.deleteRating = async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user._id;

    const rating = await Rating.findOneAndDelete({ offerId, userId });
    if (!rating) {
      return res.status(404).json({ message: "Рейтинг не найден" });
    }

    // Пересчитываем средний рейтинг
    const { averageRating, totalRatings } = await Rating.calculateAverageRating(
      offerId
    );

    // Обновляем оффер
    await Offer.findByIdAndUpdate(offerId, {
      rating: averageRating,
      ratingCount: totalRatings,
    });

    res.status(200).json({ message: "Рейтинг удален" });
  } catch (error) {
    console.error("Error in deleteRating:", error);
    res.status(500).json({ message: "Ошибка при удалении рейтинга" });
  }
};

// Получить рейтинг текущего пользователя для предложения
exports.getUserRating = async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user._id;

    const rating = await Rating.findOne({ offerId, userId });
    res.status(200).json(rating || null);
  } catch (error) {
    console.error("Error in getUserRating:", error);
    res
      .status(500)
      .json({ message: "Ошибка при получении рейтинга пользователя" });
  }
};
