const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    label: {
        type: String,
        required: true,
    },
    image: {
        type: String, // URL изображения
        required: true,
    },
});

module.exports = mongoose.model('Category', categorySchema);