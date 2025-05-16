import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

export const loginRequest = (email, password) => {
  return api.post('/users/login', { email, password });
};

export const registerRequest = (email, password) => {
  return api.post('/users/register', { email, password });
};

export default api;