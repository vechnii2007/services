const multer = require("multer");
const path = require("path");

// Путь до директории для загрузки файлов (относительно корня проекта)
const UPLOADS_DIR = path.join(__dirname, "../uploads");

// Путь для доступа к загруженным файлам через API
const UPLOADS_PATH = "/uploads";

// Настройка хранилища для multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
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
};
