/**
 * Middleware для проверки прав администратора
 * Должен использоваться после middleware auth
 */
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Доступ запрещен. Требуются права администратора.",
    });
  }
  next();
};
