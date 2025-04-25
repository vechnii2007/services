async getAll(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;
  const query = this.buildQuery(filters);

  const [offers, total] = await Promise.all([
    Offer.find(query)
      .sort({
        'promoted.isPromoted': -1,
        'promoted.promotedUntil': -1,
        createdAt: -1
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('providerId', 'name email'),
    Offer.countDocuments(query)
  ]);

  return {
    offers,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

const getMyOffers = async (userId) => {
  try {
    console.log("Getting offers for user:", userId);
    const offers = await Offer.find({ providerId: userId })
      .populate('provider', 'name email')
      .lean();
    
    // Добавляем providerId к каждому предложению
    const offersWithProvider = offers.map(offer => ({
      ...offer,
      providerId: userId // Явно добавляем providerId
    }));

    console.log("Found offers:", offersWithProvider.length);
    return offersWithProvider;
  } catch (error) {
    console.error("Error in getMyOffers:", error);
    throw error;
  }
};

module.exports = {
  getMyOffers,
  // ... остальные методы
}; 