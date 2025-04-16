import axios from '../utils/axiosConfig';

const UserService = {
    async fetchUser() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const response = await axios.get('/users/me', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },
};

export default UserService;