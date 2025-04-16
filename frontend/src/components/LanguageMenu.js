import React from 'react';
import { Menu, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';

const LanguageMenu = ({ anchorEl, onClose }) => {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        onClose();
    };

    return (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
            <MenuItem onClick={() => changeLanguage('ru')}>{t('russian')}</MenuItem>
            <MenuItem onClick={() => changeLanguage('ua')}>{t('ukrainian')}</MenuItem>
            <MenuItem onClick={() => changeLanguage('es')}>{t('spanish')}</MenuItem>
        </Menu>
    );
};

export default LanguageMenu;