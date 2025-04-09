import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig'; // Импортируем настроенный axios
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
} from '@mui/material';

const Login = ({ onLogin }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedData = {
            email: formData.email.trim(),
            password: formData.password.trim(),
        };
        console.log('Form data before sending:', trimmedData);
        console.log('Password length:', trimmedData.password.length);
        console.log('Password char codes:', trimmedData.password.split('').map(char => char.charCodeAt(0)));
        try {
            const res = await axios.post('/users/login', trimmedData); // Используем настроенный axios
            localStorage.setItem('token', res.data.token);
            setMessage(t('login_successful'));
            await onLogin(); // Вызываем onLogin для обновления состояния пользователя
            navigate('/offers'); // Перенаправляем на страницу предложений сразу
        } catch (error) {
            if (error.response) {
                const errorKey = error.response.data.error
                    .toLowerCase()
                    .replace(/ /g, '_');
                setMessage(t(errorKey, error.response.data.error));
            } else if (error.request) {
                setMessage(t('no_response_from_server'));
            } else {
                setMessage('Error: ' + error.message);
            }
        }
    };

    return (
        <Box sx={{ paddingY: 4 }}>
            <Typography variant="h5" gutterBottom>
                {t('login')}
            </Typography>
            {message && (
                <Typography
                    variant="body2"
                    color={message.includes('Error') || message.includes(t('invalid_credentials')) ? 'error' : 'textSecondary'}
                    align="center"
                    sx={{ marginBottom: 2 }}
                >
                    {message}
                </Typography>
            )}
            <Card>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            label={t('email')}
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            fullWidth
                            required
                            sx={{ marginBottom: 2 }}
                        />
                        <TextField
                            label={t('password')}
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            fullWidth
                            required
                            sx={{ marginBottom: 2 }}
                        />
                        <Button type="submit" variant="contained" color="primary">
                            {t('login')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Login;