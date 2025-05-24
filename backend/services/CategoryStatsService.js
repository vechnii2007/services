const CategoryStats = require("../models/CategoryStats");
const Category = require("../models/Category");
const Offer = require("../models/Offer");
const cron = require("node-cron");

class CategoryStatsService {
  // Инкрементальное обновление при создании предложения
  async incrementCategoryCount(category) {
    try {
      await CategoryStats.updateOne(
        { category },
        {
          $inc: { count: 1 },
          $set: { last_incremental_update: new Date() },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error(
        "[CategoryStatsService] Error incrementing category count:",
        error
      );
    }
  }

  // Декрементальное обновление при удалении предложения
  async decrementCategoryCount(category) {
    try {
      await CategoryStats.updateOne(
        { category },
        {
          $inc: { count: -1 },
          $set: { last_incremental_update: new Date() },
        }
      );
    } catch (error) {
      console.error(
        "[CategoryStatsService] Error decrementing category count:",
        error
      );
    }
  }

  // Полное обновление статистики
  async fullSync() {
    const startTime = Date.now();
    try {
      const categories = await Category.find();
      const updates = [];
      let totalOffers = 0;
      for (const category of categories) {
        const count = await Offer.countDocuments({
          serviceType: category.key,
        });
        totalOffers += count;
        updates.push({
          updateOne: {
            filter: { category: category.key },
            update: {
              $set: {
                count,
                last_full_sync: new Date(),
              },
            },
            upsert: true,
          },
        });
      }
      if (updates.length > 0) {
        await CategoryStats.bulkWrite(updates);
      }
    } catch (error) {
      console.error("[CategoryStatsService] Error during full sync:", error);
    }
  }

  // Получение статистики
  async getCategoryCounts() {
    try {
      const stats = await CategoryStats.find();
      const counts = {};
      let totalOffers = 0;
      stats.forEach((stat) => {
        counts[stat.category] = stat.count;
        totalOffers += stat.count;
      });
      return counts;
    } catch (error) {
      console.error(
        "[CategoryStatsService] Error getting category counts:",
        error
      );
      return {};
    }
  }

  // Инициализация cron-задачи
  initCronJob() {
    // Запуск каждые 10 минут
    cron.schedule("*/10 * * * *", async () => {
      await this.fullSync();
    });
  }
}

const categoryStatsService = new CategoryStatsService();
module.exports = categoryStatsService;
