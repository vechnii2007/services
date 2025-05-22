const Payment = require("../models/Payment");
const Subscription = require("../models/Subscription");
const Tariff = require("../models/Tariff");
const { ApiError } = require("../utils/errors");
const mongoose = require("mongoose");

// Создание платежа
exports.create = async (req, res, next) => {
  try {
    const { amount, type, tariffId } = req.body;
    const userId = req.user._id;

    // Проверяем существование тарифа
    const tariff = await Tariff.findById(tariffId);
    if (!tariff) {
      throw new ApiError(404, "Тариф не найден");
    }

    // Проверяем, что сумма соответствует тарифу
    if (amount !== tariff.price) {
      throw new ApiError(400, "Сумма не соответствует тарифу");
    }

    // Создаем платеж
    const payment = await Payment.create({
      userId,
      amount,
      type,
      tariffId,
      status: "pending",
    });

    // Если это подписка, создаем запись о подписке
    if (type === "subscription") {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + tariff.period);

      await Subscription.create({
        userId,
        tariffId: new mongoose.Types.ObjectId(tariffId),
        startDate,
        endDate,
        status: "pending",
        lastPaymentId: payment._id,
      });
    }

    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
};

// Получение всех платежей (с фильтрацией и пагинацией)
exports.getAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      userId,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "name email")
        .populate("tariffId", "name type period"),
      Payment.countDocuments(query),
    ]);

    res.json({
      payments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// Получение платежа по ID
exports.getById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("userId", "name email")
      .populate("tariffId", "name type period");

    if (!payment) {
      throw new ApiError(404, "Платеж не найден");
    }

    res.json(payment);
  } catch (error) {
    next(error);
  }
};

// Обновление статуса платежа
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      throw new ApiError(404, "Платеж не найден");
    }

    // Обновляем статус платежа
    payment.status = status;
    await payment.save();

    // Если это подписка, обновляем статус подписки
    if (payment.type === "subscription") {
      const subscription = await Subscription.findOne({
        lastPaymentId: payment._id,
      });

      if (subscription) {
        subscription.status = status === "paid" ? "active" : "pending";
        await subscription.save();
      }
    }

    res.json(payment);
  } catch (error) {
    next(error);
  }
};

// Получение статистики по платежам
exports.getStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const stats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const byType = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    res.json({
      byStatus: stats,
      byType,
    });
  } catch (error) {
    next(error);
  }
};

// Получение платежей пользователя
exports.getUserPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.params.userId;

    const [payments, total] = await Promise.all([
      Payment.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("tariffId", "name type period"),
      Payment.countDocuments({ userId }),
    ]);

    res.json({
      payments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};
