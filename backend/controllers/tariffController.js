const Tariff = require("../models/Tariff");

// Получить все тарифы
exports.getAllTariffs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) {
      filter.type = req.query.type;
    }
    const tariffs = await Tariff.find(filter);
    res.json(tariffs);
  } catch (err) {
    res.status(500).json({ error: "Ошибка получения тарифов" });
  }
};

// Получить тариф по id
exports.getTariffById = async (req, res) => {
  try {
    const tariff = await Tariff.findById(req.params.id);
    if (!tariff) return res.status(404).json({ error: "Тариф не найден" });
    res.json(tariff);
  } catch (err) {
    res.status(500).json({ error: "Ошибка получения тарифа" });
  }
};

// Создать тариф
exports.createTariff = async (req, res) => {
  try {
    const { name, description, price, type, period, isActive } = req.body;
    const tariff = new Tariff({
      name,
      description,
      price,
      type,
      period,
      isActive,
      createdBy: req.user?._id,
    });
    await tariff.save();
    res.status(201).json(tariff);
  } catch (err) {
    res
      .status(400)
      .json({ error: "Ошибка создания тарифа", details: err.message });
  }
};

// Обновить тариф
exports.updateTariff = async (req, res) => {
  try {
    const { name, description, price, type, period, isActive } = req.body;
    const tariff = await Tariff.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        type,
        period,
        isActive,
        updatedBy: req.user?._id,
      },
      { new: true }
    );
    if (!tariff) return res.status(404).json({ error: "Тариф не найден" });
    res.json(tariff);
  } catch (err) {
    res
      .status(400)
      .json({ error: "Ошибка обновления тарифа", details: err.message });
  }
};

// Удалить тариф
exports.deleteTariff = async (req, res) => {
  try {
    const tariff = await Tariff.findByIdAndDelete(req.params.id);
    if (!tariff) return res.status(404).json({ error: "Тариф не найден" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Ошибка удаления тарифа" });
  }
};

// Активировать/деактивировать тариф
exports.toggleTariffActive = async (req, res) => {
  try {
    const tariff = await Tariff.findById(req.params.id);
    if (!tariff) return res.status(404).json({ error: "Тариф не найден" });
    tariff.isActive = !tariff.isActive;
    tariff.updatedBy = req.user?._id;
    await tariff.save();
    res.json(tariff);
  } catch (err) {
    res.status(500).json({ error: "Ошибка смены статуса тарифа" });
  }
};
