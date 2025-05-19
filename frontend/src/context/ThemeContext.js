import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";
import lightTheme from "../theme/lightTheme";
import darkTheme from "../theme/darkTheme";

const ThemeContext = createContext();

export const ThemeProviderCustom = ({ children }) => {
  // Проверяем localStorage или предпочитаемую тему системы
  const getInitialMode = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("themeMode");
      if (saved === "light" || saved === "dark") return saved;
      // Автоопределение по системной теме
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return "dark";
      }
    }
    return "light";
  };

  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const theme = useMemo(
    () => (mode === "dark" ? darkTheme : lightTheme),
    [mode]
  );

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeContext);
