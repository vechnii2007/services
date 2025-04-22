import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, Typography, Box } from "@mui/material";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import CategoryIcon from "./CategoryIcon";

const MotionCard = motion(Card);

const CategoryCard = ({ category, selected, onClick, count = 0 }) => {
  const { t } = useTranslation();

  return (
    <MotionCard
      onClick={() => onClick(category.name)}
      component={motion.div}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      sx={{
        cursor: "pointer",
        width: "150px",
        margin: "0 auto",
        borderRadius: "16px",
        position: "relative",
        overflow: "hidden",
        background: selected
          ? "linear-gradient(135deg, #6B8CEF 0%, #5A7BE5 100%)"
          : "linear-gradient(135deg, #FFFFFF 0%, #F5F7FF 100%)",
        border: selected ? "none" : "1px solid #E0E7FF",
        boxShadow: selected
          ? "0 8px 16px rgba(90,123,229,0.2)"
          : "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100%",
          background: selected
            ? "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)"
            : "none",
          zIndex: 1,
        }}
      />

      <CardContent
        sx={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <CategoryIcon
          category={category.name}
          sx={{
            fontSize: 40,
            mb: 1,
            color: selected ? "#FFFFFF" : "#5A7BE5",
          }}
        />

        <Typography
          variant="subtitle2"
          align="center"
          sx={{
            fontWeight: 600,
            color: selected ? "#FFFFFF" : "#2C3E50",
            mb: 0.5,
          }}
        >
          {t(category.name)}
        </Typography>

        <Typography
          variant="caption"
          align="center"
          sx={{
            color: selected ? "rgba(255,255,255,0.8)" : "rgba(44,62,80,0.6)",
          }}
        >
          {count} {t("offers")}
        </Typography>
      </CardContent>
    </MotionCard>
  );
};

CategoryCard.propTypes = {
  category: PropTypes.shape({
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    image: PropTypes.string,
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
