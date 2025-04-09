const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    serviceType: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    coordinates: {
        lat: Number,
        lng: Number,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);