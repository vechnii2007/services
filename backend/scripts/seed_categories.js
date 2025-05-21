require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const Category = require("../models/Category");

const categories = [
  {
    key: "real_estate",
    name: { ru: "Недвижимость", uk: "Нерухомість", es: "Inmobiliaria" },
    label: "Real Estate",
    image: "https://placehold.co/300x180/eee333/text=real_estate",
  },
  {
    key: "auto",
    name: { ru: "Авто", uk: "Авто", es: "Motor" },
    label: "Auto",
    image: "https://placehold.co/300x180/eee333/text=auto",
  },
  {
    key: "services",
    name: { ru: "Услуги", uk: "Послуги", es: "Servicios" },
    label: "Services",
    image: "https://placehold.co/300x180/eee333/text=services",
  },
  {
    key: "jobs",
    name: { ru: "Работа", uk: "Робота", es: "Empleo" },
    label: "Jobs",
    image: "https://placehold.co/300x180/eee333/text=jobs",
  },
  {
    key: "electronics",
    name: { ru: "Электроника", uk: "Електроніка", es: "Electrónica" },
    label: "Electronics",
    image: "https://placehold.co/300x180/eee333/text=electronics",
  },
  {
    key: "fashion",
    name: { ru: "Мода", uk: "Мода", es: "Moda" },
    label: "Fashion",
    image: "https://placehold.co/300x180/eee333/text=fashion",
  },
  {
    key: "home_garden",
    name: { ru: "Дом и сад", uk: "Дім і сад", es: "Casa y Jardín" },
    label: "Home & Garden",
    image: "https://placehold.co/300x180/eee333/text=home_garden",
  },
  {
    key: "hobby",
    name: {
      ru: "Хобби и отдых",
      uk: "Хобі та відпочинок",
      es: "Aficiones y Ocio",
    },
    label: "Hobby & Leisure",
    image: "https://placehold.co/300x180/eee333/text=hobby",
  },
  {
    key: "kids",
    name: { ru: "Дети", uk: "Діти", es: "Bebés" },
    label: "Kids",
    image: "https://placehold.co/300x180/eee333/text=kids",
  },
  {
    key: "pets",
    name: { ru: "Животные", uk: "Тварини", es: "Mascotas" },
    label: "Pets",
    image: "https://placehold.co/300x180/eee333/text=pets",
  },
];

async function seedCategories() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Category.deleteMany({});
  await Category.insertMany(categories);
  console.log(`Seeded ${categories.length} categories`);
  mongoose.disconnect();
}

seedCategories();
