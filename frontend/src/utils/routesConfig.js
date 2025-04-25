import Offers from "../pages/Offers";
import OfferDetails from "../pages/OfferDetails";
import Register from "../pages/Register";
import Login from "../pages/Login";
import CreateOffer from "../pages/CreateOffer";
import MyOffers from "../pages/MyOffers";
import ServiceRequestForm from "../pages/ServiceRequestForm";
import MyRequests from "../pages/MyRequests";
import ProviderRequests from "../pages/ProviderRequests";
import ChatList from "../pages/ChatList";
import Chat from "../pages/Chat";
import ChatTester from "../pages/ChatTester";
import Favorites from "../pages/Favorites";
import PaymentDashboard from "../pages/PaymentDashboard";
import Profile from "../pages/Profile";
import Landing from "../pages/Landing";
import AdminPanel from "../components/AdminPanel/AdminPanelTabs";
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

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

  return <Favorites />;
};

export const routesConfig = [
  { path: "/", element: <Landing />, requiredRole: null },
  { path: "/offers", element: <Offers />, requiredRole: null },
  { path: "/offers/:id", element: <OfferDetails />, requiredRole: null },
  { path: "/register", element: <Register />, requiredRole: null },
  { path: "/login", element: <Login />, requiredRole: null },
  {
    path: "/create-offer",
    element: <CreateOffer />,
    requiredRole: ["provider", "admin"],
  },
  {
    path: "/my-offers",
    element: <MyOffers />,
    requiredRole: ["provider", "admin"],
  },
  {
    path: "/create-request",
    element: <ServiceRequestForm />,
    requiredRole: "user",
  },
  { path: "/my-requests", element: <MyRequests />, requiredRole: "user" },
  {
    path: "/provider-requests",
    element: <ProviderRequests />,
    requiredRole: "provider",
  },
  {
    path: "/chat-list",
    element: <ChatList />,
    requiredRole: ["user", "provider"],
  },
  {
    path: "/chat/:requestId",
    element: <Chat />,
    requiredRole: ["user", "provider"],
  },
  {
    path: "/chat-tester",
    element: <ChatTester />,
    requiredRole: ["user", "provider", "admin"],
  },
  {
    path: "/chat-tester/:requestId",
    element: <ChatTester />,
    requiredRole: ["user", "provider", "admin"],
  },
  {
    path: "/favorites",
    element: <FavoritesWithAuth />,
    requiredRole: ["user", "provider", "admin"],
  },
  {
    path: "/payment-dashboard",
    element: <PaymentDashboard />,
    requiredRole: ["user", "provider", "admin"],
  },
  {
    path: "/profile",
    element: <Profile />,
    requiredRole: ["user", "provider", "admin"],
  },
  { path: "/admin", element: <AdminPanel />, requiredRole: "admin" }, // Переименован маршрут
];
