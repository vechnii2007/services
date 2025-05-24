const Category = require("../models/Category");
const categoryStatsService = require("../services/CategoryStatsService");
const { ApiError } = require("../utils/errors");

class CategoryController {
  // Получение всех категорий
  async getAllCategories(req, res, next) {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}][CategoryController] Getting all categories`);

    try {
      const startTime = Date.now();
      const categories = await Category.find();
      const queryTime = Date.now() - startTime;

      console.log(
        `[${requestId}][CategoryController] Categories fetched in ${queryTime}ms:`,
        {
          totalCategories: categories.length,
          categoriesList: categories.map((cat) => ({
            id: cat._id,
            name: cat.name,
            label: cat.label,
            hasImage: !!cat.image,
          })),
        }
      );

      res.json(categories);
    } catch (error) {
      console.error(
        `[${requestId}][CategoryController] Error fetching categories:`,
        {
          error: error.message,
          stack: error.stack,
        }
      );
      next(new ApiError(500, "Error fetching categories"));
    }
  }

  // Создание новой категории
  async createCategory(req, res, next) {
    try {
      let { name, label } = req.body;
      if (!name || !label || !req.file) {
        return next(new ApiError(400, "Name, label, and image are required"));
      }
      // Парсим name если строка (приходит из form-data)
      if (typeof name === "string") {
        try {
          name = JSON.parse(name);
        } catch (e) {
          return next(
            new ApiError(400, "Invalid name format (should be JSON object)")
          );
        }
      }
      // Валидация: хотя бы один язык заполнен
      if (!Object.values(name).some((v) => v && v.trim())) {
        return next(
          new ApiError(400, "At least one language for name is required")
        );
      }
      const category = new Category({
        name,
        label,
        image: req.file.path, // Cloudinary возвращает URL в path
      });
      await category.save();
      res.status(201).json(category);
    } catch (error) {
      console.error("[CategoryController] Error creating category:", error);
      next(new ApiError(500, "Error creating category"));
    }
  }

  // Обновление категории
  async updateCategory(req, res, next) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return next(new ApiError(404, "Category not found"));
      }
      let { name, label } = req.body;
      if (name) {
        if (typeof name === "string") {
          try {
            name = JSON.parse(name);
          } catch (e) {
            return next(
              new ApiError(400, "Invalid name format (should be JSON object)")
            );
          }
        }
        if (!Object.values(name).some((v) => v && v.trim())) {
          return next(
            new ApiError(400, "At least one language for name is required")
          );
        }
        category.name = name;
      }
      if (label) category.label = label;
      if (req.file) {
        category.image = req.file.path; // Cloudinary возвращает URL в path
      }
      await category.save();
      res.json(category);
    } catch (error) {
      console.error("[CategoryController] Error updating category:", error);
      next(new ApiError(500, "Error updating category"));
    }
  }

  // Удаление категории
  async deleteCategory(req, res, next) {
    try {
      const category = await Category.findByIdAndDelete(req.params.id);
      if (!category) {
        return next(new ApiError(404, "Category not found"));
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("[CategoryController] Error deleting category:", error);
      next(new ApiError(500, "Error deleting category"));
    }
  }

  // Получение количества предложений по категориям
  async getCategoryCounts(req, res, next) {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}][CategoryController] Getting category counts`);

    try {
      // Проверяем наличие категорий
      const categories = await Category.find();
      console.log(`[${requestId}] Found ${categories.length} categories`);

      // Получаем статистику
      const counts = await categoryStatsService.getCategoryCounts();

      // Если статистика пуста, делаем полную синхронизацию
      if (Object.keys(counts).length === 0) {
        console.log(`[${requestId}] No counts found, running full sync`);
        await categoryStatsService.fullSync();
        const updatedCounts = await categoryStatsService.getCategoryCounts();
        return res.json(updatedCounts);
      }

      res.json(counts);
    } catch (error) {
      console.error(
        `[${requestId}][CategoryController] Error retrieving category counts:`,
        {
          error: error.message,
          stack: error.stack,
        }
      );
      next(new ApiError(500, "Error retrieving category counts"));
    }
  }

  // Получение расширенной статистики по категориям
  async getCategoryStats(req, res, next) {
    const requestId = Math.random().toString(36).substring(7);
    console.log(
      `[${requestId}][CategoryController] Getting category statistics`
    );

    try {
      // Получаем основные счетчики предложений по категориям
      const counts = await categoryStatsService.getCategoryCounts();

      // Получаем все категории для доступа к дополнительной информации
      const categories = await Category.find().lean();

      // Создаем расширенную статистику
      const stats = categories.map((category) => {
        const displayName =
          category.name?.ru ||
          category.name?.uk ||
          category.name?.es ||
          Object.values(category.name || {})[0] ||
          "";
        return {
          id: category._id,
          name: category.name,
          displayName,
          label: category.label,
          count: counts[category.key] || 0,
          hasImage: !!category.image,
          imageUrl: category.image ? category.image : null,
        };
      });

      // Сортируем по количеству предложений (по убыванию)
      stats.sort((a, b) => b.count - a.count);

      // Добавляем дополнительные метаданные
      const response = {
        stats,
        totalOffers: stats.reduce((sum, cat) => sum + cat.count, 0),
        totalCategories: stats.length,
        topCategory: stats.length > 0 ? stats[0].name : null,
        emptyCategories: stats.filter((cat) => cat.count === 0).length,
        timestamp: new Date(),
      };

      console.log(`[${requestId}] Category statistics prepared:`, {
        totalOffers: response.totalOffers,
        totalCategories: response.totalCategories,
        topCategory: response.topCategory,
        emptyCategories: response.emptyCategories,
      });

      res.json(response);
    } catch (error) {
      console.error(
        `[${requestId}][CategoryController] Error retrieving category statistics:`,
        {
          error: error.message,
          stack: error.stack,
        }
      );
      next(new ApiError(500, "Error retrieving category statistics"));
    }
  }

  // Получение N наиболее востребованных категорий
  async getTopCategories(req, res, next) {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}][CategoryController] Getting top categories`);

    try {
      const limit = parseInt(req.query.limit) || 5; // По умолчанию возвращаем топ-5

      console.log(`[${requestId}] Requested top ${limit} categories`);

      // Получаем основные счетчики предложений по категориям
      const counts = await categoryStatsService.getCategoryCounts();

      // Получаем все категории для доступа к дополнительной информации
      const categories = await Category.find().lean();

      // Создаем расширенную статистику с подсчетом
      const stats = categories.map((category) => {
        const displayName =
          category.name?.ru ||
          category.name?.uk ||
          category.name?.es ||
          Object.values(category.name || {})[0] ||
          "";
        return {
          id: category._id,
          name: category.name,
          displayName,
          label: category.label,
          count: counts[category.key] || 0,
          hasImage: !!category.image,
          imageUrl: category.image ? category.image : null,
        };
      });

      // Сортируем по количеству предложений (по убыванию)
      stats.sort((a, b) => b.count - a.count);

      // Ограничиваем результат запрошенным количеством
      const topCategories = stats.slice(0, limit);

      console.log(
        `[${requestId}] Top ${topCategories.length} categories prepared:`,
        topCategories.map((cat) => `${cat.displayName}: ${cat.count}`)
      );

      res.json({
        categories: topCategories,
        totalCategories: categories.length,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(
        `[${requestId}][CategoryController] Error retrieving top categories:`,
        {
          error: error.message,
          stack: error.stack,
        }
      );
      next(new ApiError(500, "Error retrieving top categories"));
    }
  }
}

module.exports = new CategoryController();
