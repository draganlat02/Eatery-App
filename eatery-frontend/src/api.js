import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8000/api', // Tvoj backend URL
});

// Presretač koji uzima token iz localStorage-a i stavlja ga u svaki zahtjev
API.interceptors.request.use(
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

export default API;