import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'; // Assuming axios might be used later

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  console.log('[AuthContext] Initializing user state:', null); // Log initial state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Start loading until auth check is done

  // Placeholder: Check authentication status on load (e.g., check token)
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Validate token with backend by fetching user profile
        try {
          const config = {
            headers: {
              'Authorization': `Bearer ${token}` // Standard Bearer token format
            }
          };
          // Fetch user profile using the token
          const response = await axios.get('/api/users/profile', config);
          setUser(response.data);
          console.log('[AuthContext] User state updated (useEffect/token valid):', response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Token validation failed:", error.response ? error.response.data : error.message);
          // Clear token and reset state if token is invalid or expired
          localStorage.removeItem('token');
          setUser(null);
          console.log('[AuthContext] User state updated (useEffect/token invalid):', null);
          setIsAuthenticated(false);
          // Note: Could potentially call logout() here if it encapsulates this cleanup logic
        } finally {
           // Ensure loading is set to false regardless of success or failure
           setLoading(false);
        }
      } else {
        // No token found, not authenticated, finished loading
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  // Placeholder login function
  const login = async (email, password) => {
    // Placeholder: Replace with actual API call
    console.log("Placeholder: Logging in with", email);
    // Example: const response = await axios.post('/api/users/login', { email, password });
    // localStorage.setItem('token', response.data.token);
    // setUser(response.data.user);
    // setIsAuthenticated(true);
    localStorage.setItem('token', 'fake_token'); // Example
    const loggedInUser = { name: "Placeholder User", role: "user", _id: "placeholder_id" }; // Example user
    setUser(loggedInUser);
    console.log('[AuthContext] User state updated (login):', loggedInUser);
    setIsAuthenticated(true);
  };

  // Placeholder logout function
  const logout = () => {
    console.log("Placeholder: Logging out");
    localStorage.removeItem('token');
    setUser(null);
    console.log('[AuthContext] User state updated (logout):', null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading, // Provide loading state
    login,
    logout,
  };

  console.log('[AuthContext] Providing user value:', user);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};