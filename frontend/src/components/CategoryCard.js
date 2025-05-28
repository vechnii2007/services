import React from "react";
import { useTranslation } from "react-i18next";
import { Card, Typography, Box, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import PropTypes from "prop-types";

// Карточка категории для десктопа
const CategoryCardWrapper = styled(Card)(({ theme, selected }) => ({
  position: "relative",
  width: 110,
  height: 110,
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  cursor: "pointer",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  background: theme.palette.background.paper,
  boxShadow: selected
    ? theme.palette.mode === "dark"
      ? "0 2px 8px rgba(0,0,0,0.7)"
      : "0 2px 8px rgba(0,0,0,1)"
    : theme.palette.mode === "dark"
    ? "0 1.5px 4px rgba(0,0,0,0.32)"
    : "0 1px 3px rgba(0,0,0,0.1)",
  top: selected ? -5 : 0,
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 6px 14px rgba(0,0,0,0.32)"
        : "0 6px 14px rgba(0,0,0,0.15)",
  },
  [theme.breakpoints.up("sm")]: {
    width: 140,
    height: 120,
  },
  [theme.breakpoints.up("md")]: {
    width: 180,
    height: 140,
  },
  [theme.breakpoints.up("lg")]: {
    width: 220,
    height: 160,
  },
  [theme.breakpoints.up("xl")]: {
    width: 280,
    height: 180,
  },
  // Скрываем на мобильных устройствах
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}));

// Компактная карточка для мобильных устройств
const MobileCategoryCard = styled(Card)(({ theme, selected }) => ({
  // Показываем только на мобильных
  display: "none",
  width: 80,
  height: 95,
  borderRadius: theme.shape.borderRadius,
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  boxShadow: selected ? `0 2px 8px rgba(0,0,0,1)` : "0 1px 3px rgba(0,0,0,0.1)",
  overflow: "hidden",
  position: "relative",
  top: selected ? -5 : 0,
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
  },
  [theme.breakpoints.down("sm")]: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
}));

const MobileImageWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "100%",
  overflow: "hidden",
  position: "relative",
  backgroundColor: theme.palette.grey[100],
}));

const MobileImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "contain",
});

const MobileCountBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 4,
  right: 4,
  zIndex: 2,
  background: theme.palette.primary.main,
  color: theme.palette.common.white,
  borderRadius: "50%",
  minWidth: 18,
  height: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 10,
  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
}));

const CategoryImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "contain",
});

const CategoryCountBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 8,
  right: 8,
  zIndex: 2,
  background: theme.palette.primary.main,
  color: theme.palette.common.white,
  borderRadius: "50%",
  minWidth: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 13,
  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
}));

const CategoryTitleBar = styled(Box)(({ theme }) => ({
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.68)",
  padding: theme.spacing(1, 1.5),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderBottomLeftRadius: theme.shape.borderRadius,
  borderBottomRightRadius: theme.shape.borderRadius,
  backdropFilter: "blur(5px)",
}));

const CategoryTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: 17,
  color: "#fff",
  textAlign: "center",
  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
  lineHeight: 1.1,
  width: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  [theme.breakpoints.down("sm")]: {
    fontSize: 10,
  },
}));

export const getCategoryName = (category, lang = "ru") => {
  if (!category?.name) return "";
  return (
    category.name[lang] ||
    category.name["ru"] ||
    category.name["uk"] ||
    category.name["es"] ||
    Object.values(category.name)[0] ||
    ""
  );
};

const CategoryCard = ({ category, selected, onClick, count = 0 }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "ru";

  const getFallbackImageUrl = (categoryName) =>
    `https://placehold.co/300x180/e0e0e0/808080?text=${encodeURIComponent(
      t(categoryName)
    )}`;

  const imageUrl =
    category.image && category.image.startsWith("http")
      ? category.image
      : category.image && category.image.startsWith("/")
      ? `${process.env.REACT_APP_API_URL}${category.image}`
      : getFallbackImageUrl(getCategoryName(category, lang));

  return (
    <Tooltip title={t(category.description || "")} enterDelay={700}>
      <>
        {/* Карточка для десктопа */}
        <CategoryCardWrapper selected={selected} onClick={onClick}>
          <CategoryImage
            src={imageUrl}
            alt={getCategoryName(category, lang)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = getFallbackImageUrl(
                getCategoryName(category, lang)
              );
            }}
          />
          <CategoryCountBadge>{count}</CategoryCountBadge>
          <CategoryTitleBar>
            <CategoryTitle variant="subtitle1">
              {getCategoryName(category, lang)}
            </CategoryTitle>
          </CategoryTitleBar>
        </CategoryCardWrapper>

        {/* Компактная карточка для мобильных устройств */}
        <MobileCategoryCard selected={selected} onClick={onClick}>
          <MobileImageWrapper>
            <MobileImage
              src={imageUrl}
              alt={getCategoryName(category, lang)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getFallbackImageUrl(
                  getCategoryName(category, lang)
                );
              }}
            />
            <MobileCountBadge>{count}</MobileCountBadge>
          </MobileImageWrapper>
          <CategoryTitleBar>
            <CategoryTitle variant="subtitle1">
              {getCategoryName(category, lang)}
            </CategoryTitle>
          </CategoryTitleBar>{" "}
        </MobileCategoryCard>
      </>
    </Tooltip>
  );
};

CategoryCard.propTypes = {
  category: PropTypes.shape({
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    image: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  selected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  count: PropTypes.number,
};

CategoryCard.defaultProps = {
  selected: false,
  count: 0,
};

export default CategoryCard;
