const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    offerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'offerType', // Динамическая ссылка на модель (Offer или ServiceOffer)
    },
    offerType: {
        type: String,
        enum: ['Offer', 'ServiceOffer'],
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Favorite', favoriteSchema);