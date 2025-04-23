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
  },
  "& .swiper-button-next, & .swiper-button-prev": {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.background.paper,
    width: 40,
    height: 40,
    borderRadius: "50%",
    boxShadow: theme.shadows[2],
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
    left: theme.spacing(1),
  },
  "& .swiper-button-next": {
    right: theme.spacing(1),
  },
}));

const CategorySlider = ({
  categories = [],
  selectedCategory,
  onCategorySelect,
  counts = {},
}) => {
  const { t } = useTranslation();

  console.log("[CategorySlider] Rendering with props:", {
    categoriesCount: categories?.length,
    selectedCategory,
    categoriesWithCounts: categories?.map((cat) => ({
      name: cat.name,
      count: counts[cat.name] || 0,
      isSelected: selectedCategory === cat.name,
    })),
  });

  if (!categories?.length) {
    console.log("[CategorySlider] No categories available, returning null");
    return null;
  }

  const handleCategoryClick = (category) => {
    console.log("[CategorySlider] Category clicked:", {
      category: category.name,
      wasSelected: selectedCategory === category.name,
      willBeSelected: selectedCategory !== category.name,
      currentCount: counts[category.name] || 0,
    });

    onCategorySelect?.(category);
  };

  return (
    <SliderContainer>
      <Swiper
        modules={[Navigation, Mousewheel, Keyboard]}
        spaceBetween={16}
        slidesPerView="auto"
        navigation={true}
        mousewheel={true}
        keyboard={{
          enabled: true,
        }}
        grabCursor={true}
        onSlideChange={(swiper) => {
          console.log("[CategorySlider] Slide changed:", {
            activeIndex: swiper.activeIndex,
            activeCategory: categories[swiper.activeIndex]?.name,
          });
        }}
        onSwiper={(swiper) => {
          console.log("[CategorySlider] Swiper initialized:", {
            slidesCount: swiper.slides.length,
            activeIndex: swiper.activeIndex,
          });
        }}
      >
        {categories.map((category) => (
          <SwiperSlide key={category.name}>
            <CategoryCard
              category={category}
              selected={selectedCategory === category.name}
              onClick={() => handleCategoryClick(category)}
              count={counts?.[category.name] || 0}
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
