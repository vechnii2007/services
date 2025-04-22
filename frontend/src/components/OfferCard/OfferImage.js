import React from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import { motion } from "framer-motion";

const OfferImage = ({ image, title }) => {
  return (
    <Box
      component={motion.div}
      whileHover={{ scale: 1.05 }}
      sx={{
        position: "relative",
        width: "100%",
        height: "200px",
        overflow: "hidden",
        borderRadius: "16px 16px 0 0",
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "30%",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)",
          pointerEvents: "none",
        },
      }}
    >
      <Box
        component="img"
        src={image || "https://placehold.co/300x200?text=No+Image"}
        alt={title}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src =
            "https://placehold.co/300x200?text=Error+Loading+Image";
        }}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.3s ease-in-out",
        }}
      />
    </Box>
  );
};

OfferImage.propTypes = {
  image: PropTypes.string,
  title: PropTypes.string.isRequired,
};

export default OfferImage;
