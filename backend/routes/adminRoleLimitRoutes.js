const express = require("express");
const router = express.Router();
const RoleLimit = require("../models/RoleLimit");
const auth = require("../middleware/auth");
const { isAdmin } = require("../middleware/authMiddleware");

// Получить все лимиты
router.get("/", auth, isAdmin, async (req, res) => {
  const limits = await RoleLimit.find();
  res.json(limits);
});

// Создать лимит
router.post("/", auth, isAdmin, async (req, res) => {
  const limit = new RoleLimit(req.body);
  await limit.save();
  res.status(201).json(limit);
});

// Обновить лимит
router.patch("/:id", auth, isAdmin, async (req, res) => {
  const limit = await RoleLimit.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(limit);
});

// Удалить лимит
router.delete("/:id", auth, isAdmin, async (req, res) => {
  await RoleLimit.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
