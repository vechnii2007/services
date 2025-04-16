import React from 'react';
import { Drawer, Box, List, ListItem, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { menuConfig } from '../utils/menuConfig';
import { DRAWER_WIDTH } from '../utils/constants';

const SideMenu = ({ open, onClose, user }) => {
    const { t } = useTranslation();
    const menuItems = menuConfig(user, t);

    return (
        <Drawer anchor="left" open={open} onClose={onClose}>
            <Box sx={{ width: DRAWER_WIDTH }} role="presentation" onClick={onClose} onKeyDown={onClose}>
                <List>
                    {menuItems.map((item, index) => (
                        <ListItem button key={index} component={Link} to={item.path}>
                            <ListItemText primary={item.label} />
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Drawer>
    );
};

export default SideMenu;