import BaseService from "./BaseService";

class ReviewService extends BaseService {
  constructor() {
    super("/reviews");
  }

  /**
   * Получение отзывов для предложения
   * @param {string} offerId - ID предложения
   */
  async getReviewsByOffer(offerId) {
    try {
      const response = await this.get(`/offer/${offerId}`);
      return response;
    } catch (error) {
      console.error("[ReviewService] Error getting reviews by offer:", error);
      console.error(
        "[ReviewService] Error details:",
        error.response?.data || error.message
      );
      console.error("[ReviewService] Error status:", error.response?.status);
      throw error;
    }
  }

  /**
   * Получение отзывов для поставщика
   * @param {string} providerId - ID поставщика
   */
  async getReviewsByProvider(providerId) {
    try {
      const response = await this.get(`/provider/${providerId}`);
      return response;
    } catch (error) {
      console.error(
        "[ReviewService] Error getting reviews by provider:",
        error
      );
      throw error;
    }
  }

  /**
   * Создание нового отзыва
   * @param {object} reviewData - Данные отзыва
   * @param {string} reviewData.offerId - ID предложения
   * @param {string} reviewData.offerType - Тип предложения (Offer, ServiceOffer)
   * @param {number} reviewData.rating - Рейтинг (1-5)
   * @param {string} reviewData.comment - Комментарий
   */
  async createReview(reviewData) {
    try {
      const response = await this.post("/", reviewData);
      return response;
    } catch (error) {
      console.error("[ReviewService] Error creating review:", error);
      throw error;
    }
  }

  /**
   * Обновление отзыва
   * @param {string} reviewId - ID отзыва
   * @param {object} reviewData - Данные для обновления
   * @param {number} [reviewData.rating] - Рейтинг (1-5)
   * @param {string} [reviewData.comment] - Комментарий
   */
  async updateReview(reviewId, reviewData) {
    try {
      const response = await this.put(`/${reviewId}`, reviewData);
      return response;
    } catch (error) {
      console.error("[ReviewService] Error updating review:", error);
      throw error;
    }
  }

  /**
   * Удаление отзыва
   * @param {string} reviewId - ID отзыва
   */
  async deleteReview(reviewId) {
    try {
      const response = await this.delete(`/${reviewId}`);
      return response;
    } catch (error) {
      console.error("[ReviewService] Error deleting review:", error);
      throw error;
    }
  }
}

export default new ReviewService();
