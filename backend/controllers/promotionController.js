const PromotionService = require("../services/promotionService");
const { validateObjectId } = require("../utils/validation");
const { ApiError } = require("../utils/errors");

class PromotionController {
  async promoteOffer(req, res, next) {
    try {
      const { offerId } = req.params;
      const { promotionType } = req.body;
      const userId = req.user.id;

      if (!validateObjectId(offerId)) {
        throw new ApiError(400, "Invalid offer ID format");
      }

      const result = await PromotionService.promoteOffer(
        offerId,
        promotionType,
        userId
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async checkPromotionStatus(req, res, next) {
    try {
      const { offerId } = req.params;

      if (!validateObjectId(offerId)) {
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
