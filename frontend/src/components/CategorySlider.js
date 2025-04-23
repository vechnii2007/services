import React from "react";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import CategoryCard from "./CategoryCard";
import PropTypes from "prop-types";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
// Import required modules
import { Navigation, Mousewheel, Keyboard } from "swiper/modules";

const SliderContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  boxSizing: "border-box",
  padding: "0 40px",
  marginBottom: theme.spacing(4),
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
  },
  "& .swiper-button-prev": {
    left: 0,
  },
  "& .swiper-button-next": {
    right: 0,
  },
}));

const CategorySlider = ({
  categories = [],
  selectedCategory,
  onCategorySelect,
  counts = {},
}) => {
  const { t } = useTranslation();

  if (!categories?.length) return null;

  return (
    <SliderContainer>
      <Swiper
        modules={[Navigation, Mousewheel, Keyboard]}
        spaceBetween={16}
        slidesPerView="auto"
        navigation={true}
        mousewheel={false}
        keyboard={{
          enabled: true,
        }}
        grabCursor={true}
      >
        {categories.map((category) => (
          <SwiperSlide key={category.name}>
            <CategoryCard
              category={category}
              selected={selectedCategory === category.name}
              onClick={() => onCategorySelect?.(category)}
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
