import React, { useState } from 'react';
import {
    List,
    ListItem,
    ListItemText,
    Typography,
    IconButton,
    Divider,
    Badge,
    Menu,
    MenuItem,
    CircularProgress,
    Alert,
    ListItemIcon,
    Box
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import CheckIcon from '@mui/icons-material/Check';
import { useSocket } from '../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

const NotificationCenter = () => {
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState(null);
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        loadingInitialNotifications // Assuming this state exists or will be added to SocketContext
    } = useSocket();

    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAsRead = (id) => {
        markAsRead(id);
        // Optional: Add navigation logic if notification has a link
        // handleClose(); // Keep menu open or close based on UX preference
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead();
        handleClose(); // Close menu after marking all as read
    };

    const getRelativeTime = (dateString) => {
        try {
            const date = new Date(dateString);
            // Add locale support if needed: import { enUS, ru, kk } from 'date-fns/locale';
            // const locale = i18n.language === 'en' ? enUS : i18n.language === 'ru' ? ru : kk;
            return formatDistanceToNow(date, { addSuffix: true /*, locale */ });
        } catch (error) {
            console.error("Error formatting date:", error);
            return dateString; // Fallback to original string
        }
    };

    return (
        <>
            <IconButton
                color="inherit"
                aria-label={t('notificationCenter.ariaLabel')}
                aria-controls={open ? 'notifications-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                id="notifications-button" // Added id for better accessibility linking
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Menu
                id="notifications-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'notifications-button',
                }}
                PaperProps={{
                    style: {
                        maxHeight: 400,
                        width: '35ch',
                    },
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1}>
                    <Typography variant="h6" component="div">
                        {t('notificationCenter.title')}
                    </Typography>
                    {/* Corrected Conditional Rendering */}
                    {notifications && notifications.length > 0 && (
                        <MenuItem onClick={handleMarkAllAsRead} dense sx={{ borderRadius: 1, p: 0.5 }}>
                             <ListItemIcon sx={{ minWidth: 'auto', mr: 0.5 }}>
                                <ClearAllIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="caption">{t('notificationCenter.markAllRead')}</Typography>
                        </MenuItem>
                    )}
                </Box>
                <Divider />
                {/* Corrected Conditional Rendering */}
                {loadingInitialNotifications ? (
                    <Box display="flex" justifyContent="center" p={2}>
                        <CircularProgress />
                    </Box>
                ) : notifications && notifications.length > 0 ? (
                    <List dense sx={{ p: 0 }}>
                        {notifications.map((notification) => (
                            <ListItem
                                key={notification._id}
                                // Removed button prop, using sx for hover effects if needed
                                onClick={() => handleMarkAsRead(notification._id)}
                                sx={{
                                    cursor: 'pointer', // Indicate clickable
                                    backgroundColor: notification.read ? 'inherit' : 'action.hover',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    '&:last-child': {
                                        borderBottom: 'none',
                                    },
                                    '&:hover': { // Optional hover effect
                                        backgroundColor: notification.read ? 'action.selected' : 'action.focus',
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={t(`notificationTypes.${notification.type}`, notification.title)} // Use type for translation key, fallback to title
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2" color="text.primary">
                                                {notification.message}
                                            </Typography>
                                            <Typography component="span" variant="caption" display="block" color="text.secondary">
                                                {getRelativeTime(notification.createdAt)}
                                            </Typography>
                                        </>
                                    }
                                />
                                {/* Corrected Conditional Rendering */}
                                {!notification.read && (
                                    <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                                        {/* Using CheckIcon might imply "Marked as Read". Maybe use a different icon or none? */}
                                        {/* For now, keeping CheckIcon as requested, but adding tooltip */}
                                        <CheckIcon fontSize="small" color="primary" titleAccess={t('notificationCenter.markReadTooltip')} />
                                    </ListItemIcon>
                                )}
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Box p={2}>
                        <Alert severity="info" sx={{ width: '100%' }}>{t('notificationCenter.noNotifications')}</Alert>
                    </Box>
                )}
            </Menu>
        </>
    );
};

export default NotificationCenter;