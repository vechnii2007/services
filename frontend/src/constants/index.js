// Здесь могут быть другие константы

export const ROUTES = {
  HOME: "/",
  OFFERS: "/offers",
  OFFER_DETAILS: "/offers/:id",
  ADMIN: "/admin",
  PROFILE: "/profile",
  LOGIN: "/login",
  REGISTER: "/register",
};

export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
};

export const OFFER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  REJECTED: "rejected",
};

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  MODERATOR: "moderator",
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_PAGE: 1,
};
