const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
} = require("../controllers/authController");

// Маршрут для регистрации нового пользователя
router.post("/register", register);

// Маршрут для авторизации (получения токена)
router.post("/login", login);

// Маршрут для обновления токена
router.post("/refresh-token", refreshToken);

// Маршрут для выхода (аннулирования токена)
router.post("/logout", logout);

module.exports = router;
