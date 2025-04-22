const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const auth = require("../middleware/auth");

// Получить все категории
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Ошибка при получении категорий" });
  }
});

// Получить категорию по ID
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ message: "Ошибка при получении категории" });
  }
});

// Создать новую категорию (только для админов)
router.post("/", auth, async (req, res) => {
  try {
    // Проверка роли пользователя
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Нет прав доступа" });
    }

    const { name, label, image } = req.body;

    const newCategory = new Category({
      name,
      label,
      image,
    });

    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Ошибка при создании категории" });
  }
});

// Обновить категорию (только для админов)
router.put("/:id", auth, async (req, res) => {
  try {
    // Проверка роли пользователя
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Нет прав доступа" });
    }

    const { name, label, image } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, label, image },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    res.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Ошибка при обновлении категории" });
  }
});

// Удалить категорию (только для админов)
router.delete("/:id", auth, async (req, res) => {
  try {
    // Проверка роли пользователя
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Нет прав доступа" });
    }

    const deletedCategory = await Category.findByIdAndDelete(req.params.id);

    if (!deletedCategory) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    res.json({ message: "Категория успешно удалена" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Ошибка при удалении категории" });
  }
});

module.exports = router;
