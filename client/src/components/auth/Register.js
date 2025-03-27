import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../config/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' // Default role
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Debug log to check what role is being sent
    console.log('Submitting registration with role:', formData.role);
    
    try {
      const response = await api.client.post('/api/users/register', formData);
      const data = response.data;
      
      // Debug log to check what role is being received back
      console.log('Registration response received:', data);
      console.log('Role from server:', data.role);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.role); // Store the role
      localStorage.setItem('username', data.username);
      localStorage.setItem('userId', data._id);
      
      // Debug log to check what role is stored in localStorage
      console.log('Role stored in localStorage:', localStorage.getItem('userRole'));
      
      window.dispatchEvent(new Event('auth-change'));
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please check your connection and try again.';
      alert(errorMessage);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ color: 'primary.main' }}>
          Register for DeBetter
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
            error={!!errors.username}
            helperText={errors.username}
            inputProps={{
              'aria-label': 'username'
            }}
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            error={!!errors.email}
            helperText={errors.email}
            inputProps={{
              'aria-label': 'email'
            }}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            error={!!errors.password}
            helperText={errors.password}
            inputProps={{
              'aria-label': 'password'
            }}
          />
          
          {/* Re-add role selection dropdown */}
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              id="role-select"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              inputProps={{
                'aria-label': 'role'
              }}
              MenuProps={{
                "aria-labelledby": "role-label",
                PaperProps: {
                  'aria-label': 'role-menu'
                }
              }}
            >
              <MenuItem value="user" data-testid="role-debater">Debater</MenuItem>
              <MenuItem value="judge" data-testid="role-judge">Judge</MenuItem>
              <MenuItem value="organizer" data-testid="role-organizer">Organizer</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            sx={{ mt: 3, mb: 2 }}
            role="button"
            aria-label="register"
            name="register"
            data-testid="register-submit"
          >
            Register
          </Button>
          <Box textAlign="center">
            <Link to="/login" style={{ color: 'primary.main' }}>
              Already have an account? Login
            </Link>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;