import { useNavigate /* , Link */ } from 'react-router-dom';
import { useEffect } from 'react';

const MyOffers = () => {
    const navigate = useNavigate();
    const t = useTranslation();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [loading, navigate, user, t]);

    const handleDelete = async (offerId) => {
        try {
            await deleteOffer(offerId);
            // const res = await deleteOffer(offerId);
            fetchOffers();
        } catch (error) {
            console.error('Error deleting offer:', error);
        }
    };

    return (
        // ... existing code ...
    );
};

export default MyOffers; 