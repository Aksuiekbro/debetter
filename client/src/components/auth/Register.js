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
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { api } from '../../config/api';

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(); // Initialize useTranslation
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user', // Default role
    judgeRole: 'Judge' // Default judge role, only relevant if role is 'judge'
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
    if (!formData.username) newErrors.username = t('register.validationError.usernameRequired', 'Username is required');
    if (!formData.email) newErrors.email = t('register.validationError.emailRequired', 'Email is required');
    if (!formData.password) newErrors.password = t('register.validationError.passwordRequired', 'Password is required');
    // Add validation for judgeRole if role is judge
    if (formData.role === 'judge' && !formData.judgeRole) {
      newErrors.judgeRole = t('register.validationError.judgeRoleRequired', 'Judge Role is required when role is Judge');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Debug log to check what role is being sent
    console.log('Submitting registration with role:', formData.role);
    
    try {
      // Prepare payload, conditionally adding judgeRole
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };
      if (formData.role === 'judge') {
        payload.judgeRole = formData.judgeRole;
      }

      const response = await api.client.post('/api/users/register', payload);
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
      navigate('/home');
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || t('register.genericError', 'Registration failed. Please check your connection and try again.');
      alert(errorMessage);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ color: 'primary.main' }}>
          {t('register.title', 'Register for DeBetter')}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t('register.usernameLabel', 'Username')}
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
            label={t('register.emailLabel', 'Email')}
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
            label={t('register.passwordLabel', 'Password')}
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
            <InputLabel id="role-label">{t('register.roleLabel', 'Role')}</InputLabel>
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
              <MenuItem value="user" data-testid="role-debater">{t('register.roleDebater', 'Debater')}</MenuItem>
              <MenuItem value="judge" data-testid="role-judge">{t('register.roleJudge', 'Judge')}</MenuItem>
              <MenuItem value="organizer" data-testid="role-organizer">{t('register.roleOrganizer', 'Organizer')}</MenuItem>
            </Select>
          </FormControl>

          {/* Conditionally render Judge Role dropdown */}
          {formData.role === 'judge' && (
            <FormControl fullWidth margin="normal" error={!!errors.judgeRole}>
              <InputLabel id="judge-role-label">{t('register.judgeRoleLabel', 'Judge Role')}</InputLabel>
              <Select
                labelId="judge-role-label"
                id="judge-role-select"
                name="judgeRole"
                value={formData.judgeRole}
                onChange={handleChange}
                required={formData.role === 'judge'} // Required only if role is judge
                inputProps={{
                  'aria-label': 'judge-role'
                }}
                MenuProps={{
                  "aria-labelledby": "judge-role-label",
                  PaperProps: {
                    'aria-label': 'judge-role-menu'
                  }
                }}
              >
                <MenuItem value="Judge">{t('register.judgeRoleJudge', 'Judge')}</MenuItem>
                <MenuItem value="Head Judge">{t('register.judgeRoleHead', 'Head Judge')}</MenuItem>
                <MenuItem value="Assistant Judge">{t('register.judgeRoleAssistant', 'Assistant Judge')}</MenuItem>
              </Select>
              {errors.judgeRole && <Typography color="error" variant="caption">{errors.judgeRole}</Typography>}
            </FormControl>
          )}
          
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
            {t('register.submitButton', 'Register')}
          </Button>
          <Box textAlign="center">
            <Link to="/login" style={{ color: 'primary.main' }}>
              {t('register.loginLink', 'Already have an account? Login')}
            </Link>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;