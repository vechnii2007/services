import React from 'react';
import { Drawer, List, ListItem, ListItemText, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SideMenu = ({ open, onClose, user }) => {
    const { t } = useTranslation();

    return (
        <Drawer anchor="left" open={open} onClose={onClose}>
            <List sx={{ width: 250 }}>
                <ListItem button component={Link} to="/" onClick={onClose}>
                    <ListItemText primary={t('home')} />
                </ListItem>
                {user && (
                    <>
                        <ListItem button component={Link} to="/profile" onClick={onClose}>
                            <ListItemText primary={t('profile')} />
                        </ListItem>
                        <ListItem button component={Link} to="/offers" onClick={onClose}>
                            <ListItemText primary={t('offers')} />
                        </ListItem>
                        {(user.role === 'user' || user.role === 'provider') && (
                            <>
                                <ListItem button component={Link} to="/chat-list" onClick={onClose}>
                                    <ListItemText primary={t('chat_list')} />
                                </ListItem>
                                <ListItem button component={Link} to="/favorites" onClick={onClose}>
                                    <ListItemText primary={t('favorites')} />
                                </ListItem>
                                <ListItem button component={Link} to="/payment-dashboard" onClick={onClose}>
                                    <ListItemText primary={t('payment_dashboard')} />
                                </ListItem>
                            </>
                        )}
                        {user.role === 'user' && (
                            <>
                                <ListItem button component={Link} to="/create-request" onClick={onClose}>
                                    <ListItemText primary={t('create_request')} />
                                </ListItem>
                                <ListItem button component={Link} to="/my-requests" onClick={onClose}>
                                    <ListItemText primary={t('my_requests')} />
                                </ListItem>
                            </>
                        )}
                        {(user.role === 'provider' || user.role === 'admin') && (
                            <>
                                <ListItem button component={Link} to="/create-offer" onClick={onClose}>
                                    <ListItemText primary={t('create_offer')} />
                                </ListItem>
                                <ListItem button component={Link} to="/my-offers" onClick={onClose}>
                                    <ListItemText primary={t('my_offers')} />
                                </ListItem>
                            </>
                        )}
                        {user.role === 'provider' && (
                            <ListItem button component={Link} to="/provider-requests" onClick={onClose}>
                                <ListItemText primary={t('provider_requests')} />
                            </ListItem>
                        )}
                        {user.role === 'admin' && (
                            <ListItem button component={Link} to="/admin" onClick={onClose}>
                                <ListItemText primary={t('admin_panel')} />
                            </ListItem>
                        )}
                    </>
                )}
                {!user && (
                    <>
                        <ListItem button component={Link} to="/login" onClick={onClose}>
                            <ListItemText primary={t('login')} />
                        </ListItem>
                        <ListItem button component={Link} to="/register" onClick={onClose}>
                            <ListItemText primary={t('register')} />
                        </ListItem>
                    </>
                )}
            </List>
            <Divider />
        </Drawer>
    );
};

export default SideMenu;