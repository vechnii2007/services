const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Отправка электронной почты
 * @param {string} to - Адрес получателя
 * @param {string} subject - Тема письма
 * @param {string} text - Текст письма
 * @param {string} html - HTML-версия письма (опционально)
 * @returns {Promise<Object>} - Результат отправки
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    // В режиме разработки используем Ethereal для тестирования отправки
    if (process.env.NODE_ENV === "development" || !process.env.EMAIL_HOST) {
      return sendTestEmail(to, subject, text, html);
    }

    // Создаем транспорт
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Отправляем письмо
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@service-portal.com",
      to,
      subject,
      text,
      html: html || text, // Если HTML не указан, используем текст
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    // В случае ошибки не выбрасываем исключение, чтобы не блокировать процесс
    return { error: error.message };
  }
};

/**
 * Отправка тестового письма через Ethereal
 * Используется только для разработки
 */
const sendTestEmail = async (to, subject, text, html) => {
  try {
    // Создаем тестовый аккаунт
    const testAccount = await nodemailer.createTestAccount();

    // Создаем тестовый транспорт
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Отправляем тестовое письмо
    const mailOptions = {
      from: "test@service-portal.com",
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      "Test email sent. Preview URL:",
      nodemailer.getTestMessageUrl(info)
    );
    return info;
  } catch (error) {
    console.error("Error sending test email:", error);
    return { error: error.message };
  }
};

/**
 * Отправка уведомления о скором истечении срока промоакции
 * @param {string} to - Email получателя
 * @param {string} offerTitle - Название объявления
 * @param {string} promotionType - Тип промоакции
 * @param {Date} endDate - Дата окончания промоакции
 * @returns {Promise<Object>} - Результат отправки
 */
const sendPromotionExpiryEmail = async (
  to,
  offerTitle,
  promotionType,
  endDate
) => {
  const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

  const promotionTypes = {
    TOP: "поднятие в топ",
    HIGHLIGHT: "выделение",
    URGENT: "срочная продажа",
  };

  const promotionName = promotionTypes[promotionType] || promotionType;

  let subject, text;

  if (daysLeft <= 0) {
    subject = `Промоакция для объявления "${offerTitle}" завершилась`;
    text = `Ваша промоакция "${promotionName}" для объявления "${offerTitle}" завершилась. Продлите её, чтобы увеличить видимость вашего объявления!`;
  } else if (daysLeft === 1) {
    subject = `Промоакция для объявления "${offerTitle}" скоро завершится`;
    text = `Ваша промоакция "${promotionName}" для объявления "${offerTitle}" завершится завтра. Продлите её заранее, чтобы не потерять преимущество!`;
  } else {
    subject = `Промоакция для объявления "${offerTitle}" скоро завершится`;
    text = `Ваша промоакция "${promotionName}" для объявления "${offerTitle}" завершится через ${daysLeft} дней. Не забудьте продлить её вовремя!`;
  }

  return sendEmail(to, subject, text);
};

module.exports = {
  sendEmail,
  sendPromotionExpiryEmail,
};
