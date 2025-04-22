const jwt = require("jsonwebtoken");

/**
 * Middleware для проверки аутентификации пользователя
 * Извлекает и проверяет JWT токен из заголовка Authorization
 * Если токен валидный, добавляет информацию о пользователе в объект req
 */
module.exports = (req, res, next) => {
  console.log("=== Auth Middleware ===");
  const authHeader = req.header("Authorization");
  console.log("Auth header:", authHeader);

  const token = authHeader?.replace("Bearer ", "");
  console.log("Extracted token:", token ? "exists" : "missing");

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    console.log("Verifying token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified, user:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ error: "Invalid token." });
  }
};
