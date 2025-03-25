import axios from 'axios';

/**
 * API CONFIGURATION
 * 
 * This file defines the API endpoints used throughout the application.
 * Changes here must be synchronized with the server-side route definitions.
 * 
 * Server routes are configured in server.js and mounted as follows:
 * - User routes: '/api/users' -> registration at '/api/users/register'
 * - Debate routes: Defined directly in server.js
 */

// API configuration for the application
const API_BASE_URL = 'http://localhost:5001';

// Add a token refresh and validation function
const validateToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Check if token data exists
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
    
    if (Date.now() >= expirationTime) {
      // Token has expired
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      window.dispatchEvent(new Event('auth-change'));
      return false;
    }
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add withCredentials for cross-browser compatibility
  withCredentials: false
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    if (validateToken()) {
      const token = localStorage.getItem('token');
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors with enhanced logging
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error logging for debugging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Response Error Status:', error.response.status);
      console.error('API Response Error Data:', error.response.data);
      console.error('API Response Error Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response Error:', error.request);
      console.error('Browser:', window.navigator.userAgent);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Config Error:', error.message);
    }

    if (error.response && error.response.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      window.dispatchEvent(new Event('auth-change'));
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * API ENDPOINTS
 * 
 * IMPORTANT: These endpoints must match the server's route configuration.
 * See server.js and server/routes/ files for the route definitions.
 * 
 * Authentication Endpoints (not listed below but used in components):
 * - Register: '/api/users/register'
 * - Login: '/api/users/login'
 */
export const api = {
  baseUrl: API_BASE_URL,
  client: axiosInstance,
  validateToken,
  endpoints: {
    profile: '/api/users/profile',
    friend: '/api/users/:id/friend',
    debates: '/api/debates',
    debate: '/api/debates/:id'
  }
};