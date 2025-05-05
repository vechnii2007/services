async function getMyOffers(userId) {
  try {
    const offers = await Offer.find({ providerId: userId })
      .populate("provider", "name email")
      .lean();

    // Добавляем providerId к каждому предложению
    const offersWithProvider = offers.map((offer) => ({
      ...offer,
      providerId: userId, // Явно добавляем providerId
    }));

    return offersWithProvider;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getMyOffers,
  // ... остальные методы
};
