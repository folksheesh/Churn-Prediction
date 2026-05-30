import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.includes('localhost') && typeof window !== 'undefined' && window.location.hostname !== 'localhost') 
    ? import.meta.env.VITE_API_URL.replace('localhost', window.location.hostname) 
    : (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://churn-prediction-jahv.onrender.com/api/v1' : 'http://localhost:8000/api/v1')),
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: Attach auth token automatically ────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('churn_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 auto-logout ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clean up and redirect
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/' && currentPath !== '/user-dashboard') {
        localStorage.removeItem('churn_token');
        localStorage.removeItem('churn_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
