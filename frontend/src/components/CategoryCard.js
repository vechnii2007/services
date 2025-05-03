import React from "react";
import { useTranslation } from "react-i18next";
import { Card, Typography, Box, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

const CategoryCardWrapper = styled(Card)(({ theme }) => ({
  position: "relative",
  width: 110,
  height: 110,
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
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  cursor: "pointer",
  transition: "transform 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
  },
}));

const CategoryImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

const CategoryContent = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(1.5, 1),
  background:
    "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.85) 100%)",
  color: theme.palette.common.white,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(0.5),
}));

const CategoryCountBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 8,
  right: 8,
  zIndex: 2,
  background: theme.palette.primary.main,
  color: theme.palette.common.white,
  borderRadius: "50%",
  minWidth: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 15,
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
}));

const CategoryTitleBar = styled(Box)(({ theme }) => ({
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.78)",
  padding: theme.spacing(1, 1.5),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderBottomLeftRadius: theme.shape.borderRadius,
  borderBottomRightRadius: theme.shape.borderRadius,
}));

const CategoryTitle = styled(Typography)({
  fontWeight: 700,
  fontSize: 17,
  color: "#fff",
  textAlign: "center",
  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
  lineHeight: 1.1,
  width: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const CategoryCard = ({ category, selected, onClick, count = 0 }) => {
  const { t } = useTranslation();

  const getFallbackImageUrl = (categoryName) =>
    `https://placehold.co/300x180/e0e0e0/808080?text=${encodeURIComponent(
      t(categoryName)
    )}`;

  const imageUrl =
    category.image && category.image.startsWith("http")
      ? category.image
      : category.image && category.image.startsWith("/")
      ? `${process.env.REACT_APP_API_URL || "http://localhost:5001"}${
          category.image
        }`
      : getFallbackImageUrl(category.name);

  return (
    <Tooltip title={t(category.description || "")} enterDelay={700}>
      <CategoryCardWrapper onClick={onClick}>
        <CategoryImage
          src={imageUrl}
          alt={category.label || t(category.name)}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getFallbackImageUrl(category.name);
          }}
        />
        <CategoryCountBadge>{count}</CategoryCountBadge>
        <CategoryTitleBar>
          <CategoryTitle variant="subtitle1">
            {t(category.label || category.name)}
          </CategoryTitle>
        </CategoryTitleBar>
      </CategoryCardWrapper>
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
