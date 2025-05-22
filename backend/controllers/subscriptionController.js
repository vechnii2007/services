const Subscription = require("../models/Subscription");

exports.getMySubscription = async (req, res) => {
  try {
    console.log("[getMySubscription] userId:", req.user.id);
    const subscription = await Subscription.findOne({
      userId: req.user.id,
      status: "active",
    })
      .sort({ endDate: -1 })
      .populate("tariffId");
    if (!subscription) {
      console.log("[getMySubscription] no active subscription");
      return res.json({ status: "none" });
    }
    if (!subscription.tariffId) {
      console.log("[getMySubscription] tariffId is null");
      return res
        .status(500)
        .json({ error: "Тариф, связанный с подпиской, не найден" });
    }
    console.log("[getMySubscription] found subscription:", subscription._id);
    res.json({
      status: subscription.status,
      expiresAt: subscription.endDate,
      tariff: {
        name: subscription.tariffId.name,
        type: subscription.tariffId.type,
        period: subscription.tariffId.period,
      },
    });
  } catch (error) {
    console.error("[getMySubscription] error:", error);
    res.status(500).json({ error: "Ошибка получения подписки" });
  }
};
