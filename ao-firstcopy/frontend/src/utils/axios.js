import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://aoadmissionhub.com/api/',
  headers: {
    'Content-Type': 'application/json'
  }
});


instance.interceptors.request.use(
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

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Suppress console errors for expected 400 errors (client errors we handle gracefully)
    // Only suppress if the request has a suppressErrors flag
    if (originalRequest?.suppressErrors && error.response?.status >= 400 && error.response?.status < 500) {
      // Mark error as handled to prevent default logging
      error.suppressLog = true;
    }

    return Promise.reject(error);
  }
);

export default instance; 
