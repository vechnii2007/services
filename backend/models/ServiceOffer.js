const mongoose = require('mongoose');

const serviceOfferSchema = new mongoose.Schema({
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceRequest',
        required: true,
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    image: {
        type: String, // URL изображения
        default: null,
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive'], // Возможные значения
        default: 'pending', // Значение по умолчанию
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('ServiceOffer', serviceOfferSchema);