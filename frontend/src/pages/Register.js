import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, MenuItem, Select, InputLabel, FormControl } from '@mui/material';

const Register = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5001/api/users/register', formData);
            setMessage(res.data.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            if (error.response) {
                setMessage('Error: ' + (error.response.data.error || 'Something went wrong'));
            } else if (error.request) {
                setMessage('Error: No response from server. Is the backend running?');
            } else {
                setMessage('Error: ' + error.message);
            }
            console.error(error);
        }
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
            <Card sx={{ width: '100%', maxWidth: 400, p: 3 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        {t('register')}
                    </Typography>
                    {message && (
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                            {message}
                        </Typography>
                    )}
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label={t('name')}
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                            />
                            <TextField
                                label={t('email')}
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                fullWidth
                                required
                            />
                            <TextField
                                label={t('password')}
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                fullWidth
                                required
                            />
                            <FormControl fullWidth>
                                <InputLabel>{t('role')}</InputLabel>
                                <Select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    label={t('role')}
                                >
                                    <MenuItem value="user">{t('user')}</MenuItem>
                                    <MenuItem value="provider">{t('provider')}</MenuItem>
                                </Select>
                            </FormControl>
                            <Button type="submit" variant="contained" color="primary">
                                {t('register_button')}
                            </Button>
                        </Box>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Register;