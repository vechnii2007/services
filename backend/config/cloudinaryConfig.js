const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");

// Проверяем, находимся ли мы в режиме разработки
const isDevelopment = process.env.NODE_ENV !== "production";

let storage;
let upload;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  // Конфигурация Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  // Настройка облачного хранилища
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "service-portal",
      allowed_formats: ["jpg", "jpeg", "png", "gif"],
      transformation: [{ width: 1000, height: 1000, crop: "limit" }],
      unique_filename: true,
      use_filename: true,
      overwrite: false,
      resource_type: "auto",
    },
  });
} else if (isDevelopment) {
  // Для разработки используем локальное хранилище
  console.warn(
    "Cloudinary credentials not found, using local storage for development"
  );

  // Создаем папку для загрузок, если её нет
  const uploadDir = path.join(__dirname, "..", "uploads", "images");
  require("fs").mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
      );
    },
  });
} else {
  throw new Error("Missing required Cloudinary environment variables");
}

// Конфигурация multer
upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Проверяем тип файла
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images are allowed"));
    }
    cb(null, true);
  },
});

// Функция для удаления изображения
const deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      console.warn("No publicId provided for deletion");
      return false;
    }

    if (cloudinary) {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`Image deleted from Cloudinary: ${publicId}`, result);
      return result.result === "ok";
    } else {
      // Для локальной разработки
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        "images",
        publicId
      );
      require("fs").unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error("Error deleting image:", {
      publicId,
      error: error.message,
      details: error.error || error,
    });
    return false;
  }
};

// Функция для получения public_id из URL
const getPublicIdFromUrl = (url) => {
  try {
    if (!url) return null;
    if (!cloudinary) {
      // Для локальной разработки возвращаем имя файла
      return path.basename(url);
    }
    const regex = /\/v\d+\/([^/]+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error extracting public_id from URL:", error);
    return null;
  }
};

module.exports = {
  upload,
  cloudinary: cloudinary || null,
  deleteImage,
  getPublicIdFromUrl,
  isDevelopment,
};
