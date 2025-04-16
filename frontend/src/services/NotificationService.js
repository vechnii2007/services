import axios from '../utils/axiosConfig';

const NotificationService = {
    async fetchNotifications() {
        const token = localStorage.getItem('token');
        if (!token) return [];
        const response = await axios.get('/services/notifications', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    async markNotificationAsRead(notificationId) {
        const token = localStorage.getItem('token');
        if (!token) return;
        await axios.put(
            `/services/notifications/${notificationId}/read`,
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
    },
};

export default NotificationService;