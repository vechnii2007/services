export const menuConfig = (user, t) => {
    if (!user) {
        return [{ label: t('offers'), path: '/offers' }];
    }

    if (user.role === 'user') {
        return [
            { label: t('offers'), path: '/offers' },
            { label: t('create_request'), path: '/create-request' },
            { label: t('my_requests'), path: '/my-requests' },
            { label: t('favorites'), path: '/favorites' },
            { label: t('chat_list'), path: '/chat-list' },
            { label: t('payment_dashboard'), path: '/payment-dashboard' },
            { label: t('profile'), path: '/profile' },
        ];
    }

    if (user.role === 'provider') {
        return [
            { label: t('offers'), path: '/offers' },
            { label: t('create_offer'), path: '/create-offer' },
            { label: t('my_offers'), path: '/my-offers' },
            { label: t('available_requests'), path: '/provider-requests' },
            { label: t('favorites'), path: '/favorites' },
            { label: t('chat_list'), path: '/chat-list' },
            { label: t('payment_dashboard'), path: '/payment-dashboard' },
            { label: t('profile'), path: '/profile' },
        ];
    }

    if (user.role === 'admin') {
        return [
            { label: t('offers'), path: '/offers' },
            { label: t('create_offer'), path: '/create-offer' },
            { label: t('my_offers'), path: '/my-offers' },
            { label: t('admin_panel'), path: '/admin-panel' },
            { label: t('favorites'), path: '/favorites' },
            { label: t('payment_dashboard'), path: '/payment-dashboard' },
            { label: t('profile'), path: '/profile' },
        ];
    }

    return [];
};