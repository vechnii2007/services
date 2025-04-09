const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Service = require('../models/ServiceOffer');
const Offer = require('../models/Offer');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Настройка Multer для загрузки изображений
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Middleware для проверки роли admin
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
};

// Получение списка пользователей
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Изменение статуса пользователя (блокировка/разблокировка)
router.patch('/users/:id/status', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.status = user.status === 'active' ? 'blocked' : 'active';
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Изменение роли пользователя
router.patch('/users/:id/role', auth, adminAuth, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'provider', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.role = role;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Удаление пользователя
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение списка запросов
router.get('/requests', auth, adminAuth, async (req, res) => {
    try {
        const requests = await ServiceRequest.find().populate('userId', 'name email');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Изменение статуса запроса
router.patch('/requests/:id/status', auth, adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'accepted', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const request = await ServiceRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        request.status = status;
        await request.save();
        res.json(request);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Удаление запроса
router.delete('/requests/:id', auth, adminAuth, async (req, res) => {
    try {
        const request = await ServiceRequest.findByIdAndDelete(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.json({ message: 'Request deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение списка предложений
router.get('/offers', auth, adminAuth, async (req, res) => {
    try {
        const serviceRequests = await ServiceRequest.find();
        const serviceOffers = await Service.find();
        const offers = await Offer.find();
        res.json([
            ...serviceRequests.map(request => ({ ...request._doc, type: 'ServiceRequest' })),
            ...serviceOffers.map(service => ({ ...service._doc, type: 'ServiceOffer' })),
            ...offers.map(offer => ({ ...offer._doc, type: 'Offer' })),
        ]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Изменение статуса предложения
router.patch('/offers/:id/status', auth, adminAuth, async (req, res) => {
    try {
        const { status, type } = req.body;
        let item;
        if (type === 'ServiceRequest') {
            if (!['pending', 'accepted', 'completed'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status for ServiceRequest' });
            }
            item = await ServiceRequest.findById(req.params.id);
        } else if (type === 'ServiceOffer') {
            if (!['pending', 'accepted', 'rejected'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status for ServiceOffer' });
            }
            item = await Service.findById(req.params.id);
        } else if (type === 'Offer') {
            if (!['pending', 'accepted', 'rejected'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status for Offer' });
            }
            item = await Offer.findById(req.params.id);
        } else {
            return res.status(400).json({ error: 'Invalid type' });
        }
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        item.status = status;
        await item.save();
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Удаление предложения
router.delete('/offers/:id', auth, adminAuth, async (req, res) => {
    try {
        const { type } = req.body;
        let item;
        if (type === 'ServiceRequest') {
            item = await ServiceRequest.findByIdAndDelete(req.params.id);
        } else if (type === 'ServiceOffer') {
            item = await Service.findByIdAndDelete(req.params.id);
        } else if (type === 'Offer') {
            item = await Offer.findByIdAndDelete(req.params.id);
        } else {
            return res.status(400).json({ error: 'Invalid type' });
        }
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение списка категорий
router.get('/categories', auth, adminAuth, async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Добавление новой категории
router.post('/categories', auth, adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, label } = req.body;
        if (!name || !label || !req.file) {
            return res.status(400).json({ error: 'Name, label, and image are required' });
        }
        const image = `/images/${req.file.filename}`; // Обновляем путь
        const category = new Category({ name, label, image });
        await category.save();
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Обновление категории
router.patch('/categories/:id', auth, adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, label } = req.body;
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        if (name) category.name = name;
        if (label) category.label = label;
        if (req.file) category.image = `/images/${req.file.filename}`; // Обновляем путь
        await category.save();
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Удаление категории
router.delete('/categories/:id', auth, adminAuth, async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;