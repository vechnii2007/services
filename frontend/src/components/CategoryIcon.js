import React from "react";
import PropTypes from "prop-types";
import {
  School,
  LocalHospital,
  Gavel,
  Translate,
  Home,
  Event,
  AccountBalance,
  DirectionsCar,
  Build,
  ShoppingCart,
  FlightTakeoff,
  Psychology,
  Plumbing,
  Spa,
  CleaningServices,
  AutoStories,
  LocalShipping,
} from "@mui/icons-material";

const iconMap = {
  education: School,
  healthcare: LocalHospital,
  legal: Gavel,
  translation: Translate,
  real_estate: Home,
  cultural_events: Event,
  finance: AccountBalance,
  transport: DirectionsCar,
  household: Build,
  shopping: ShoppingCart,
  travel: FlightTakeoff,
  psychology: Psychology,
  plumbing: Plumbing,
  massage: Spa,
  cleaning: CleaningServices,
  taro: AutoStories,
  evacuation: LocalShipping,
};

const CategoryIcon = ({ category, ...props }) => {
  const Icon = iconMap[category] || Build;
  return <Icon {...props} />;
};

CategoryIcon.propTypes = {
  category: PropTypes.string.isRequired,
};

export default CategoryIcon;
