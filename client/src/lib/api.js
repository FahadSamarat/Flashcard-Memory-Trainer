import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4040',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      // Clear auth and optionally redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && window.location?.pathname?.startsWith('/decks')) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;


