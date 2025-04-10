const mongoose = require('mongoose');
const Offer = require('./models/Offer');
const ServiceOffer = require('./models/ServiceOffer');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/service_portal', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const seedOffers = async () => {
    try {
        // Удаляем существующие данные (опционально)
        await Offer.deleteMany({});
        await ServiceOffer.deleteMany({});

        // Добавляем тестовые предложения (Offer)
        const offers = [
            {
                providerId: '6767633f582719ded3175940', // Замените на реальный ID провайдера
                serviceType: 'transport',
                location: 'City Center',
                description: 'Car rental service',
                price: 50,
                image: '/uploads/1744184277175.jpg', // Используем существующий файл
                status: 'active',
            },
            {
                providerId: '6767633f582719ded3175940',
                serviceType: 'cleaning',
                location: 'Downtown',
                description: 'Professional cleaning service',
                price: 30,
                image: '/uploads/1744184277175.jpg',
                status: 'active',
            },
        ];

        // Добавляем тестовые предложения (ServiceOffer)
        const serviceOffers = [
            {
                requestId: '6767633f582719ded3175950', // Замените на реальный ID запроса
                providerId: '6767633f582719ded3175940',
                message: 'I can help with this request',
                price: 40,
                image: '/uploads/1744209823364.jpg',
                status: 'active',
            },
        ];

        await Offer.insertMany(offers);
        await ServiceOffer.insertMany(serviceOffers);

        console.log('Test offers added successfully');
    } catch (err) {
        console.error('Error seeding offers:', err);
    } finally {
        mongoose.connection.close();
    }
};

seedOffers();