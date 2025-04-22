const Offer = require("../models/Offer");
const { UPLOADS_PATH } = require("../config/uploadConfig");
const Promotion = require("../models/Promotion");

// Создание предложения
exports.createOffer = async (req, res) => {
  try {
    const offerData = { ...req.body };

    // Обработка загруженных изображений
    if (req.files && req.files.length > 0) {
      offerData.images = req.files.map(
        (file) => `${UPLOADS_PATH}/${file.filename}`
      );
    }

    const offer = new Offer(offerData);
    await offer.save();
    res.status(201).json(offer);
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Обновление предложения
exports.updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Обновляем основные поля
    Object.assign(offer, req.body);

    // Обработка новых изображений
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(
        (file) => `${UPLOADS_PATH}/${file.filename}`
      );
      offer.images = [...(offer.images || []), ...newImages];
    }

    await offer.save();
    res.json(offer);
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Получение всех предложений
exports.getOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const query = { status: "active" };

    // Добавляем фильтры
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    if (req.query.location) {
      query.location = req.query.location;
    }

    // Получаем текущую дату для фильтрации активных продвижений
    const now = new Date();

    // Находим все активные промоакции
    const activePromotions = await Promotion.find({
      endDate: { $gt: now },
      startDate: { $lte: now },
    });

    // Создаем карту типов промоакций для быстрого доступа
    const promotionMap = {};
    activePromotions.forEach((promotion) => {
      promotionMap[promotion.offerId.toString()] = promotion.type;
    });

    // Агрегация для правильной сортировки с учетом промоакций
    const offers = await Offer.aggregate([
      { $match: query },
      {
        $addFields: {
          hasActivePromotion: {
            $and: [
              { $ne: ["$promotion", null] },
              { $eq: ["$promotion.active", true] },
              { $lte: ["$promotion.startDate", now] },
              { $gte: ["$promotion.endDate", now] },
            ],
          },
          promotionPriority: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$promotion", null] },
                  { $eq: ["$promotion.active", true] },
                  { $lte: ["$promotion.startDate", now] },
                  { $gte: ["$promotion.endDate", now] },
                ],
              },
              then: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$promotion.type", "TOP"] }, then: 3 },
                    {
                      case: { $eq: ["$promotion.type", "HIGHLIGHT"] },
                      then: 2,
                    },
                    { case: { $eq: ["$promotion.type", "URGENT"] }, then: 1 },
                  ],
                  default: 0,
                },
              },
              else: 0,
            },
          },
        },
      },
      {
        $sort: {
          promotionPriority: -1,
          createdAt: -1,
        },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "providerId",
          foreignField: "_id",
          as: "provider",
        },
      },
      {
        $unwind: {
          path: "$provider",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          price: 1,
          oldPrice: 1,
          location: 1,
          createdAt: 1,
          status: 1,
          type: 1,
          promotion: 1,
          hasActivePromotion: 1,
          promotionPriority: 1,
          providerId: "$provider._id",
          provider: {
            _id: "$provider._id",
            name: "$provider.name",
            email: "$provider.email",
            avatar: "$provider.avatar",
            rating: "$provider.rating",
          },
        },
      },
    ]);

    const total = await Offer.countDocuments(query);

    res.json({
      offers,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error getting offers:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Получение предложения по ID
exports.getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "providerId",
      "name email"
    );

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    res.json(offer);
  } catch (error) {
    console.error("Error fetching offer:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Удаление предложения
exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }
    res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Error deleting offer:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Удаление изображения из предложения
exports.deleteImage = async (req, res) => {
  try {
    const { id, imageUrl } = req.params;
    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    offer.images = offer.images.filter((img) => img !== imageUrl);
    await offer.save();

    res.json({ message: "Image deleted successfully", offer });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Server error" });
  }
};
