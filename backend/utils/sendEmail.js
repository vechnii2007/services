// backend/utils/sendEmail.js
const nodemailer = require('nodemailer');

// Настройка транспортера для отправки email
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Используем Gmail, можно заменить на другой сервис (например, SendGrid, Mailgun и т.д.)
    auth: {
        user: process.env.EMAIL_USER, // Ваш email (например, your-email@gmail.com)
        pass: process.env.EMAIL_PASS, // Пароль от email или App Password для Gmail
    },
});

// Функция для отправки email
const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER, // Отправитель
            to, // Получатель
            subject, // Тема письма
            text, // Текст письма
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

module.exports = sendEmail;