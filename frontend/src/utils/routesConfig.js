import Offers from '../pages/Offers';
import OfferDetails from '../pages/OfferDetails';
import Register from '../pages/Register';
import Login from '../pages/Login';
import CreateOffer from '../pages/CreateOffer';
import MyOffers from '../pages/MyOffers';
import ServiceRequestForm from '../pages/ServiceRequestForm';
import MyRequests from '../pages/MyRequests';
import ProviderRequests from '../pages/ProviderRequests';
import ChatList from '../pages/ChatList';
import Chat from '../pages/Chat';
import Favorites from '../pages/Favorites';
import PaymentDashboard from '../pages/PaymentDashboard';
import Profile from '../pages/Profile';
import AdminPanel from '../pages/AdminPanel';

export const routesConfig = [
    { path: '/offers', element: <Offers />, requiredRole: null },
    { path: '/offers/:id', element: <OfferDetails />, requiredRole: null },
    { path: '/register', element: <Register />, requiredRole: null },
    { path: '/login', element: <Login />, requiredRole: null },
    { path: '/create-offer', element: <CreateOffer />, requiredRole: ['provider', 'admin'] },
    { path: '/my-offers', element: <MyOffers />, requiredRole: ['provider', 'admin'] },
    { path: '/create-request', element: <ServiceRequestForm />, requiredRole: 'user' },
    { path: '/my-requests', element: <MyRequests />, requiredRole: 'user' },
    { path: '/provider-requests', element: <ProviderRequests />, requiredRole: 'provider' },
    { path: '/chat-list', element: <ChatList />, requiredRole: ['user', 'provider'] },
    { path: '/chat/:requestId', element: <Chat />, requiredRole: ['user', 'provider'] },
    { path: '/favorites', element: <Favorites />, requiredRole: ['user', 'provider', 'admin'] },
    { path: '/payment-dashboard', element: <PaymentDashboard />, requiredRole: ['user', 'provider', 'admin'] },
    { path: '/profile', element: <Profile />, requiredRole: ['user', 'provider', 'admin'] },
    { path: '/admin-panel', element: <AdminPanel />, requiredRole: 'admin' },
];