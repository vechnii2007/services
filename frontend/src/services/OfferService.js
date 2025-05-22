import BaseService from "./BaseService";

class OfferService extends BaseService {
  constructor() {
    super("/services");
  }

  async getAll(params = {}) {
    return this.get("/offers", params);
  }

  async getMyOffers() {
    try {
      const response = await this.get("/my-offers");
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getById(id) {
    return this.get(`/offers/${id}`);
  }

  async create(offerData) {
    return this.post("/offers", offerData);
  }

  async update(id, offerData) {
    return this.put(`/offers/${id}`, offerData);
  }

  async delete(id) {
    return this.delete(`/offers/${id}`);
  }

  async uploadImage(id, imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);
    return this.upload(`/offers/${id}/image`, formData);
  }

  async getByCategory(categoryId, params = {}) {
    return this.get(`/offers/category/${categoryId}`, params);
  }

  async getByUser(userId, params = {}) {
    return this.get(`/offers/user/${userId}`, params);
  }

  async fetchCategories() {
    return this.get("/categories");
  }

  async fetchCategoryCounts() {
    return this.get("/categories/counts");
  }

  async fetchFavorites() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        localStorage.removeItem("userFavorites");
        return {};
      }

      const response = await this.get("/favorites");
      const favoritesMap = {};
      response.forEach((offer) => {
        if (offer && offer._id) {
          favoritesMap[offer._id] = true;
        }
      });

      localStorage.setItem("userFavorites", JSON.stringify(favoritesMap));
      return favoritesMap;
    } catch (error) {
      try {
        const cachedFavorites = localStorage.getItem("userFavorites");
        if (cachedFavorites) {
          return JSON.parse(cachedFavorites);
        }
      } catch (e) {}
      return {};
    }
  }

  async toggleFavorite(offerId, offerType = "offer") {
    if (!offerId) {
      return {
        success: false,
        isFavorite: false,
        error: "No offer ID provided",
      };
    }

    try {
      const serverOfferType =
        offerType === "offer"
          ? "Offer"
          : offerType === "service_offer"
          ? "ServiceOffer"
          : offerType;

      const response = await this.post("/favorites", {
        offerId,
        offerType: serverOfferType,
      });

      const isFavorite = response?.message?.includes("Added to favorites");

      try {
        const cachedFavorites = localStorage.getItem("userFavorites");
        let favorites = cachedFavorites ? JSON.parse(cachedFavorites) : {};

        if (isFavorite) {
          favorites[offerId] = true;
        } else {
          delete favorites[offerId];
        }

        localStorage.setItem("userFavorites", JSON.stringify(favorites));
      } catch (e) {}

      return {
        success: true,
        isFavorite: isFavorite,
        message: response?.message || "",
      };
    } catch (error) {
      return {
        success: false,
        isFavorite: false,
        error: error.message || "Error toggling favorite status",
      };
    }
  }

  async getCategoryStats() {
    try {
      const response = await this.get("/categories/stats");
      return response;
    } catch (error) {
      return {
        stats: [],
        totalOffers: 0,
        totalCategories: 0,
      };
    }
  }

  async promoteOffer(offerId, tariffId) {
    return this.post(`/offers/${offerId}/promote`, { tariffId });
  }

  async getPromotionStatus(offerId) {
    if (!offerId) {
      return { isPromoted: false };
    }

    try {
      const response = await this.get(`/offers/${offerId}/promotion-status`);
      return response || { isPromoted: false };
    } catch (error) {
      return {
        isPromoted: false,
        error: error.message,
      };
    }
  }

  async getPromotedOffers(limit = 10, skip = 0) {
    const retryAttempts = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const response = await this.get("/offers/promoted", { limit, skip });
        return response;
      } catch (error) {
        lastError = error;
        if (attempt < retryAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError;
  }

  async getProviderInfo(providerId) {
    if (!providerId) {
      return null;
    }

    try {
      const response = await this.get(`/users/${providerId}`);
      return response;
    } catch (error) {
      return null;
    }
  }

  async getTopCategories(limit = 5) {
    try {
      const response = await this.get("/categories/top", { limit });
      return {
        categories: response.categories || [],
        totalCategories: response.total || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        categories: [
          {
            id: "1",
            name: "healthcare",
            label: "Медицина",
            count: 12,
            hasImage: true,
            imageUrl: "/uploads/images/healthcare.jpg",
          },
          {
            id: "2",
            name: "household",
            label: "Бытовые услуги",
            count: 8,
            hasImage: true,
            imageUrl: "/uploads/images/household.jpg",
          },
          {
            id: "3",
            name: "finance",
            label: "Финансы",
            count: 6,
            hasImage: true,
            imageUrl: "/uploads/images/finance.jpg",
          },
          {
            id: "4",
            name: "education",
            label: "Образование",
            count: 5,
            hasImage: true,
            imageUrl: "/uploads/images/education.jpg",
          },
          {
            id: "5",
            name: "transport",
            label: "Транспорт",
            count: 3,
            hasImage: true,
            imageUrl: "/uploads/images/transport.jpg",
          },
        ],
        totalCategories: 5,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getPromotedOffersByUser(userId) {
    if (!userId) return [];
    try {
      const response = await this.get("/offers", {
        providerId: userId,
        promoted: true,
      });
      return response;
    } catch (error) {
      return [];
    }
  }
}

export default new OfferService();
