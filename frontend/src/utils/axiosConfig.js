import axios from 'axios';

// Создаём экземпляр axios с базовыми настройками
const instance = axios.create({
    baseURL: 'http://localhost:5001/api',
});

// Добавляем интерцептор для добавления токена в заголовки
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Убираем автоматический редирект при 401
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log('Axios error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default instance;