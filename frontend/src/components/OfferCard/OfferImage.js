import React from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import { styled } from "@mui/material/styles";
import { formatImagePath } from "../../utils/formatters";

const ImageWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  height: 200,
  overflow: "hidden",
  borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(180deg, 
      rgba(0,0,0,0) 0%, 
      rgba(0,0,0,0.02) 50%, 
      rgba(0,0,0,0.1) 100%
    )`,
    opacity: 0,
    transition: theme.transitions.create("opacity", {
      duration: theme.transitions.duration.standard,
    }),
  },
  "&:hover": {
    "&::after": {
      opacity: 1,
    },
    "& img": {
      transform: "scale(1.05)",
    },
  },
}));

const Image = styled("img")(({ theme }) => ({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.standard,
  }),
}));

/**
 * Компонент для отображения изображения предложения
 * @param {Object} props - Свойства компонента
 * @param {string} props.image - Устаревшее поле с одиночным изображением
 * @param {Array} props.images - Массив изображений
 * @param {string} props.title - Заголовок предложения
 */
const OfferImage = ({ image, images, title }) => {
  let imageToShow = image;
  if (Array.isArray(images) && images.length > 0) {
    if (typeof images[0] === "string") {
      imageToShow = images[0];
    } else if (typeof images[0] === "object" && images[0] !== null) {
      imageToShow = images[0].url || images[0].path || images[0].image || image;
    }
  }

  // Если путь абсолютный — используем как есть, если просто имя файла — добавляем /uploads/images/
  let src = imageToShow;
  if (
    src &&
    !src.startsWith("http://") &&
    !src.startsWith("https://") &&
    !src.startsWith("/uploads/")
  ) {
    src = `/uploads/images/${src}`;
  }

  return (
    <ImageWrapper
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Image
        src={
          src ||
          `https://placehold.co/600x400?text=${encodeURIComponent(
            "Нет изображения"
          )}`
        }
        alt={title}
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://placehold.co/600x400?text=${encodeURIComponent(
            "Ошибка загрузки"
          )}`;
        }}
      />
    </ImageWrapper>
  );
};

OfferImage.propTypes = {
  image: PropTypes.string,
  images: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string.isRequired,
};

export default OfferImage;
