import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, MenuItem, Typography, Badge, IconButton } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from '../utils/axiosConfig';
import { Link } from 'react-router-dom';

const Notifications = ({ notifications, onMarkAsRead }) => {
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            await onMarkAsRead(notification._id);
        }
        handleMenuClose();
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <>
            <IconButton color="inherit" onClick={handleMenuOpen}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <MenuItem
                            key={notification._id}
                            component={Link}
                            to={`/chat/${notification.relatedId}`}
                            onClick={() => handleNotificationClick(notification)}
                            sx={{
                                backgroundColor: notification.read ? 'inherit' : '#f0f0f0',
                            }}
                        >
                            <Typography variant="body2">
                                {notification.message}
                            </Typography>
                        </MenuItem>
                    ))
                ) : (
                    <MenuItem>
                        <Typography variant="body2">{t('no_notifications')}</Typography>
                    </MenuItem>
                )}
            </Menu>
        </>
    );
};

export default Notifications;