const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const multer = require("multer");
const path = require("path");
const { UPLOADS_DIR } = require("../config/uploadConfig");

// Настройка Multer для загрузки изображений
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Импорт контроллеров
const {
  createOffer,
  getOffers,
  getOffer,
  updateOffer,
  deleteOffer,
  getMyOffers,
  searchOffers,
  getFavoriteOffers,
  addToFavorites,
  removeFromFavorites,
} = require("../controllers/offerController");

// Маршруты для работы с предложениями
router.post(
  "/offers",
  auth,
  upload.array("images", 5),
  asyncHandler(createOffer)
);
router.get("/offers", asyncHandler(getOffers));
router.get("/offers/search", asyncHandler(searchOffers));
router.get("/offers/my", auth, asyncHandler(getMyOffers));
router.get("/offers/favorites", auth, asyncHandler(getFavoriteOffers));
router.post("/offers/:id/favorites", auth, asyncHandler(addToFavorites));
router.delete("/offers/:id/favorites", auth, asyncHandler(removeFromFavorites));
router.get("/offers/:id", asyncHandler(getOffer));
router.put(
  "/offers/:id",
  auth,
  upload.array("images", 5),
  asyncHandler(updateOffer)
);
router.delete("/offers/:id", auth, asyncHandler(deleteOffer));

// Middleware для логирования
router.use((req, res, next) => {
  console.log("=== Offer Route ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("User:", req.user ? req.user.id : "Not authenticated");
  console.log("=================");
  next();
});

module.exports = router;
