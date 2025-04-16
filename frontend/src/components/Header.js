import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LanguageMenu from './LanguageMenu';
import Notifications from '../pages/Notifications';

const Header = ({ user, notifications, onLogout, onToggleDrawer, onMarkNotificationAsRead }) => {
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleLanguageMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleLanguageMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={onToggleDrawer}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Button color="inherit" onClick={handleLanguageMenuOpen}>
                        {t('language')}
                    </Button>
                    <LanguageMenu
                        anchorEl={anchorEl}
                        onClose={handleLanguageMenuClose}
                    />
                    {user && (
                        <Notifications
                            notifications={notifications}
                            onMarkAsRead={onMarkNotificationAsRead}
                        />
                    )}
                    {user ? (
                        <Button color="inherit" onClick={onLogout}>
                            {t('logout')}
                        </Button>
                    ) : (
                        <>
                            <Button color="inherit" component={Link} to="/register">
                                {t('register')}
                            </Button>
                            <Button color="inherit" component={Link} to="/login">
                                {t('login')}
                            </Button>
                        </>
                    )}
                </Box>
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                    <Typography variant="h6">
                        {user ? `${t('welcome')}, ${user.name}!` : t('welcome_to_service_portal')}
                    </Typography>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;