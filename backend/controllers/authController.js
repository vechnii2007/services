const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Регистрация нового пользователя
exports.register = async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    // Проверка, существует ли пользователь
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Создание пользователя
    user = new User({
      username,
      email,
      password: hashedPassword,
      name,
    });

    await user.save();

    // Создание JWT токена
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Создание refresh токена
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Авторизация пользователя
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Проверка существования пользователя
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    // Создание JWT токена
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Создание refresh токена
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Обновление токена
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh токен отсутствует" });
    }

    try {
      // Проверка refresh токена
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      // Поиск пользователя
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      // Создание нового JWT токена
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Создание нового refresh токена
      const newRefreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(200).json({
        token,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Недействительный refresh токен" });
    }
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Выход пользователя (только реализация на клиенте)
exports.logout = (req, res) => {
  res.status(200).json({ message: "Выход выполнен успешно" });
};
