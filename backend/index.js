const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
require('dotenv').config();

// Логирование для проверки JWT_SECRET
console.log('JWT_SECRET:', process.env.JWT_SECRET);
if (!process.env.JWT_SECRET) {
    console.error('Error: JWT_SECRET is not defined in .env file');
    process.exit(1);
}

const app = express();

// Настройка Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// Статическая папка для доступа к загруженным файлам
app.use('/uploads', express.static('uploads'));

// Проверка подключения к MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
    // Логируем текущую базу данных
    console.log('Database name:', mongoose.connection.db.databaseName);
}).catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Проверка, что подключение активно перед запуском сервера
mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established');
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);