import { getCategoryName } from "../components/CategoryCard";

/**
 * Универсальный хелпер для отображения названия категории/типа услуги с фоллбеками.
 * @param {object|string} category - объект категории или строка (id)
 * @param {string} lang - язык
 * @returns {string}
 */
export function getCategoryDisplayName(category, lang = "ru") {
  if (!category) return "";
  if (typeof category === "string") return category;
  if (category.name) {
    // используем getCategoryName, если есть name
    return getCategoryName(category, lang);
  }
  return category.label || category._id || "";
}
