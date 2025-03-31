import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'; // Assuming axios might be used later

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Start loading until auth check is done

  // Placeholder: Check authentication status on load (e.g., check token)
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Placeholder: Validate token with backend - replace with actual API call
        try {
          // Example: const response = await axios.get('/api/users/me', { headers: { 'x-auth-token': token } });
          // setUser(response.data);
          // setIsAuthenticated(true);
          console.log("Placeholder: Token found, assuming authenticated for now.");
          setUser({ name: "Placeholder User", role: "user", _id: "placeholder_id" }); // Example user
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Placeholder: Token validation failed", error);
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false); // Finished loading
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
    setUser({ name: "Placeholder User", role: "user", _id: "placeholder_id" }); // Example user
    setIsAuthenticated(true);
  };

  // Placeholder logout function
  const logout = () => {
    console.log("Placeholder: Logging out");
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading, // Provide loading state
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};