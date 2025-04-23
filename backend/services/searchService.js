const SearchQuery = require("../models/SearchQuery");

class SearchService {
  // Сохранить поисковый запрос
  async saveSearchQuery(query, category = null) {
    try {
      const existingQuery = await SearchQuery.findOne({ query });

      if (existingQuery) {
        // Обновляем существующий запрос
        existingQuery.count += 1;
        existingQuery.lastSearched = new Date();
        if (category) existingQuery.category = category;
        await existingQuery.save();
        return existingQuery;
      }

      // Создаем новый запрос
      const newQuery = new SearchQuery({
        query,
        category,
        count: 1,
      });
      await newQuery.save();
      return newQuery;
    } catch (error) {
      console.error("Error saving search query:", error);
      throw error;
    }
  }

  // Получить популярные поисковые запросы
  async getPopularSearches(limit = 5, timeframe = "7d") {
    try {
      const dateFilter = new Date();
      switch (timeframe) {
        case "24h":
          dateFilter.setDate(dateFilter.getDate() - 1);
          break;
        case "7d":
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case "30d":
          dateFilter.setDate(dateFilter.getDate() - 30);
          break;
        default:
          dateFilter.setDate(dateFilter.getDate() - 7);
      }

      return await SearchQuery.find({
        lastSearched: { $gte: dateFilter },
      })
        .sort({ count: -1 })
        .limit(limit)
        .select("query count category");
    } catch (error) {
      console.error("Error getting popular searches:", error);
      throw error;
    }
  }

  // Очистить старые поисковые запросы
  async cleanupOldSearches(olderThan = "90d") {
    try {
      const dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - parseInt(olderThan));

      const result = await SearchQuery.deleteMany({
        lastSearched: { $lt: dateFilter },
      });

      return result;
    } catch (error) {
      console.error("Error cleaning up old searches:", error);
      throw error;
    }
  }
}

module.exports = new SearchService();
