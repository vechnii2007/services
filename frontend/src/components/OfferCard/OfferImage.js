import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { Box, IconButton, Fade } from "@mui/material";
import { motion } from "framer-motion";
import { styled } from "@mui/material/styles";
import { formatImagePath } from "../../utils/formatters";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const ImageWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  height: 220,
  overflow: "hidden",
  borderRadius: `20px 20px 0 0`,
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
      transform: "scale(1.08)",
      filter: "brightness(0.98) saturate(1.08)",
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

const ArrowButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 2,
  background: "rgba(255,255,255,0.7)",
  boxShadow: "0 2px 8px rgba(80,80,120,0.10)",
  "&:hover": {
    background: "rgba(255,255,255,0.95)",
  },
  transition: "background 0.18s",
}));

const Dots = styled(Box)(({ theme }) => ({
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 10,
  display: "flex",
  justifyContent: "center",
  gap: 6,
  zIndex: 2,
}));

const Dot = styled("span")(({ theme, active }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: active ? theme.palette.primary.main : theme.palette.grey[400],
  opacity: active ? 1 : 0.5,
  transition: "background 0.2s, opacity 0.2s",
  cursor: "pointer",
}));

/**
 * Компонент для отображения изображения предложения
 * @param {Object} props - Свойства компонента
 * @param {string} props.image - Устаревшее поле с одиночным изображением
 * @param {Array} props.images - Массив изображений
 * @param {string} props.title - Заголовок предложения
 */
const OfferImage = ({ image, images, title }) => {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Собираем массив изображений
  let imageList = [];
  if (Array.isArray(images) && images.length > 0) {
    imageList = images.map((img) => {
      if (typeof img === "string") return img;
      if (typeof img === "object" && img !== null)
        return img.url || img.path || img.image || image;
      return image;
    });
  } else if (image) {
    imageList = [image];
  }

  // Формируем src для каждого изображения
  const getSrc = (src) => {
    if (
      src &&
      !src.startsWith("http://") &&
      !src.startsWith("https://") &&
      !src.startsWith("/uploads/")
    ) {
      return `/uploads/images/${src}`;
    }
    return src;
  };

  // Свайп на мобильных
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const dx = touchEndX.current - touchStartX.current;
      if (Math.abs(dx) > 40) {
        if (dx > 0) prevImage();
        else nextImage();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const nextImage = () => setIndex((prev) => (prev + 1) % imageList.length);
  const prevImage = () =>
    setIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  const goToImage = (i) => setIndex(i);

  if (imageList.length <= 1) {
    // Одиночное изображение
    return (
      <ImageWrapper
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Image
          src={
            getSrc(imageList[0]) ||
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
  }

  // Слайдер изображений
  return (
    <ImageWrapper
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {imageList.map((img, i) => (
        <Fade in={i === index} key={i} timeout={320} unmountOnExit>
          <Image
            src={
              getSrc(img) ||
              `https://placehold.co/600x400?text=${encodeURIComponent(
                "Нет изображения"
              )}`
            }
            alt={title}
            loading="lazy"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/600x400?text=${encodeURIComponent(
                "Ошибка загрузки"
              )}`;
            }}
          />
        </Fade>
      ))}
      {/* Стрелки только при hover (desktop) */}
      {hovered && (
        <>
          <ArrowButton
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            sx={{ left: 8 }}
            size="small"
          >
            <ChevronLeftIcon />
          </ArrowButton>
          <ArrowButton
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            sx={{ right: 8 }}
            size="small"
          >
            <ChevronRightIcon />
          </ArrowButton>
        </>
      )}
      {/* Индикаторы (точки) */}
      <Dots>
        {imageList.map((_, i) => (
          <Dot
            key={i}
            active={i === index ? 1 : 0}
            onClick={(e) => {
              e.stopPropagation();
              goToImage(i);
            }}
          />
        ))}
      </Dots>
    </ImageWrapper>
  );
};

OfferImage.propTypes = {
  image: PropTypes.string,
  images: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string.isRequired,
};

export default OfferImage;
