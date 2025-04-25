const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Константы для путей
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const UPLOADS_PATH = "/uploads/images";
const IMAGES_DIR = path.join(UPLOADS_DIR, "images");

// Создаем папку для изображений, если её нет
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR);
}

// Настройка хранилища для multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Конфигурация multer
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Только изображения разрешены к загрузке!"), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = {
  upload,
  UPLOADS_DIR,
  UPLOADS_PATH,
  IMAGES_DIR,
};
