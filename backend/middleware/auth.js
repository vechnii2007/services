const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
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

    req.user = decoded;

    // Логируем для отладки
    console.log("[auth] User authenticated:", {
      id: req.user.id,
      _id: req.user._id,
      role: req.user.role,
    });

    next();
  } catch (error) {
    console.error("[auth] Token verification error:", error.message);
    res.status(401).json({ error: "Invalid token." });
  }
};
