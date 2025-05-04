import React from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import { styled } from "@mui/material/styles";
import CategoryCard from "./CategoryCard";
import PropTypes from "prop-types";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
// Import required modules
import { Navigation, Mousewheel, Keyboard, Pagination } from "swiper/modules";

const SliderContainer = styled(Box)(({ theme, isMobile }) => ({
  position: "relative",
  width: "100vw",
  left: "50%",
  right: "50%",
  marginLeft: "-50vw",
  marginRight: "-50vw",
  boxSizing: "border-box",
  marginBottom: theme.spacing(4),
  ...(isMobile && {
    paddingLeft: theme.spacing(2.5),
    paddingRight: theme.spacing(2.5),
  }),
  "& .swiper": {
    width: "100%",
    height: "100%",
    padding: theme.spacing(2, 0),
  },
  "& .swiper-slide": {
    width: "auto",
    height: "auto",
    display: "flex",
    justifyContent: "center",
  },
  "&:before, &:after": {
    content: '""',
    position: "absolute",
    top: 0,
    width: 32,
    height: "100%",
    zIndex: 2,
    pointerEvents: "none",
  },
  "&:before": {
    left: 0,
    background:
      "linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0))",
  },
  "&:after": {
    right: 0,
    background:
      "linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0))",
  },
  "& .swiper-button-next, & .swiper-button-prev": {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.background.paper,
    width: 40,
    height: 40,
    borderRadius: "50%",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
    "&:after": {
      fontSize: "20px",
    },
    "&:hover": {
      backgroundColor: theme.palette.background.paper,
      transform: "scale(1.1)",
    },
    "&.swiper-button-disabled": {
      opacity: 0.35,
      cursor: "auto",
      pointerEvents: "none",
    },
    // Скрываем навигационные кнопки на мобильных устройствах
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  "& .swiper-button-prev": {
    left: 0,
  },
  "& .swiper-button-next": {
    right: 0,
  },
  // Стилизация пагинации для мобильных устройств
  "& .swiper-pagination": {
    [theme.breakpoints.down("sm")]: {
      display: "block",
      bottom: -5,
    },
    display: "none",
  },
  "& .swiper-pagination-bullet": {
    backgroundColor: theme.palette.grey[400],
    opacity: 0.5,
    width: 6,
    height: 6,
  },
  "& .swiper-pagination-bullet-active": {
    backgroundColor: theme.palette.primary.main,
    opacity: 1,
  },
}));

const CategorySlider = ({
  categories = [],
  selectedCategory,
  onCategorySelect,
  counts = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!categories?.length) return null;

  return (
    <SliderContainer isMobile={isMobile}>
      <Swiper
        modules={[Navigation, Mousewheel, Keyboard, Pagination]}
        breakpoints={{
          0: { slidesPerView: 3.5, spaceBetween: 10 },
          360: { slidesPerView: 3.8, spaceBetween: 12 },
          400: { slidesPerView: 4.2, spaceBetween: 12 },
          500: { slidesPerView: 5, spaceBetween: 12 },
          600: { slidesPerView: "auto", spaceBetween: 12 },
          900: { slidesPerView: "auto", spaceBetween: 16 },
        }}
        navigation={!isMobile}
        pagination={{ clickable: true, dynamicBullets: true }}
        mousewheel={true}
        keyboard={{
          enabled: true,
        }}
        grabCursor={true}
        centeredSlides={false}
        slidesOffsetBefore={0}
        slidesOffsetAfter={0}
      >
        {categories.map((category) => (
          <SwiperSlide key={category.name}>
            <CategoryCard
              category={category}
              selected={selectedCategory === category.name}
              onClick={() => onCategorySelect?.(category.name)}
              count={counts[category.name] || 0}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </SliderContainer>
  );
};

CategorySlider.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string,
      image: PropTypes.string,
      description: PropTypes.string,
    })
  ),
  selectedCategory: PropTypes.string,
  onCategorySelect: PropTypes.func,
  counts: PropTypes.object,
};

CategorySlider.defaultProps = {
  categories: [],
  counts: {},
  onCategorySelect: () => {},
};

export default CategorySlider;
