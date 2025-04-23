const mongoose = require("mongoose");
const Category = require("../models/Category");
require("dotenv").config();

const categories = [
  {
    name: "translation",
    label: "Translation",
    image: "http://localhost:5001/uploads/images/translation.jpg",
  },
  {
    name: "legal",
    label: "Legal",
    image: "http://localhost:5001/uploads/images/legal.jpg",
  },
  {
    name: "real_estate",
    label: "Real Estate",
    image: "http://localhost:5001/uploads/images/real_estate.jpg",
  },
  {
    name: "healthcare",
    label: "Healthcare",
    image: "http://localhost:5001/uploads/images/healthcare.jpg",
  },
  {
    name: "education",
    label: "Education",
    image: "http://localhost:5001/uploads/images/education.jpg",
  },
  {
    name: "cultural_events",
    label: "Cultural Events",
    image: "http://localhost:5001/uploads/images/cultural_events.jpg",
  },
  {
    name: "finance",
    label: "Finance",
    image: "http://localhost:5001/uploads/images/finance.jpg",
  },
  {
    name: "transport",
    label: "Transport",
    image: "http://localhost:5001/uploads/images/transport.jpg",
  },
  {
    name: "household",
    label: "Household",
    image: "http://localhost:5001/uploads/images/household.jpg",
  },
  {
    name: "shopping",
    label: "Shopping",
    image: "http://localhost:5001/uploads/images/shopping.jpg",
  },
  {
    name: "travel",
    label: "Travel",
    image: "http://localhost:5001/uploads/images/travel.jpg",
  },
  {
    name: "psychology",
    label: "Psychology",
    image: "http://localhost:5001/uploads/images/psychology.jpg",
  },
  {
    name: "plumbing",
    label: "Plumbing",
    image: "http://localhost:5001/uploads/images/plumbing.jpg",
  },
  {
    name: "massage",
    label: "Massage",
    image: "http://localhost:5001/uploads/images/massage.jpg",
  },
  {
    name: "cleaning",
    label: "Cleaning",
    image: "http://localhost:5001/uploads/images/cleaning.jpg",
  },
  {
    name: "taro",
    label: "Taro",
    image: "http://localhost:5001/uploads/images/taro.jpg",
  },
  {
    name: "evacuation",
    label: "Evacuation",
    image: "http://localhost:5001/uploads/images/evacuation.jpg",
  },
];

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB");

    try {
      // Удаляем существующие категории (опционально)
      await Category.deleteMany({});
      console.log("Existing categories deleted");

      // Добавляем новые категории
      await Category.insertMany(categories);
      console.log("Categories migrated successfully");
    } catch (error) {
      console.error("Error migrating categories:", error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
