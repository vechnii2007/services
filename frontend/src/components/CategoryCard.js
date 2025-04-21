import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardMedia, CardContent, Typography } from "@mui/material";
import { CATEGORY_IMAGE_HEIGHT } from "../config";
import PropTypes from "prop-types";
import { motion } from "framer-motion";

const CategoryCard = ({ category, selected, onClick }) => {
  const { t } = useTranslation();

  return (
    <Card
      onClick={() => onClick(category.name)}
      sx={{
        cursor: "pointer",
        backgroundColor: selected ? "#e0e0e0" : "inherit",
        width: "150px", // Фиксированная ширина для слайдера
        margin: "0 auto", // Центрирование в слайде
      }}
    >
      <CardMedia
        component="img"
        height={CATEGORY_IMAGE_HEIGHT}
        image={category.image || "https://placehold.co/150x150?text=Category"}
        alt={category.label}
        onError={(e) => {
          e.target.onerror = null; // Prevent looping
          e.target.src = `https://placehold.co/150x150?text=${t(
            category.name
          )}`;
        }}
      />
      <CardContent sx={{ padding: 1 }}>
        <Typography variant="body2" align="center">
          {t(category.name)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
