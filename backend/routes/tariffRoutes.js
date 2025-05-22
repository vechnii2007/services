const express = require("express");
const router = express.Router();
const tariffController = require("../controllers/tariffController");
const auth = require("../middleware/auth");

// Получить все тарифы
router.get("/", auth, tariffController.getAllTariffs);
// Получить тариф по id
router.get("/:id", auth, tariffController.getTariffById);
// Создать тариф
router.post("/", auth, tariffController.createTariff);
// Обновить тариф
router.put("/:id", auth, tariffController.updateTariff);
// Удалить тариф
router.delete("/:id", auth, tariffController.deleteTariff);
// Активировать/деактивировать тариф
router.patch("/:id/toggle", auth, tariffController.toggleTariffActive);

module.exports = router;
