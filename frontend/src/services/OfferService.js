import { BaseService } from "./BaseService";

class OfferService extends BaseService {
  constructor() {
    super("/services");
  }

  async getAll({ page = 1, limit = 10, minPrice, maxPrice, location } = {}) {
    console.log("[OfferService] Fetching offers with params:", {
      page,
      limit,
      minPrice,
      maxPrice,
      location,
    });
    return this.get("/offers", { page, limit, minPrice, maxPrice, location });
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

  async fetchFavorites() {
    console.log("[OfferService] Fetching favorites");
    try {
      const response = await this.get("/favorites");
      console.log("[OfferService] Favorites fetched successfully:", response);
      const favoritesMap = {};
      response.forEach((offer) => {
        if (offer && offer._id) {
          favoritesMap[offer._id] = true;
        }
      });
      return favoritesMap;
    } catch (error) {
      console.error("[OfferService] Error fetching favorites:", error);
      return {};
    }
  }

  async toggleFavorite(offerId, offerType) {
    console.log(
      "[OfferService] Toggling favorite for offer:",
      offerId,
      offerType
    );
    if (!offerId) {
      console.error("[OfferService] Missing offerId for toggleFavorite");
      return { isFavorite: false };
    }

    try {
      const response = await this.post("/favorites", {
        offerId,
        offerType: offerType || "Offer",
      });
      console.log("[OfferService] Favorite toggled successfully:", response);
      return {
        isFavorite: response.isFavorite,
      };
    } catch (error) {
      console.error("[OfferService] Error toggling favorite:", error);
      throw error;
    }
  }

  async getFavorites() {
    console.log("[OfferService] Getting favorites");
    try {
      const response = await this.get("/favorites");
      console.log("[OfferService] Favorites response:", response);
      return response || [];
    } catch (error) {
      console.error("[OfferService] Error getting favorites:", error);
      throw error;
    }
  }
}

export default new OfferService();
