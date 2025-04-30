const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Доступ запрещен. Требуются права администратора." });
  }
  next();
};

const isProvider = (req, res, next) => {
  if (req.user.role !== "provider" && req.user.role !== "admin") {
    return res
      .status(403)
      .json({
        message:
          "Доступ запрещен. Требуются права провайдера или администратора.",
      });
  }
  next();
};

module.exports = {
  isAdmin,
  isProvider,
};
