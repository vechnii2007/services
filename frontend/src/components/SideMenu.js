import React, { useMemo } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  ListItemIcon,
  Typography,
  Box,
  Collapse,
  alpha,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { styled } from "@mui/material/styles";
import { menuConfig } from "../config/menuConfig";
import { motion, AnimatePresence } from "framer-motion";

const StyledListItem = styled(ListItem)(({ theme, active }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: "4px 8px",
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
  ...(active && {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.16),
    },
  }),
}));

const GroupTitle = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  color: theme.palette.text.secondary,
  fontSize: "0.875rem",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
}));

const MotionList = styled(motion.div)({
  overflow: "hidden",
});

const MotionListItem = motion(StyledListItem);

const SideMenu = ({ open, onClose, user }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = useMemo(() => {
    const items = [...menuConfig.public];

    if (user) {
      items.push(...menuConfig.authenticated);

      const roleItems = menuConfig.roleSpecific[user.role];
      if (roleItems) {
        items.push(...roleItems.flatMap((group) => group.items));
      }
    } else {
      items.push(...menuConfig.unauthorized);
    }

    return items;
  }, [user]);

  const renderMenuItem = (item, index) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <MotionListItem
        key={item.id}
        button
        component={Link}
        to={item.path}
        onClick={onClose}
        active={isActive ? 1 : 0}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
      >
        <ListItemIcon>
          <Icon color={isActive ? "primary" : "inherit"} />
        </ListItemIcon>
        <ListItemText
          primary={t(item.label)}
          primaryTypographyProps={{
            color: isActive ? "primary" : "inherit",
            fontWeight: isActive ? 500 : 400,
          }}
        />
      </MotionListItem>
    );
  };

  const renderGroup = (group, items, groupIndex) => (
    <MotionList
      key={group}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
    >
      <GroupTitle>{t(group)}</GroupTitle>
      {items.map((item, index) => renderMenuItem(item, index))}
      <Divider sx={{ my: 1 }} />
    </MotionList>
  );

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 280,
          backgroundColor: (theme) => theme.palette.background.default,
        },
      }}
    >
      <Box sx={{ overflow: "auto", py: 2 }}>
        <AnimatePresence>
          {/* Публичные пункты меню */}
          <MotionList
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <List>
              {menuConfig.public.map((item, index) =>
                renderMenuItem(item, index)
              )}
            </List>
            <Divider />
          </MotionList>

          {user ? (
            <>
              {/* Общие пункты для авторизованных пользователей */}
              <MotionList
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <List>
                  {menuConfig.authenticated.map((item, index) =>
                    renderMenuItem(item, index)
                  )}
                </List>
                <Divider />
              </MotionList>

              {/* Пункты меню для конкретной роли */}
              {menuConfig.roleSpecific[user.role]?.map(
                ({ group, items }, groupIndex) => (
                  <List key={group} dense>
                    {renderGroup(group, items, groupIndex)}
                  </List>
                )
              )}
            </>
          ) : (
            /* Пункты меню для неавторизованных пользователей */
            <MotionList
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <List>
                {menuConfig.unauthorized.map((item, index) =>
                  renderMenuItem(item, index)
                )}
              </List>
            </MotionList>
          )}
        </AnimatePresence>
      </Box>
    </Drawer>
  );
};

export default SideMenu;
