import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STUDIO || 'http://localhost:5000/api/studio';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token to requests
api.interceptors.request.use(
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

/**
 * Check if experience name/title is available
 * @param {string} title - Experience title to check
 * @returns {Promise} Response with availability status
 */
export const checkExperienceNameAvailability = async (title) => {
  try {
    const response = await api.get(`/check-experience-name/${encodeURIComponent(title)}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export default {
  checkExperienceNameAvailability,
};
