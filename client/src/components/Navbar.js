import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  InputBase,
  Box,
  alpha,
  styled,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './ui/LanguageSwitcher'; // Import the new component
import NotificationCenter from './NotificationCenter'; // Import NotificationCenter

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  marginRight: theme.spacing(2),
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}));

const Navbar = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [anchorEl, setAnchorEl] = useState(null);
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };
    
    window.addEventListener('auth-change', checkAuth);
    window.addEventListener('storage', checkAuth);
    checkAuth(); // Check on mount
    
    return () => {
      window.removeEventListener('auth-change', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);
  
  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };


  const handleClose = () => {
    setAnchorEl(null);
  };


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('userId'); // Add this line
    window.dispatchEvent(new Event('auth-change'));
    handleClose();
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: 'primary.main' }}>
      <Toolbar>
        {/* Left side */}
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
          <Button 
            color="inherit" 
            onClick={() => navigate('/home')}
            sx={{ fontWeight: 'bold' }}
          >
            {t('navbar.home')} {/* Assuming DeBetter is the home/brand */}
          </Button>
          <Button 
            color="inherit"
            onClick={() => navigate('/host-debate')}
          >
            {t('navbar.host_debate', 'Host a Debate')} {/* Added default value */}
          </Button>
          <Button 
            color="inherit"
            onClick={() => navigate('/debates')}
          >
            {t('navbar.join_debate', 'Join a Debate')} {/* Added default value */}
          </Button>
          {isAuthenticated && (
            <>
              {/* Temporarily commented out per user request
              <Button
                color="inherit"
                onClick={() => navigate('/my-debates')}
              >
                My Debates
              </Button>
              */}
              <Button
                color="inherit"
                onClick={() => navigate('/tournaments')}
              >
                {t('navbar.tournaments')}
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/create-tournament')}
                data-testid="create-tournament-nav-button" // Add test ID
              >
                {t('navbar.create_tournament', 'Create Tournament')}
              </Button>
              { (userRole === 'judge' || userRole === 'admin') && (
                <Button
                  color="inherit"
                  onClick={() => navigate('/judge-panel')}
                >
                  {t('navbar.judge_panel', 'Judge Panel')} {/* Added translation key */}
                </Button>
              )}
            </>
          )}
        </Box>

        {/* Language Switcher Component */}
        <Box sx={{ marginRight: 2 }}> {/* Keep margin for spacing */}
          <LanguageSwitcher />
        </Box>

        {/* Right side */}
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder={t('navbar.search_placeholder', 'Search debates...')}
            inputProps={{ 'aria-label': 'search' }}
          />
        </Search>

        {/* Auth section */}
        {!isAuthenticated ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              color="inherit"
              onClick={() => navigate('/login')}
            >
              {t('navbar.login')}
            </Button>
            <Button 
              variant="outlined" 
              color="inherit"
              onClick={() => navigate('/register')}
              sx={{ 
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {t('navbar.register')}
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Notification Center Component */}
            <NotificationCenter />

            {/* User Avatar */}
            <IconButton 
              onClick={handleProfileClick}
              sx={{ p: 0 }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: 'secondary.main',
                  border: '2px solid white'
                }}
              >
                {localStorage.getItem('username')?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => {
                handleClose();
                navigate('/profile');
              }}>
                {t('navbar.profile')}
              </MenuItem>
              <MenuItem onClick={() => {
                handleClose();
                navigate('/my-debates');
              }}>
                {t('navbar.my_debates')}
             </MenuItem>
             <MenuItem onClick={() => {
               handleClose();
               navigate('/settings/notifications');
             }}>
               {t('navbar.notification_settings', 'Notification Settings')}
             </MenuItem>
             <Divider />
              <MenuItem onClick={handleLogout}>
                {t('navbar.logout')}
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;