import axios from 'axios';
import Swal from 'sweetalert2';

// Global error handler function
const handleAPIError = (error) => {
  let errorTitle = 'Error';
  let errorMessage = 'An unexpected error occurred';
  let errorStatus = null;

  // Extract error information from different error formats
  if (error.response) {
    // Server responded with error status
    errorStatus = error.response.status;
    errorTitle = `Error ${errorStatus}`;

    // Try to get error message from different possible response structures
    errorMessage =
      error.response.data?.message ||
      error.response.data?.error ||
      error.response.data?.msg ||
      error.response.statusText ||
      'Something went wrong';
  } else if (error.request) {
    // Request made but no response received
    errorTitle = 'Network Error';
    errorMessage = 'Unable to connect to the server. Please check your internet connection.';
  } else if (error.message) {
    // Error in request setup
    errorMessage = error.message;
  }

  // Don't show error alert for certain status codes (e.g., 401 - unauthorized, handled elsewhere)
  if (errorStatus === 401 || errorStatus === 403) {
    return;
  }

  // Show error alert using SWAL
  Swal.fire({
    icon: 'error',
    title: errorTitle,
    text: errorMessage,
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'OK',
    allowOutsideClick: true,
    allowEscapeKey: true,
  });
};

// Create an axios instance with base configuration
// Always use localhost:5000 for API calls - subdomain is passed as header
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000, // 60 seconds timeout - increased for file uploads
});

