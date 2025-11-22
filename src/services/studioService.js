import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STUDIO || 'http://localhost:5000/api/studio';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Check if studio name is available
 * @param {string} name - Studio name to check
 * @returns {Promise} Response with availability status
 */
export const checkStudioNameAvailability = async (name) => {
  try {
    const response = await api.get(`/check-name/${encodeURIComponent(name)}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if subdomain is available
 * @param {string} subdomain - Subdomain to check
 * @returns {Promise} Response with availability status and suggestions
 */
export const checkSubdomainAvailability = async (subdomain) => {
  try {
    const response = await api.get(`/check-subdomain/${encodeURIComponent(subdomain)}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export default {
  checkStudioNameAvailability,
  checkSubdomainAvailability,
};
