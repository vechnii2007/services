// Скрипт для проверки пользователей в базе данных
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

// Подключение к MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB");

    try {
      // Получаем всех пользователей
      const users = await User.find().select("email name role");
      console.log(`Found ${users.length} users:`);

      users.forEach((user) => {
        console.log(
          `- Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`
        );
      });

      // Если вам нужно проверить конкретный email
      // const email = 'your-email@example.com';
      // const user = await User.findOne({ email });
      // if (user) {
      //   console.log(`User with email ${email} exists:`, user);
      // } else {
      //   console.log(`User with email ${email} not found`);
      // }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      // Закрываем соединение с базой данных
      mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
