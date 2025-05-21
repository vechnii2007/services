import React, { useMemo } from "react";
import { Breadcrumbs, Link, Typography, Box, useTheme } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HomeIcon from "@mui/icons-material/Home";

// Маппинг для красивых названий путей (можно расширять)
const pathNameMap = {
  "my-offers": "Мои предложения",
  offers: "Все предложения",
  favorites: "Избранное",
  "chat-list": "Чаты",
  "create-offer": "Создать предложение",
  "my-requests": "Мои запросы",
  profile: "Профиль",
  admin: "Админка",
  notifications: "Уведомления",
  categories: "Категории",
  requests: "Запросы",
  login: "Вход",
  register: "Регистрация",
  // ... добавляй по мере необходимости
};

/**
 * items: [
 *   { label: 'Главная', to: '/', icon?: <Icon/> },
 *   { label: 'Категории', to: '/categories' },
 *   { label: (params) => 'Категория: ' + params.categoryName, to: '/categories/:id' },
 * ]
 * Если items не передан — строит крошки по location.pathname
 */
const UniversalBreadcrumbs = ({ items, sx, separator = "/" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();

  // Автоматическая генерация крошек по location.pathname
  const autoItems = useMemo(() => {
    const pathnames = location.pathname.split("/").filter(Boolean);
    // Если только /offers — показываем только один элемент
    if (location.pathname === "/offers" || location.pathname === "/offers/") {
      return [
        {
          label: pathNameMap["offers"] || t("offers") || "Все предложения",
          to: "/offers",
          icon: <HomeIcon fontSize="small" />,
        },
      ];
    }
    let acc = "";
    return [
      {
        label: pathNameMap["offers"] || t("offers") || "Все предложения",
        to: "/offers",
        icon: <HomeIcon fontSize="small" />,
      },
      ...pathnames.map((part, idx) => {
        acc += "/" + part;
        // Используем маппинг или i18n, иначе raw
        const label = pathNameMap[part] || t(part) || part;
        return {
          label,
          to: acc,
        };
      }),
    ];
  }, [location.pathname, t]);

  const crumbs = items && items.length ? items : autoItems;

  return (
    <Breadcrumbs
      aria-label="breadcrumb"
      sx={{
        fontSize: { xs: 16, sm: 18 },
        color: theme.palette.text.primary,
        mb: 2,
        background: theme.palette.background.paper,
        px: 2,
        py: 1,
        borderRadius: 2,
        boxShadow: 1,
        ...sx,
      }}
      separator={separator}
    >
      {crumbs.map((item, idx) => {
        const isLast = idx === crumbs.length - 1;
        const label =
          typeof item.label === "function" ? item.label() : item.label;
        return isLast ? (
          <Box
            key={item.to || idx}
            sx={{ display: "flex", alignItems: "center", fontWeight: 600 }}
          >
            {item.icon && <Box sx={{ mr: 0.5 }}>{item.icon}</Box>}
            <Typography color="text.primary" sx={{ fontWeight: 600 }}>
              {label}
            </Typography>
          </Box>
        ) : (
          <Link
            key={item.to || idx}
            color="inherit"
            underline="hover"
            onClick={() => navigate(item.to)}
            sx={{
              display: "flex",
              alignItems: "center",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {item.icon && <Box sx={{ mr: 0.5 }}>{item.icon}</Box>}
            {label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default UniversalBreadcrumbs;
