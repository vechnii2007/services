import { BaseService } from "./BaseService";

class OfferService extends BaseService {
  constructor() {
    super("/services");
  }

  async getAll({
    page = 1,
    limit = 10,
    minPrice,
    maxPrice,
    location,
    category,
  } = {}) {
    return this.get("/offers", {
      page,
      limit,
      minPrice,
      maxPrice,
      location,
      category,
    });
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
    const response = await this.get("/categories");
    return response;
  }

  async fetchCategoryCounts() {
    try {
      const response = await this.get("/categories/counts");
      return response;
    } catch (error) {
      throw error;
    }
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
      return { isFavorite: false };
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

      const isFavorite =
        response && typeof response.isFavorite === "boolean"
          ? response.isFavorite
          : response?.message?.includes("Added to favorites");

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
        isFavorite,
        message: response?.message || "",
      };
    } catch (error) {
      return { isFavorite: false, error: error.message };
    }
  }

  async getCategoryStats() {
    try {
      const response = await this.api.get("/categories/stats");
      return response.data;
    } catch (error) {
      console.error("[OfferService] Error getting category stats:", error);
      return {};
    }
  }
}

export default new OfferService();
