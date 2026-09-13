import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:9090/api',
});

// Add auth token to requests
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosInstance;
