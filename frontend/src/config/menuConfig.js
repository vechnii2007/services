import {
  Home,
  Person,
  Favorite,
  Chat,
  LocalOffer,
  Assignment,
  AdminPanelSettings,
  Group,
  Category,
  Payment,
  Add,
  List,
  Login,
  PersonAdd,
} from "@mui/icons-material";

export const menuConfig = {
  public: [
    {
      id: "home",
      label: "home",
      path: "/",
      icon: Home,
    },
    {
      id: "offers",
      label: "offers",
      path: "/offers",
      icon: LocalOffer,
    },
  ],
  authenticated: [
    {
      id: "profile",
      label: "profile",
      path: "/profile",
      icon: Person,
    },
  ],
  roleSpecific: {
    user: [
      {
        group: "requests",
        items: [
          {
            id: "create-request",
            label: "create_request",
            path: "/create-request",
            icon: Add,
          },
          {
            id: "my-requests",
            label: "my_requests",
            path: "/my-requests",
            icon: List,
          },
        ],
      },
      {
        group: "personal",
        items: [
          {
            id: "favorites",
            label: "favorites",
            path: "/favorites",
            icon: Favorite,
          },
          {
            id: "chat-list",
            label: "chat_list",
            path: "/chat-list",
            icon: Chat,
          },
          {
            id: "payment-dashboard",
            label: "payment_dashboard",
            path: "/payment-dashboard",
            icon: Payment,
          },
        ],
      },
    ],
    provider: [
      {
        group: "offers",
        items: [
          {
            id: "create-offer",
            label: "create_offer",
            path: "/create-offer",
            icon: Add,
          },
          {
            id: "my-offers",
            label: "my_offers",
            path: "/my-offers",
            icon: LocalOffer,
          },
        ],
      },
      {
        group: "requests",
        items: [
          {
            id: "provider-requests",
            label: "provider_requests",
            path: "/provider-requests",
            icon: Assignment,
          },
        ],
      },
      {
        group: "communication",
        items: [
          {
            id: "chat-list",
            label: "chat_list",
            path: "/chat-list",
            icon: Chat,
          },
        ],
      },
    ],
    admin: [
      {
        group: "management",
        items: [
          {
            id: "admin-panel",
            label: "admin_panel",
            path: "/admin",
            icon: AdminPanelSettings,
          },
          {
            id: "admin-users",
            label: "users",
            path: "/users",
            icon: Group,
          },
          {
            id: "admin-categories",
            label: "categories",
            path: "/categories",
            icon: Category,
          },
        ],
      },
      {
        group: "offers",
        items: [
          {
            id: "admin-create-offer",
            label: "create_offer",
            path: "/create-offer",
            icon: Add,
          },
          {
            id: "admin-my-offers",
            label: "my_offers",
            path: "/my-offers",
            icon: LocalOffer,
          },
        ],
      },
    ],
  },
  unauthorized: [
    {
      id: "login",
      label: "login",
      path: "/login",
      icon: Login,
    },
    {
      id: "register",
      label: "register",
      path: "/register",
      icon: PersonAdd,
    },
  ],
};
