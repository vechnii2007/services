const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/service_portal', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const addTestServiceRequest = async () => {
    try {
        // Создаём тестового пользователя
        const user = new User({
            name: 'Test User',
            email: 'user@test.com',
            password: 'hashedpassword', // В реальном приложении пароль должен быть захеширован
            role: 'user',
            status: 'online', // Исправляем status на допустимое значение
        });
        const savedUser = await user.save();

        // Создаём тестовый запрос на услугу
        const testServiceRequest = new ServiceRequest({
            userId: savedUser._id,
            serviceType: 'translation',
            description: 'Need translation services',
            location: 'Moscow',
            status: 'pending',
        });

        await testServiceRequest.save();
        console.log('Test service request added');
    } catch (err) {
        console.error('Error adding test service request:', err);
    } finally {
        mongoose.connection.close();
    }
};

addTestServiceRequest();