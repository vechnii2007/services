import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импорт переводов
import translationRU from './locales/ru/translation.json';
import translationUK from './locales/uk/translation.json';
import translationES from './locales/es/translation.json';

// Ресурсы переводов
const resources = {
    ru: {
        translation: translationRU,
    },
    uk: {
        translation: translationUK,
    },
    es: {
        translation: translationES,
    },
};

i18n
    .use(LanguageDetector) // Автоматическое определение языка
    .use(initReactI18next) // Интеграция с React
    .init({
        resources,
        fallbackLng: 'ru', // Язык по умолчанию, если не удалось определить язык
        debug: true, // Включаем отладку (можно отключить в продакшене)
        interpolation: {
            escapeValue: false, // React уже экранирует значения
        },
    });

export default i18n;