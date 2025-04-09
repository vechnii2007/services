const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const categories = [
    { name: 'translation', label: 'Translation', image: '/images/translation.jpg' },
    { name: 'legal', label: 'Legal', image: '/images/legal.jpg' },
    { name: 'real_estate', label: 'Real Estate', image: '/images/real_estate.jpg' },
    { name: 'healthcare', label: 'Healthcare', image: '/images/healthcare.jpg' },
    { name: 'education', label: 'Education', image: '/images/education.jpg' },
    { name: 'cultural_events', label: 'Cultural Events', image: '/images/cultural_events.jpg' },
    { name: 'finance', label: 'Finance', image: '/images/finance.jpg' },
    { name: 'transport', label: 'Transport', image: '/images/transport.jpg' },
    { name: 'household', label: 'Household', image: '/images/household.jpg' },
    { name: 'shopping', label: 'Shopping', image: '/images/shopping.jpg' },
    { name: 'travel', label: 'Travel', image: '/images/travel.jpg' },
    { name: 'psychology', label: 'Psychology', image: '/images/psychology.jpg' },
    { name: 'plumbing', label: 'Plumbing', image: '/images/plumbing.jpg' },
    { name: 'massage', label: 'Massage', image: '/images/massage.jpg' },
    { name: 'cleaning', label: 'Cleaning', image: '/images/cleaning.jpg' },
    { name: 'taro', label: 'Taro', image: '/images/taro.jpg' },
    { name: 'evacuation', label: 'Evacuation', image: '/images/evacuation.jpg' },
];

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('Connected to MongoDB');

    try {
        // Удаляем существующие категории (опционально)
        await Category.deleteMany({});
        console.log('Existing categories deleted');

        // Добавляем новые категории
        await Category.insertMany(categories);
        console.log('Categories migrated successfully');
    } catch (error) {
        console.error('Error migrating categories:', error);
    } finally {
        mongoose.connection.close();
    }
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});