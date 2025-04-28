import React from "react";
import { useTranslation } from "react-i18next";
import { Card, Typography, Box, Tooltip } from "@mui/material";
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

const CategoryCount = styled(Typography)(({ theme }) => ({
  fontSize: "0.875rem",
  opacity: 0.9,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  display: "inline-block",
  marginTop: theme.spacing(0.5),
}));

const CounterMotion = styled(motion.div)({
  display: "inline-block",
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
        <CategoryContent>
          <CategoryTitle variant="h6">{t(category.name)}</CategoryTitle>
          <CounterMotion
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <CategoryCount>
              {count} {t("offers")}
            </CategoryCount>
          </CounterMotion>
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
