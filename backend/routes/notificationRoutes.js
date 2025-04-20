const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const NotificationService = require('../services/NotificationService');
const User = require('../models/User');

// Получение уведомлений пользователя
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const result = await NotificationService.getUserNotifications(req.user.id, {
            page: parseInt(page),
            limit: parseInt(limit),
            unreadOnly: unreadOnly === 'true'
        });
        res.json(result);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Отметка уведомления как прочитанного
router.put('/:notificationId/read', auth, async (req, res) => {
    try {
        const notification = await NotificationService.markAsRead(
            req.user.id,
            req.params.notificationId
        );
        res.json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Подписка на push-уведомления
router.post('/subscribe', auth, async (req, res) => {
    try {
        await NotificationService.savePushSubscription(req.user.id, req.body);
        res.json({ message: 'Successfully subscribed to push notifications' });
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Отписка от push-уведомлений
router.post('/unsubscribe', auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $unset: { pushSubscription: 1 }
        });
        res.json({ message: 'Successfully unsubscribed from push notifications' });
    } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Обновление настроек уведомлений
router.put('/preferences', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        await user.updateNotificationPreferences(req.body);
        res.json(user.notificationPreferences);
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение настроек уведомлений
router.get('/preferences', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user.notificationPreferences);
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 