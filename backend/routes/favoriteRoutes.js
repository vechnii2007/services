const express = require("express");
const router = express.Router();
const Favorite = require("../models/Favorite");
const auth = require("../middleware/auth");

// Получить избранное текущего пользователя
router.get("/", auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id }).populate({
      path: "offerId",
      select: "title description price images location",
    });

    res.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Ошибка при получении избранного" });
  }
});

// Добавить объявление в избранное
router.post("/", auth, async (req, res) => {
  try {
    const { offerId, offerType } = req.body;

    // Проверяем, есть ли уже в избранном
    const existingFavorite = await Favorite.findOne({
      userId: req.user.id,
      offerId,
    });

    if (existingFavorite) {
      return res.status(400).json({ message: "Объявление уже в избранном" });
    }

    const newFavorite = new Favorite({
      userId: req.user.id,
      offerId,
      offerType,
    });

    const savedFavorite = await newFavorite.save();
    res.status(201).json(savedFavorite);
  } catch (error) {
    console.error("Error adding to favorites:", error);
    res.status(500).json({ message: "Ошибка при добавлении в избранное" });
  }
});

// Удалить объявление из избранного
router.delete("/:id", auth, async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!favorite) {
      return res.status(404).json({ message: "Запись не найдена в избранном" });
    }

    await favorite.remove();
    res.json({ message: "Удалено из избранного" });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({ message: "Ошибка при удалении из избранного" });
  }
});

// Проверить, находится ли объявление в избранном
router.get("/check/:offerId", auth, async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      userId: req.user.id,
      offerId: req.params.offerId,
    });

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({ message: "Ошибка при проверке статуса избранного" });
  }
});

module.exports = router;
