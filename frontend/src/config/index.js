// API Configuration
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";
export const API_PREFIX = "/api";
export const API_BASE_URL = API_BASE.endsWith("/api")
  ? API_BASE.slice(0, -4)
  : API_BASE;

// Routes Configuration
export const ROUTES = {
  HOME: "/",
  OFFERS: "/offers",
  OFFER_DETAILS: "/offers/:id",
  ADMIN: "/admin",
  PROFILE: "/profile",
  LOGIN: "/login",
  REGISTER: "/register",
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
};

// Offer Status
export const OFFER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  REJECTED: "rejected",
};

// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  MODERATOR: "moderator",
};

// Pagination Settings
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_PAGE: 1,
  OFFERS_PER_PAGE: 10,
};

// Image Heights
export const CATEGORY_IMAGE_HEIGHT = 150;
export const OFFER_IMAGE_HEIGHT = 200;

// Menu Configuration
export const MENU_ITEMS = {
  PUBLIC: [
    { path: ROUTES.HOME, label: "home" },
    { path: ROUTES.OFFERS, label: "offers" },
  ],
  USER: [
    { path: "/my-requests", label: "my_requests" },
    { path: "/favorites", label: "favorites" },
    { path: "/chat-list", label: "messages" },
  ],
  PROVIDER: [
    { path: "/my-offers", label: "my_offers" },
    { path: "/provider-requests", label: "provider_requests" },
    { path: "/chat-list", label: "messages" },
  ],
  ADMIN: [
    { path: ROUTES.ADMIN, label: "admin_panel" },
    { path: "/users", label: "users" },
    { path: "/categories", label: "categories" },
  ],
};

// Helper function to get full API URL
export const getFullApiUrl = (path) => {
  if (path.includes("/api/api/")) {
    console.warn("Detected duplicate /api in URL:", path);
    return path.replace("/api/api/", "/api/");
  }

  const cleanPath = path.startsWith("/api/") ? path.substring(4) : path;
  const normalizedPath = cleanPath.startsWith("/")
    ? cleanPath
    : `/${cleanPath}`;

  return `${API_PREFIX}${normalizedPath}`;
};
