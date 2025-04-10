const express = require('express');
const router = express.Router();
const multer = require('multer');
const ServiceRequest = require('../models/ServiceRequest');
const Service = require('../models/ServiceOffer');
const Offer = require('../models/Offer');
const Category = require('../models/Category');
const Message = require('../models/Message');
const Favorite = require('../models/Favorite');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const path = require('path');

// Базовый URL бэкенда
const BASE_URL = 'http://localhost:5001';

// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Получение всех категорий (доступно всем)
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение уникальных местоположений (доступно всем)
router.get('/locations', async (req, res) => {
    try {
        const serviceLocations = await Service.distinct('location');
        const offerLocations = await Offer.distinct('location');
        const allLocations = [...new Set([...serviceLocations, ...offerLocations])]
            .filter(location => location) // Убираем пустые значения
            .sort(); // Сортируем по алфавиту
        res.json(allLocations);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Создание категории (доступно только admin)
router.post('/categories', auth, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admins only.' });
        }

        const { name, label } = req.body;
        if (!name || !label || !req.file) {
            return res.status(400).json({ error: 'Name, label, and image are required' });
        }

        const category = new Category({
            name,
            label,
            image: `/uploads/${req.file.filename}`,
        });
        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Обновление категории (доступно только admin)
router.put('/categories/:id', auth, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admins only.' });
        }

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const { name, label } = req.body;
        category.name = name || category.name;
        category.label = label || category.label;
        if (req.file) {
            category.image = `/uploads/${req.file.filename}`;
        }

        await category.save();
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение всех предложений с пагинацией и фильтрацией (доступно всем, включая гостей)
router.get('/offers', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
        const location = req.query.location ? req.query.location.toLowerCase() : null;

        const serviceFilter = { status: 'active' };
        const offerFilter = { status: 'active' };

        if (minPrice || maxPrice !== Infinity) {
            serviceFilter.price = { $gte: minPrice, $lte: maxPrice };
            offerFilter.price = { $gte: minPrice, $lte: maxPrice };
        }

        if (location) {
            serviceFilter.location = { $regex: location, $options: 'i' };
            offerFilter.location = { $regex: location, $options: 'i' };
        }

        const totalServices = await Service.countDocuments(serviceFilter);
        const totalOffers = await Offer.countDocuments(offerFilter);
        const total = totalServices + totalOffers;

        const services = await Service.find(serviceFilter)
            .skip(skip)
            .limit(limit);
        const offers = await Offer.find(offerFilter)
            .skip(skip)
            .limit(limit);

        const combinedOffers = [
            ...services.map(service => ({ ...service._doc, type: 'ServiceOffer' })),
            ...offers.map(offer => ({ ...offer._doc, type: 'Offer' })),
        ];

        res.json({
            offers: combinedOffers,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение конкретного предложения по ID (доступно всем, включая гостей)
router.get('/offers/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (service) {
            return res.json({ ...service._doc, type: 'ServiceOffer' });
        }
        const offer = await Offer.findById(req.params.id).populate('providerId', 'name email');
        if (offer) {
            return res.json({ ...offer._doc, type: 'Offer' });
        }
        res.status(404).json({ error: 'Offer not found' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение предложений текущего пользователя (доступно только provider и admin)
router.get('/my-offers', auth, async (req, res) => {
    try {
        if (!['provider', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Providers and admins only.' });
        }

        const offers = await Offer.find({ providerId: req.user.id }).populate('providerId', 'name email phone address status');
        const formattedOffers = offers.map(offer => ({
            ...offer._doc,
            images: offer.images.map(image => image ? `${BASE_URL}${image}` : 'https://via.placeholder.com/150?text=Offer'),
        }));
        res.json(formattedOffers);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Создание независимого предложения (доступно только provider и admin)
// Создание независимого предложения (доступно только provider и admin)
router.post('/offers', auth, (req, res, next) => {
    upload.array('images', 5)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!['provider', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Providers and admins only.' });
        }

        const { serviceType, location, description, price, providerId } = req.body;
        if (!serviceType || !location || !description || !price) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        const offer = new Offer({
            providerId: req.user.role === 'admin' && providerId ? providerId : req.user.id, // Используем providerId, если указан, иначе текущего пользователя
            serviceType,
            location,
            description,
            price,
            images,
        });
        await offer.save();
        res.status(201).json(offer);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Обновление независимого предложения (доступно только provider и admin, которые его создали)
router.put('/offers/:id', auth, (req, res, next) => {
    upload.array('images', 5)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!['provider', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Providers and admins only.' });
        }

        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        if (offer.providerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. You can only edit your own offers.' });
        }

        const { serviceType, location, description, price } = req.body;
        offer.serviceType = serviceType || offer.serviceType;
        offer.location = location || offer.location;
        offer.description = description || offer.description;
        offer.price = price || offer.price;
        if (req.files && req.files.length > 0) {
            offer.images = req.files.map(file => `/uploads/${file.filename}`);
        }
        await offer.save();
        res.json(offer);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Удаление независимого предложения (доступно только provider и admin, которые его создали)
router.delete('/offers/:id', auth, async (req, res) => {
    try {
        if (!['provider', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Providers and admins only.' });
        }

        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        if (offer.providerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. You can only delete your own offers.' });
        }

        await Favorite.deleteMany({ offerId: offer._id, offerType: 'Offer' });

        await offer.remove();
        res.json({ message: 'Offer deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Создание предложения на запрос (ServiceOffer, доступно только provider)
router.post('/offer', auth, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: 'Request ID, message, and price are required' });
        }
        next();
    });
}, async (req, res) => {
    try {
        const { requestId, message, price } = req.body;
        if (!requestId || !message || !price) {
            return res.status(400).json({ error: 'Request ID, message, and price are required' });
        }
        const request = await ServiceRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        if (req.user.role !== 'provider') {
            return res.status(403).json({ error: 'Access denied. Providers only.' });
        }
        const offer = new ServiceOffer({
            requestId,
            providerId: req.user.id,
            message,
            price,
            image: req.file ? `/uploads/${req.file.filename}` : null,
        });
        await offer.save();

        const notification = new Notification({
            userId: request.userId,
            message: `New offer received for your request: ${request.serviceType}`,
            type: 'offer',
            relatedId: request._id,
        });
        await notification.save();

        res.status(201).json(offer);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение запросов, на которые провайдер отправил предложения (ServiceOffer)
router.get('/provider-offers', auth, async (req, res) => {
    try {
        if (req.user.role !== 'provider') {
            return res.status(403).json({ error: 'Access denied. Providers only.' });
        }
        const offers = await ServiceOffer.find({ providerId: req.user.id }).populate({
            path: 'requestId',
            populate: { path: 'userId', select: 'name email phone address status' },
        });
        const requests = offers.map(offer => offer.requestId).filter(request => request !== null);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Создание запроса
router.post('/request', auth, async (req, res) => {
    try {
        const { serviceType, location, coordinates, description } = req.body;
        const request = new ServiceRequest({
            userId: req.user.id,
            serviceType,
            location,
            coordinates,
            description,
        });
        await request.save();
        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение всех запросов
router.get('/requests', auth, async (req, res) => {
    try {
        if (req.user.role !== 'provider') {
            return res.status(403).json({ error: 'Access denied. Providers only.' });
        }
        const requests = await ServiceRequest.find().populate('userId', 'name email phone address status');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение запросов пользователя
router.get('/my-requests', auth, async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ userId: req.user.id }).populate('userId', 'name email phone address status');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение сообщений
router.get('/messages/:requestId', auth, async (req, res) => {
    try {
        const messages = await Message.find({ requestId: req.params.requestId }).populate('userId', 'name status');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Добавление/удаление предложения из избранного (доступно только авторизованным пользователям)
router.post('/favorites', auth, async (req, res) => {
    try {
        const { offerId, offerType } = req.body;
        if (!offerId || !offerType) {
            return res.status(400).json({ error: 'Offer ID and type are required' });
        }

        if (!['Offer', 'ServiceOffer'].includes(offerType)) {
            return res.status(400).json({ error: 'Invalid offer type' });
        }

        const Model = offerType === 'Offer' ? Offer : ServiceOffer;
        const offer = await Model.findById(offerId);
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        const existingFavorite = await Favorite.findOne({
            userId: req.user.id,
            offerId,
            offerType,
        });

        if (existingFavorite) {
            await existingFavorite.remove();
            res.json({ message: 'Removed from favorites', isFavorite: false });
        } else {
            const favorite = new Favorite({
                userId: req.user.id,
                offerId,
                offerType,
            });
            await favorite.save();
            res.json({ message: 'Added to favorites', isFavorite: true });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение избранных предложений пользователя
router.get('/favorites', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const services = await Service.find({ favoritedBy: userId, status: 'active' });
        const offers = await Offer.find({ favoritedBy: userId, status: 'active' });
        res.json([
            ...services.map(service => ({ ...service._doc, type: 'ServiceOffer' })),
            ...offers.map(offer => ({ ...offer._doc, type: 'Offer' })),
        ]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение уведомлений пользователя
router.get('/notifications', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Пометить уведомление как прочитанное
router.put('/notifications/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        if (notification.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        notification.read = true;
        await notification.save();
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение списка провайдеров (доступно только admin)
router.get('/providers', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admins only.' });
        }

        const providers = await User.find({ role: 'provider' }, 'name email _id');
        res.json(providers);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;