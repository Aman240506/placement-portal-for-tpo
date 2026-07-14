import axios from 'axios';

// Configured Axios instance — used as the default export across all pages
// e.g. import api from '../../services/auth.service'
//      api.get('/students/profile')
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If token expires / is invalid, log the user out automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Named export used by AuthContext
export const getMeAPI = () => api.get('/auth/me');

// Default export used by all pages
export default api;