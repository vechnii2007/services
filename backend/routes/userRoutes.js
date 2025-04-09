const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Регистрация пользователя
router.post('/register', async (req, res) => {
    try {
        console.log('Received registration request:', req.body);

        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            console.log('Validation failed: All fields are required');
            return res.status(400).json({ error: 'All fields are required' });
        }

        console.log('Checking for existing user with email:', email);
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = new User({
            name,
            email,
            password, // Пароль будет хешироваться в middleware модели User
            role,
        });

        console.log('Saving user to database:', user);
        await user.save();
        console.log('User saved successfully:', user._id);

        console.log('Generating JWT token for user:', user._id);
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined');
            return res.status(500).json({ error: 'Server configuration error: JWT_SECRET is not defined' });
        }
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('JWT token generated:', token);

        res.status(201).json({ token });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Вход пользователя
// Вход пользователя
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'your_jwt_secret', {
            expiresIn: '1d',
        });

        user.status = 'online';
        await user.save();

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение данных текущего пользователя
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;