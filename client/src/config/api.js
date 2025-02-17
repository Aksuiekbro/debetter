import axios from 'axios';

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
  }
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
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
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