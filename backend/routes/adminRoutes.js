const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Service = require('../models/Service');
const Offer = require('../models/Offer');
const auth = require('../middleware/auth');

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
        const services = await Service.find();
        const offers = await Offer.find();
        res.json([...services, ...offers]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Изменение статуса предложения
router.patch('/offers/:id/status', auth, adminAuth, async (req, res) => {
    try {
        const { status, type } = req.body;
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        let offer;
        if (type === 'Service') {
            offer = await Service.findById(req.params.id);
        } else {
            offer = await Offer.findById(req.params.id);
        }
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }
        offer.status = status;
        await offer.save();
        res.json(offer);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Удаление предложения
router.delete('/offers/:id', auth, adminAuth, async (req, res) => {
    try {
        const { type } = req.body;
        let offer;
        if (type === 'Service') {
            offer = await Service.findByIdAndDelete(req.params.id);
        } else {
            offer = await Offer.findByIdAndDelete(req.params.id);
        }
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }
        res.json({ message: 'Offer deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;