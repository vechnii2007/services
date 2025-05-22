const PromotionService = require("../services/promotionService");
const { isValidObjectId } = require("../utils/validation");
const { ApiError } = require("../utils/errors");
const Tariff = require("../models/Tariff");

class PromotionController {
  async promoteOffer(req, res, next) {
    try {
      const { id } = req.params;
      const offerId = id;
      const { tariffId } = req.body;
      const userId = req.user.id;

      if (!isValidObjectId(offerId)) {
        throw new ApiError(400, "Invalid offer ID format");
      }
      if (!isValidObjectId(tariffId)) {
        throw new ApiError(400, "Invalid tariff ID format");
      }

      const tariff = await Tariff.findById(tariffId);
      if (!tariff || tariff.type !== "promotion" || !tariff.isActive) {
        throw new ApiError(400, "Invalid or inactive promotion tariff");
      }

      const result = await PromotionService.promoteOfferWithTariff(
        offerId,
        tariff,
        userId
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async checkPromotionStatus(req, res, next) {
    try {
      const { id } = req.params;
      const offerId = id;

      if (!isValidObjectId(offerId)) {
        throw new ApiError(400, "Invalid offer ID format");
      }

      const status = await PromotionService.checkPromotionStatus(offerId);
      res.json(status);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PromotionController();
