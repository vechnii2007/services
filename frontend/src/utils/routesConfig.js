import React, { useContext, lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Ленивая загрузка компонентов
const Offers = lazy(() => import("../pages/Offers"));
const OfferDetails = lazy(() => import("../pages/OfferDetails"));
const Register = lazy(() => import("../pages/Register"));
const Login = lazy(() => import("../pages/Login"));
const CreateOffer = lazy(() => import("../pages/CreateOffer"));
const MyOffers = lazy(() => import("../pages/MyOffers"));
const ServiceRequestForm = lazy(() => import("../pages/ServiceRequestForm"));
const MyRequests = lazy(() => import("../pages/MyRequests"));
const ProviderRequests = lazy(() => import("../pages/ProviderRequests"));
const ChatList = lazy(() => import("../pages/ChatList"));
const Favorites = lazy(() => import("../pages/Favorites"));
const PaymentDashboard = lazy(() => import("../pages/PaymentDashboard"));
const Profile = lazy(() => import("../pages/Profile"));
const Landing = lazy(() => import("../pages/Landing"));
const AdminPanel = lazy(() =>
  import("../components/AdminPanel/AdminPanelTabs")
);
const Notifications = lazy(() => import("../pages/Notifications"));
const RequestDetails = lazy(() => import("../pages/RequestDetails"));
const ProfileById = lazy(() => import("../pages/ProfileById"));
const OauthSuccess = lazy(() => import("../pages/OauthSuccess"));

// Компонент загрузки для Suspense
const Loading = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    Загрузка...
  </div>
);

// Проверка авторизации для страницы Favorites
const FavoritesWithAuth = () => {
  const { loading } = useContext(AuthContext);

  // Проверяем наличие токена перед рендерингом
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Во время загрузки данных о пользователе ничего не показываем
  if (loading) {
    return null;
  }

  return (
    <Suspense fallback={<Loading />}>
      <Favorites />
    </Suspense>
  );
};

// Обертка с Suspense для всех компонентов
const withSuspense = (Component) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
);

// Стабильная ссылка на компонент Offers для предотвращения ненужных перерендеров
const MemoizedOffers = React.memo(Offers);
const OffersPage = () => (
  <Suspense fallback={<Loading />}>
    <MemoizedOffers />
  </Suspense>
);

export const routesConfig = [
  { path: "/", element: withSuspense(Landing), requiredRole: null },
  { path: "/offers", element: <OffersPage />, requiredRole: null },
  {
    path: "/offers/:id",
    element: withSuspense(OfferDetails),
    requiredRole: null,
  },
  { path: "/register", element: withSuspense(Register), requiredRole: null },
  { path: "/login", element: withSuspense(Login), requiredRole: null },
  {
    path: "/create-offer",
    element: withSuspense(CreateOffer),
    requiredRole: ["provider", "admin"],
  },
  {
    path: "/my-offers",
    element: withSuspense(MyOffers),
    requiredRole: ["provider", "admin"],
  },
  {
    path: "/create-request",
    element: withSuspense(ServiceRequestForm),
    requiredRole: "user",
  },
  {
    path: "/my-requests",
    element: withSuspense(MyRequests),
    requiredRole: ["user", "provider", "admin"],
  },
  {
    path: "/provider-requests",
    element: withSuspense(ProviderRequests),
    requiredRole: "provider",
  },
  {
    path: "/chat-list",
    element: withSuspense(ChatList),
    requiredRole: ["user", "provider"],
  },
  {
    path: "/favorites",
    element: <FavoritesWithAuth />,
    requiredRole: ["user", "provider", "admin"],
  },
  {
    path: "/payment-dashboard",
    element: withSuspense(PaymentDashboard),
    requiredRole: ["user", "provider", "admin"],
  },
  {
    path: "/profile",
    element: withSuspense(Profile),
    requiredRole: ["user", "provider", "admin"],
  },
  {
    path: "/profile/:id",
    element: withSuspense(ProfileById),
    requiredRole: null,
  },
  { path: "/admin", element: withSuspense(AdminPanel), requiredRole: "admin" }, // Переименован маршрут
  {
    path: "/notifications",
    element: withSuspense(Notifications),
    requiredRole: null,
  },
  {
    path: "/requests/:id",
    element: withSuspense(RequestDetails),
    requiredRole: null,
  },
  {
    path: "/oauth-success",
    element: withSuspense(OauthSuccess),
    requiredRole: null,
  },
];
