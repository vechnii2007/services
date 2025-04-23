import React from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

const CategoryCardWrapper = styled(Card)(({ theme }) => ({
  position: "relative",
  width: 280,
  height: 180,
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
  padding: theme.spacing(2),
  background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)",
  color: theme.palette.common.white,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

const CategoryTitle = styled(Typography)({
  fontWeight: 600,
  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
});

const CategoryCount = styled(Typography)({
  fontSize: "0.875rem",
  opacity: 0.9,
});

const CategoryCard = ({ category, selected, onClick, count = 0 }) => {
  const { t } = useTranslation();

  console.log("[CategoryCard] Rendering:", {
    categoryName: category.name,
    selected,
    count,
    hasImage: !!category.image,
    hasDescription: !!category.description,
  });

  const handleClick = (event) => {
    console.log("[CategoryCard] Clicked:", {
      categoryName: category.name,
      wasSelected: selected,
      count,
      clickEvent: {
        type: event.type,
        target: event.target.tagName,
        currentTarget: event.currentTarget.tagName,
      },
    });

    onClick(event);
  };

  const handleImageError = (e) => {
    console.log("[CategoryCard] Image load error:", {
      categoryName: category.name,
      originalSrc: e.target.src,
    });

    e.target.onerror = null;
    const fallbackSrc = `https://placehold.co/300x300?text=${t(category.name)}`;
    console.log("[CategoryCard] Using fallback image:", fallbackSrc);
    e.target.src = fallbackSrc;
  };

  return (
    <Tooltip title={t(category.description || "")} enterDelay={700}>
      <CategoryCardWrapper onClick={handleClick}>
        <CategoryImage
          src={
            category.image ||
            `https://placehold.co/300x300?text=${t(category.name)}`
          }
          alt={category.label}
          onError={handleImageError}
        />
        <CategoryContent>
          <CategoryTitle variant="h6">{t(category.name)}</CategoryTitle>
          {count > 0 && (
            <CategoryCount>
              {count} {t("offers")}
            </CategoryCount>
          )}
        </CategoryContent>
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
