const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Обеспечиваем совместимость между id и _id
    if (decoded.id && !decoded._id) {
      decoded._id = decoded.id;
    } else if (decoded._id && !decoded.id) {
      decoded.id = decoded._id;
    }

    // Актуализируем пользователя из базы
    const userFromDb = await User.findById(decoded.id);
    if (!userFromDb) {
      return res.status(401).json({ error: "User not found." });
    }
    req.user = {
      ...decoded,
      role: userFromDb.role,
      status: userFromDb.status,
      email: userFromDb.email,
      name: userFromDb.name,
      // можно добавить другие поля по необходимости
    };

    next();
  } catch (error) {
    console.error("[auth] Token verification error:", error.message);
    res.status(401).json({ error: "Invalid token." });
  }
};
