import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  ListItemIcon,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { menuItems } from "./menuConfig";

const SideMenu = ({ open, onClose, onLanguage, onLogout }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const handleItemClick = (item) => {
    if (item.isLogout) {
      (onLogout || logout)();
      onClose();
      return;
    }
    if (item.isLanguage && onLanguage) {
      onLanguage();
      onClose();
      return;
    }
    onClose();
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <List sx={{ width: 250, marginTop: 8 }}>
        {menuItems
          .filter((item) => item.show(user))
          .map((item) => (
            <ListItem
              button
              key={item.key}
              component={item.path ? Link : undefined}
              to={item.path || undefined}
              onClick={() => handleItemClick(item)}
            >
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              <ListItemText primary={t(item.label)} />
            </ListItem>
          ))}
      </List>
      <Divider />
    </Drawer>
  );
};

export default SideMenu;
