import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../config/api';

const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Use the API client instead of fetch for consistency
      const response = await api.client.post('/api/users/login', formData);
      const data = response.data;
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.role); // Store the role
      localStorage.setItem('username', data.username);
      localStorage.setItem('userId', data._id);
      window.dispatchEvent(new Event('auth-change'));
      navigate('/home');
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || t('login.genericError', 'Login failed. Please check your connection and try again.');
      setError(errorMessage);
    }
  };
  
  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ color: 'primary.main' }}>
          {t('login.title', 'Login to DeBetter')}
        </Typography>
        {error && (
          <Typography color="error" align="center" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t('login.emailLabel', 'Email')}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{
              'aria-label': 'email', 'data-testid': 'login-email-input'
            }}
          />
          <TextField
            fullWidth
            label={t('login.passwordLabel', 'Password')}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{
              'aria-label': 'password', 'data-testid': 'login-password-input'
            }}
          />
          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            sx={{ mt: 3, mb: 2 }}
            data-testid="login-submit"
          >
            {t('login.submitButton', 'Login')}
          </Button>
          <Box textAlign="center">
            <Link to="/register" style={{ color: 'primary.main' }}>
              {t('login.registerLink', "Don't have an account? Register")}
            </Link>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;