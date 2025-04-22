import React from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

const OfferPrice = ({ price, currency = "₽", oldPrice }) => {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        display: "flex",
        alignItems: "flex-end",
        gap: 1,
      }}
    >
      <Typography
        variant="h6"
        component={motion.h6}
        whileHover={{ scale: 1.05 }}
        sx={{
          fontWeight: 700,
          color: "primary.main",
          fontSize: "1.5rem",
          lineHeight: 1,
        }}
      >
        {price.toLocaleString()}
        <Typography
          component="span"
          sx={{
            fontSize: "1rem",
            fontWeight: 500,
            color: "primary.main",
            ml: 0.5,
          }}
        >
          {currency}
        </Typography>
      </Typography>

      {oldPrice && (
        <Typography
          variant="body2"
          sx={{
            textDecoration: "line-through",
            color: "text.secondary",
            fontSize: "0.875rem",
          }}
        >
          {oldPrice.toLocaleString()} {currency}
        </Typography>
      )}
    </Box>
  );
};

OfferPrice.propTypes = {
  price: PropTypes.number.isRequired,
  currency: PropTypes.string,
  oldPrice: PropTypes.number,
};

export default OfferPrice;
