import {
  LocalOffer as OfferIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Message as MessageIcon,
  AddBox as AddBoxIcon,
  ListAlt as ListAltIcon,
  AccountCircle,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";

// Сервисные пункты (левое меню)
export const mainMenuItems = [
  {
    key: "offers",
    label: "offers",
    path: "/offers",
    icon: <OfferIcon />,
    show: (user) => true,
  },
  {
    key: "favorites",
    label: "favorites",
    path: "/favorites",
    icon: <FavoriteBorderIcon />,
    show: (user) => !!user,
  },
  {
    key: "chat",
    label: "chat",
    path: "/chat-list",
    icon: <MessageIcon />,
    show: (user) => !!user,
  },
  {
    key: "create_offer",
    label: "create_offer",
    path: "/create-offer",
    icon: <AddBoxIcon />,
    show: (user) => user && (user.role === "provider" || user.role === "admin"),
  },
  {
    key: "my_offers",
    label: "my_offers",
    path: "/my-offers",
    icon: <ListAltIcon />,
    show: (user) => user && (user.role === "provider" || user.role === "admin"),
  },
  {
    key: "my_requests",
    label: "my_requests",
    path: "/my-requests",
    icon: <ListAltIcon />,
    show: (user) => !!user,
  },
];

// Пользовательское меню (Drawer/аватар)
export const userMenuItems = [
  {
    key: "profile",
    label: "profile",
    path: "/profile",
    icon: <AccountCircle />,
    show: (user) => !!user,
  },
  {
    key: "admin_panel",
    label: "admin_panel",
    path: "/admin",
    icon: <AdminPanelSettingsIcon />,
    show: (user) => user && user.role === "admin",
  },
  {
    key: "notifications",
    label: "notifications",
    path: "/notifications",
    icon: <NotificationsIcon />,
    show: (user) => !!user,
  },
  {
    key: "logout",
    label: "logout",
    icon: <LogoutIcon />,
    isLogout: true,
    show: (user) => !!user,
  },
  {
    key: "login",
    label: "login",
    path: "/login",
    icon: <AccountCircle />,
    show: (user) => !user,
  },
];
