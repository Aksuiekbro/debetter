// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
};

// Helper function to handle unauthorized responses
const handleUnauthorized = (navigate) => {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('username');
  localStorage.removeItem('userId');
  window.dispatchEvent(new Event('auth-change'));
  navigate('/login');
};

export { getAuthHeaders, handleUnauthorized };