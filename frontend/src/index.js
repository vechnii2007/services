import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./i18n"; // Импортируем конфигурацию i18next
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <AuthProvider>
    <SocketProvider>
      <App />
    </SocketProvider>
  </AuthProvider>
);

reportWebVitals();
