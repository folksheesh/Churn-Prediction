import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.includes('localhost') && typeof window !== 'undefined' && window.location.hostname !== 'localhost') 
    ? import.meta.env.VITE_API_URL.replace('localhost', window.location.hostname) 
    : (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:8000/api/v1` : 'http://localhost:8000/api/v1')),
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