// Request interceptor to add auth token and subdomain header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add subdomain as header if available
    const subdomain = localStorage.getItem('subdomain');
    if (subdomain) {
      config.headers['X-Subdomain'] = subdomain;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log error for debugging
    console.error('API Error:', error);

    // Check if the request has a flag to suppress global error handling
    // Components can set config.skipGlobalErrorHandler = true to handle errors themselves
    if (error.config && !error.config.skipGlobalErrorHandler) {
      handleAPIError(error);
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Register a new studio
  registerStudio: async (studioData) => {
    const formData = new FormData();

    // Append form fields
    formData.append('studioName', studioData.studioName);
    formData.append('email', studioData.email);
    formData.append('password', studioData.password);
    formData.append('subdomain', studioData.subdomain);
    formData.append('brandColor', studioData.brandColor);

    // Append logo file if provided
    if (studioData.logo) {
      formData.append('logo', studioData.logo);
    }

    try {
      const response = await api.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Registration failed';
    }
  },

  // Verify email with OTP
  verifyEmail: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-email', {
        email,
        otp,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Email verification failed';
    }
  },

  // Resend verification OTP
  resendVerificationOTP: async (email) => {
    try {
      const response = await api.post('/auth/resend-otp', {
        email,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to resend OTP';
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Login failed';
    }
 },

  // Verify invite code
  verifyInviteCode: async (code, email) => {
    try {
      const response = await api.post('/auth/verify-invite-code', {
        code,
        email,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to verify invite code';
    }
  },

  // Create studio from invite
  createStudioFromInvite: async (inviteCode, studioName, subdomain, email) => {
    try {
      const response = await api.post('/studio/create-with-invite', {
        inviteCode,
        studioName,
        subdomain,
        email
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to create studio from invite';
    }
  },

  // Add password to studio
  setPasswordForStudio: async (studioId, password) => {
    try {
      const response = await api.post('/studio/add-password', {
        studioId,
        password
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to set password for studio';
    }
  },
};

// Experience API functions
export const experienceAPI = {
  // Create a new experience
  createExperience: async (experienceData) => {
    const formData = new FormData();
    
    // Append basic experience data
    formData.append('title', experienceData.title);
    formData.append('description', experienceData.description || '');
    formData.append('startDate', experienceData.startDate);
    formData.append('endDate', experienceData.endDate);
    if (experienceData.timeLimit) formData.append('timeLimit', experienceData.timeLimit);
    if (experienceData.softCapacity) formData.append('softCapacity', experienceData.softCapacity);
    if (experienceData.brandColor) formData.append('brandColor', experienceData.brandColor);
    if (experienceData.logo) formData.append('logo', experienceData.logo);
    
    // Don't send tracks with the experience creation, we'll add them separately after
    formData.append('tracks', JSON.stringify([]));

    try {
      const response = await api.post('/studio/experiences', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to create experience';
    }
  },

  // Get all experiences
  getExperiences: async (params = {}) => {
    try {
      const response = await api.get('/studio/experiences', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to fetch experiences';
    }
  },

  // Get a specific experience by ID
  getExperienceById: async (id) => {
    try {
      const response = await api.get(`/studio/experiences/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to fetch experience';
    }
  },

  // Update an experience
  updateExperience: async (id, experienceData) => {
    const formData = new FormData();
    
    // Append basic experience data
    formData.append('title', experienceData.title);
    formData.append('description', experienceData.description || '');
    formData.append('startDate', experienceData.startDate);
    formData.append('endDate', experienceData.endDate);
    if (experienceData.timeLimit) formData.append('timeLimit', experienceData.timeLimit);
    if (experienceData.softCapacity) formData.append('softCapacity', experienceData.softCapacity);
    if (experienceData.brandColor) formData.append('brandColor', experienceData.brandColor);
    if (experienceData.logo) formData.append('logo', experienceData.logo);
    if (experienceData.status) formData.append('status', experienceData.status);
    
    try {
      const response = await api.put(`/studio/experiences/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to update experience';
    }
  },

  // Delete an experience
  deleteExperience: async (id) => {
    try {
      const response = await api.delete(`/studio/experiences/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to delete experience';
    }
  },

  // Publish an experience
  publishExperience: async (id) => {
    try {
      const response = await api.put(`/studio/experiences/${id}/publish`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to publish experience';
    }
  },

  // Archive an experience
  archiveExperience: async (id) => {
    try {
      const response = await api.put(`/studio/experiences/${id}/archive`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to archive experience';
    }
  }
};

// Public Experience API functions (for guest access)
export const publicExperienceAPI = {
  // Get a public experience by ID
  getPublicExperienceById: async (id) => {
    try {
      const response = await api.get(`/experiences/${id}/public`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to fetch public experience';
    }
  },

  // Validate track access
  validateTrackAccess: async (experienceId, trackId) => {
    try {
      const response = await api.post(`/experiences/${experienceId}/tracks/${trackId}/access`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to validate track access';
    }
  },

  // Validate unlock code for a track
  validateUnlockCode: async (experienceId, trackId, code) => {
    try {
      const response = await api.post(`/experiences/${experienceId}/tracks/${trackId}/unlock`, {
        code
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to validate unlock code';
    }
  },

  // --- NEW JWT-BASED STREAMING FUNCTIONS ---

  // Get stream access token (new "Ticket Booth")
  getStreamAccessToken: async (experienceId, trackId) => {
    try {
      const response = await api.get(`/experiences/${experienceId}/tracks/${trackId}/stream`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to get stream access token';
    }
  },

  // --- END OF NEW JWT-BASED STREAMING FUNCTIONS ---

  // --- V2 API FUNCTIONS (NewExperience with Stages) ---

  // Get a public experience by ID (V2 - with stages)
  getPublicExperienceByIdV2: async (id) => {
    try {
      const response = await api.get(`/experiences/${id}/public-v2`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to fetch public experience';
    }
  },

  // Validate stage access (V2)
  validateStageAccessV2: async (experienceId, stageId) => {
    try {
      const response = await api.post(`/experiences/${experienceId}/stages/${stageId}/access`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to validate stage access';
    }
  },

  // Validate unlock code for a stage (V2)
  validateUnlockCodeV2: async (experienceId, stageId, code) => {
    try {
      const response = await api.post(`/experiences/${experienceId}/stages/${stageId}/unlock`, {
        code
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to validate unlock code';
    }
  },

  // Get stream access token (V2 - with stages)
  getStreamAccessTokenV2: async (experienceId, stageId) => {
    try {
      const response = await api.get(`/experiences/${experienceId}/stages/${stageId}/stream`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to get stream access token';
    }
  },

  // --- END OF V2 API FUNCTIONS ---
};

// New Experience API functions
export const newExperienceAPI = {
  // Create a new experience with HLS processing
  createNewExperience: async (experienceData, onUploadProgress, skipGlobalErrorHandler = false) => {
    const formData = new FormData();

    // Create a copy of experience data to avoid modifying the original
    const dataToSend = { ...experienceData };

    // Handle icon file if provided
    if (dataToSend.icon && dataToSend.icon instanceof File) {
      formData.append('icon', dataToSend.icon);
      dataToSend.icon = null; // Remove from JSON data
    }

    // Handle background image file if provided
    if (dataToSend.backgroundImage && dataToSend.backgroundImage instanceof File) {
      formData.append('backgroundImage', dataToSend.backgroundImage);
      dataToSend.backgroundImage = null; // Remove from JSON data
    }

    // Handle stage files if they exist - remove File objects before sending JSON
    if (dataToSend.stages && Array.isArray(dataToSend.stages)) {
      const stagesToAppend = [];

      dataToSend.stages.forEach((stage, index) => {
        if (stage.uploadedFile && stage.uploadedFile instanceof File) {
          // Track this for FormData appending
          stagesToAppend.push({ index, file: stage.uploadedFile });
          // Remove the file from the stage in the JSON data
          stage.uploadedFile = null;
        }
      });

      // Append all stage files to FormData
      stagesToAppend.forEach(({ index, file }) => {
        formData.append(`stages.${index}.uploadedFile`, file);
      });
    }

    // Now append the cleaned experience data as JSON
    formData.append('experienceData', JSON.stringify(dataToSend));

    try {
      const response = await api.post('/studio/new-experiences', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onUploadProgress,
        skipGlobalErrorHandler: skipGlobalErrorHandler
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to create new experience';
    }
  },

  // Get all new experiences
  getNewExperiences: async (params = {}) => {
    try {
      const response = await api.get('/studio/new-experiences', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to fetch new experiences';
    }
  },

  // Get a specific new experience by ID
  getNewExperienceById: async (id) => {
    try {
      const response = await api.get(`/studio/new-experiences/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to fetch new experience';
    }
  },

  // Get a specific new experience by slug (public endpoint)
  getNewExperienceBySlug: async (slug) => {
    try {
      const response = await api.get(`/studio/public/experience/${slug}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to fetch experience';
    }
  },

  // Update a new experience
  updateNewExperience: async (id, experienceData, onUploadProgress) => {
    const formData = new FormData();

    // Create a copy of experience data to avoid modifying the original
    const dataToSend = { ...experienceData };

    // Handle icon file if provided
    if (dataToSend.icon && dataToSend.icon instanceof File) {
      formData.append('icon', dataToSend.icon);
      dataToSend.icon = null; // Remove from JSON data
    }

    // Handle background image file if provided
    if (dataToSend.backgroundImage && dataToSend.backgroundImage instanceof File) {
      formData.append('backgroundImage', dataToSend.backgroundImage);
      dataToSend.backgroundImage = null; // Remove from JSON data
    }

    // Handle stage files if they exist - remove File objects before sending JSON
    if (dataToSend.stages && Array.isArray(dataToSend.stages)) {
      const stagesToAppend = [];

      dataToSend.stages.forEach((stage, index) => {
        if (stage.uploadedFile && stage.uploadedFile instanceof File) {
          // Track this for FormData appending
          stagesToAppend.push({ index, file: stage.uploadedFile });
          // Remove the file from the stage in the JSON data
          stage.uploadedFile = null;
        }
      });

      // Append all stage files to FormData
      stagesToAppend.forEach(({ index, file }) => {
        formData.append(`stages.${index}.uploadedFile`, file);
      });
    }

    // Now append the cleaned experience data as JSON
    formData.append('experienceData', JSON.stringify(dataToSend));

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (onUploadProgress) {
        config.onUploadProgress = onUploadProgress;
      }

      const response = await api.put(`/studio/new-experiences/${id}`, formData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to update new experience';
    }
  },

  // Delete a new experience
  deleteNewExperience: async (id) => {
    try {
      const response = await api.delete(`/studio/new-experiences/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to delete new experience';
    }
  },

  // Publish a new experience
  publishNewExperience: async (id) => {
    try {
      const response = await api.put(`/studio/new-experiences/${id}/publish`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to publish new experience';
    }
  },

  // Archive a new experience
  archiveNewExperience: async (id) => {
    try {
      const response = await api.put(`/studio/new-experiences/${id}/archive`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to archive new experience';
    }
  },

  // Get stream access token for a stage during editing (authenticated)
  getStageStreamAccess: async (experienceId, stageId) => {
    try {
      const response = await api.get(`/studio/new-experiences/${experienceId}/stages/${stageId}/stream`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to get stream access token';
    }
  },

  // Get edit stream access token for a stage (authenticated studio owner)
  getEditStreamAccess: async (experienceId, stageId) => {
    try {
      const response = await api.get(`/studio/new-experiences/${experienceId}/stages/${stageId}/edit-stream`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to get edit stream access token';
    }
  },

  // Validate stage unlock code (guest/public endpoint)
  validateStageUnlockCode: async (experienceId, stageId, code) => {
    try {
      const response = await api.post(`/experiences/${experienceId}/stages/${stageId}/unlock`, {
        code
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Invalid unlock code';
    }
  }
};

// Export utility function for manually showing API errors
export const showAPIError = (title = 'Error', message = 'An unexpected error occurred') => {
  Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'OK',
    allowOutsideClick: true,
    allowEscapeKey: true,
  });
};

export default api;
