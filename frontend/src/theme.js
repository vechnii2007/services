import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#4F46E5', // Аналог primary из Tailwind
        },
        secondary: {
            main: '#10B981', // Аналог secondary из Tailwind
        },
        background: {
            default: '#F9FAFB', // Аналог background из Tailwind
            paper: '#FFFFFF', // Белый фон для карточек
        },
        text: {
            primary: '#1F2937', // Аналог text из Tailwind
        },
    },
    typography: {
        fontFamily: 'Inter, sans-serif', // Используем шрифт Inter
    },
});

export default theme;