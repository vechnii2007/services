import React from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

const badgeStyles = {
  new: {
    background: "linear-gradient(135deg, #00C853 0%, #69F0AE 100%)",
    color: "#FFFFFF",
  },
  popular: {
    background: "linear-gradient(135deg, #FF6D00 0%, #FFC400 100%)",
    color: "#FFFFFF",
  },
  sale: {
    background: "linear-gradient(135deg, #D50000 0%, #FF1744 100%)",
    color: "#FFFFFF",
  },
};

const OfferBadge = ({ type }) => {
  if (!type || !badgeStyles[type]) return null;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        position: "absolute",
        left: 16,
        top: 16,
        zIndex: 2,
        borderRadius: "16px",
        padding: "4px 12px",
        ...badgeStyles[type],
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontSize: "0.75rem",
        }}
      >
        {type}
      </Typography>
    </Box>
  );
};

OfferBadge.propTypes = {
  type: PropTypes.oneOf(["new", "popular", "sale"]),
};

export default OfferBadge;
