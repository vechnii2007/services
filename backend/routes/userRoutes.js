const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const passport = require("../config/passport");
require("dotenv").config();

// Регистрация пользователя
router.post("/register", async (req, res) => {
  try {
    console.log("Received registration request:", req.body);

    const { name, email, password, role, phone, address, providerInfo } =
      req.body;

    if (!name || !email || !password || !role) {
      console.log("Validation failed: All fields are required");
      return res.status(400).json({ error: "All fields are required" });
    }

    console.log("Checking for existing user with email:", email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(400).json({ error: "User already exists" });
    }

    const userData = {
      name,
      email,
      password,
      role,
      phone: phone || "",
      address: address || "",
    };

    // Если регистрируется провайдер, добавляем информацию о провайдере
    if (role === "provider" && providerInfo) {
      userData.providerInfo = {
        specialization: providerInfo.specialization || [],
        languages: providerInfo.languages || [],
        description: providerInfo.description || "",
        workingHours: providerInfo.workingHours || "",
        contactPreferences: {
          email: providerInfo.contactPreferences?.email ?? true,
          phone: providerInfo.contactPreferences?.phone ?? true,
          chat: providerInfo.contactPreferences?.chat ?? true,
        },
        completedOffers: 0,
        responseRate: 0,
        totalResponses: 0,
        totalRequests: 0,
      };
    }

    const user = new User(userData);

    console.log("Saving user to database:", user);
    await user.save();
    console.log("User saved successfully:", user._id);

    console.log("Generating JWT token for user:", user._id);
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return res.status(500).json({
        error: "Server configuration error: JWT_SECRET is not defined",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        _id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("JWT token generated:", token);

    res.status(201).json({ token });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Вход пользователя
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        _id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1d" }
    );

    user.status = "online";
    await user.save();

    // Формируем расширенный ответ с информацией о пользователе
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      address: user.address,
    };

    // Добавляем информацию о провайдере, если это провайдер
    if (user.role === "provider") {
      userResponse.providerInfo = user.providerInfo;
    }

    res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Получение данных текущего пользователя
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Обновление статистики провайдера
router.post("/provider/stats", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "provider") {
      return res.status(403).json({ error: "Not authorized as provider" });
    }

    const { type } = req.body;
    switch (type) {
      case "completedOffer":
        await user.incrementCompletedOffers();
        break;
      case "response":
        await user.incrementTotalResponses();
        break;
      case "request":
        await user.incrementTotalRequests();
        break;
      default:
        return res.status(400).json({ error: "Invalid stat type" });
    }

    res.json({ success: true, stats: user.providerInfo });
  } catch (error) {
    console.error("Error updating provider stats:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение статистики провайдера
router.get("/provider/:id/stats", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "provider") {
      return res.status(404).json({ error: "Provider not found" });
    }

    res.json({
      completedOffers: user.providerInfo.completedOffers,
      responseRate: user.providerInfo.responseRate,
      totalResponses: user.providerInfo.totalResponses,
      totalRequests: user.providerInfo.totalRequests,
    });
  } catch (error) {
    console.error("Error fetching provider stats:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение информации о пользователе по ID (для публичного доступа)
router.get(":id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -email -phone -__v"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Возвращаем только безопасную информацию о пользователе
    const safeUserInfo = {
      _id: user._id,
      name: user.name,
      role: user.role,
      status: user.status === "active" ? "active" : "inactive", // Не раскрываем другие статусы
      createdAt: user.createdAt,
    };

    // Если это провайдер, добавляем публичную информацию о провайдере
    if (user.role === "provider" && user.providerInfo) {
      safeUserInfo.providerInfo = {
        specialization: user.providerInfo.specialization,
        languages: user.providerInfo.languages,
        description: user.providerInfo.description,
        workingHours: user.providerInfo.workingHours,
        completedOffers: user.providerInfo.completedOffers,
        responseRate: user.providerInfo.responseRate,
      };
    }

    res.json(safeUserInfo);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Google OAuth2: старт (оба пути)
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth2: callback (оба пути)
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/oauth-success?token=${token}`
    );
  }
);

// Обновление профиля пользователя (роль, телефон, адрес и т.д.)
router.put("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Разрешаем менять только name, phone, address, role (но не admin)
    const { name, phone, address, role } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (role && ["user", "provider"].includes(role)) {
      user.role = role;
    }
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
