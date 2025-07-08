// frontend/src/api/axiosConfig.js
import axios from 'axios';

const API = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL,
    withCredentials: true // Important for sending cookies/headers
});

API.interceptors.request.use((req) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        req.headers.Authorization = `Bearer ${user.token}`;
    }
    return req;
});

export default API;