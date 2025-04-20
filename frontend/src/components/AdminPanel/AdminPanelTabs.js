import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import UsersTab from './UsersTab';
import RequestsTab from './RequestsTab';
import OffersTab from './OffersTab';
import CategoriesTab from './CategoriesTab';

const AdminPanelTabs = () => {
    const { t } = useTranslation();
    const [tabValue, setTabValue] = useState(0);

    const handleChangeTab = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Box sx={{ padding: 4 }}>
            <Typography variant="h4" gutterBottom>
                {t('admin_panel')}
            </Typography>
            <Tabs value={tabValue} onChange={handleChangeTab} sx={{ marginBottom: 4 }}>
                <Tab label={t('users')} />
                <Tab label={t('requests')} />
                <Tab label={t('offers')} />
                <Tab label={t('categories')} />
            </Tabs>

            {tabValue === 0 && <UsersTab />}
            {tabValue === 1 && <RequestsTab />}
            {tabValue === 2 && <OffersTab />}
            {tabValue === 3 && <CategoriesTab />}
        </Box>
    );
};

export default AdminPanelTabs;